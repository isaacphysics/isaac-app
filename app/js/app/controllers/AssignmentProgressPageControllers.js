/**
 * Copyright 2015 Luke McLean
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at
 * 		http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
define([], function() {

    let PageController = ['$scope', 'auth', 'api', 'gameBoardTitles', '$timeout', function(scope, auth, api, gameBoardTitles, $timeout) {
        scope.setLoading(true);

        scope.generateGameBoardTitle = gameBoardTitles.generate;

        scope.isUserStaff = function() {
            return scope.user.role == 'ADMIN' || scope.user.role == "CONTENT_EDITOR" || scope.user.role == "EVENT_MANAGER";
        };

        scope.groups = [];
        scope.groupExpanded = {}; // Key will be group ID, value bool
        scope.groupAssignments = {}; // Key will be group ID, value will be list of assignments
        scope.assignments = {}; // Key will be assignment ID, value will be assignment
        scope.assignmentExpanded = {}; // Key will be assignment ID, value bool
        scope.assignmentProgress = {}; // Key will be assignment ID, value progress for that assignment.
        scope.assignmentSelectedQuestion = {}; // Key will be assignment ID, value will be index of selected question.
        scope.assignmentAverages = {}; // Key will be assignment ID, value list of averages. One per question.
        scope.assignmentTotalQuestionParts = {}; // Key - assignment ID, value - questionPartTotal 
        scope.assignmentCSVLink = null;
        scope.passMark = 0.75;
        scope.pageSettings = {
            colourBlind: false,
            formatAsPercentage: false
        };
        scope.questionPageLabel = "questionPage";

        let myGroupsPromise = api.groupManagementEndpoint.get({"archived_groups_only":false}).$promise;
        let mySetAssignmentsPromise = api.assignments.getAssignmentsOwnedByMe().$promise;

        scope.groupSortOptions = [
            {label: "Alphabetical", value: "groupName", reverse: false},
            {label: "Date Created", value: "created", reverse: true}
        ];
        scope.groupSortOption = scope.groupSortOptions[0];

        Promise.all([myGroupsPromise, mySetAssignmentsPromise]).then(function(r) {
            let groups = r[0];
            let allAssignments = r[1];

            // Initialise master lists of groups and assignments.
            scope.groups = groups;

            for (let i = 0; i < allAssignments.length; i++) {
                let a = allAssignments[i];
                let groupId = a.groupId;

                scope.groupAssignments[groupId] = scope.groupAssignments[groupId] || [];
                scope.groupAssignments[groupId].push(a);

                scope.groupExpanded[groupId] = false;
            }
            scope.setLoading(false);
        });

        // this function moves the gameboard title resolution to happen as needed rather than for all assignments that could ever be displayed.
        scope.expandAssignments = function(groupId) {
            let gameboardPromises = [];

            if (scope.groupExpanded[groupId]) {
                // This group is already expanded. Collapse it and return.
                scope.groupExpanded[groupId] = false;
                return;
            } else if (!scope.groupAssignments[groupId]) {
                // This group has no assignments
                return;
            }

            
            scope.setLoading(true);

            for (let i = 0; i < scope.groupAssignments[groupId].length; i++) {
                let assignment = scope.groupAssignments[groupId][i];

                assignment.gameBoard = api.gameBoards.get({id: assignment.gameboardId});
                gameboardPromises.push(assignment.gameBoard.$promise);
                // assignment local sort options
                assignment.pupilSortOptions = {
                    familyName: {value: 'user.familyName', reverse: false},
                    totalQuestionPercentage: {value: 'tickCount', reverse: true},
                    totalQuestionPartPercentage: {value: 'correctQuestionPartsCount', reverse: true}
                };
                assignment.pupilSortOption = assignment.pupilSortOptions.familyName;
                assignment.sortPupilsBy = function (property) {
                    let sortOptionToSet = this.pupilSortOptions[property];
                    if (sortOptionToSet == this.pupilSortOption) {
                        this.pupilSortOption.reverse = !this.pupilSortOption.reverse;  
                    } else if (sortOptionToSet != undefined) {
                        this.pupilSortOption = sortOptionToSet;
                    } else {
                        console.error("Property '" + property + "' is not a valid pupilSortOption");
                    }
                };
                scope.assignments[assignment._id] = assignment;
            }

            Promise.all(gameboardPromises).then(function() {
                // add a sort option for each question in each assignment
                scope.groupAssignments[groupId].forEach(function (assignment) {
                    assignment.gameBoard.questions.forEach(function (question, index) {
                        assignment.pupilSortOptions[scope.questionPageLabel + index] = {value: scope.questionPageLabel + index, reverse: true};
                    });
                });
                scope.setLoading(false);
                scope.$apply();
                scope.groupExpanded[groupId] = true;
            });
        };

        scope.$watchCollection("assignmentExpanded", function() {
            for (let k in scope.assignmentExpanded) {
                if (scope.assignmentExpanded[k] && !scope.assignmentProgress[k]) {
                    scope.setLoading(true);
                    scope.assignmentProgress[k] = api.assignments.getProgress({assignmentId: k});

                    scope.assignmentProgress[k].$promise.then(function(k, progress) {
                        scope.setLoading(false);

                        scope.assignments[k].gameBoard.$promise.then(function(gameBoard) {

                            // Calculate 'class average', which isn't an average at all, it's the percentage of ticks per question.
                            let questions = gameBoard.questions;
                            scope.assignmentAverages[k] = [];
                            scope.assignmentTotalQuestionParts[k] = 0;
                            
                            for (let i in questions) {
                                let q = questions[i];
                                let tickCount = 0;

                                for (let j = 0; j < progress.length; j++) {
                                    let studentResults = progress[j].results;

                                    if (studentResults[i] == "PASSED" || studentResults[i] == "PERFECT") {
                                        tickCount++;
                                    }
                                }

                                let tickPercent = Math.round(100 * (tickCount / progress.length));
                                scope.assignmentAverages[k].push(tickPercent);
                                scope.assignmentTotalQuestionParts[k] += q.questionPartsTotal;
                            }

                            // Calculate student totals and gameboard totals
                            scope.assignmentProgress[k].studentsCorrect = 0;
                            for (let j = 0; j < progress.length; j++) {

                                let studentProgress = progress[j];

                                if (progress[j].user.authorisedFullAccess) {

                                    studentProgress.tickCount = 0;
                                    studentProgress.correctQuestionPartsCount = 0;
                                    studentProgress.incorrectQuestionPartsCount = 0;
                                    studentProgress.notAttemptedPartResults = [];

                                    for (let i in studentProgress.results) {
                                        if (studentProgress.results[i] == "PASSED" || studentProgress.results[i] == "PERFECT") {
                                            studentProgress.tickCount++;
                                        }
                                        studentProgress.correctQuestionPartsCount += studentProgress.correctPartResults[i];
                                        studentProgress.incorrectQuestionPartsCount += studentProgress.incorrectPartResults[i];
                                        studentProgress.notAttemptedPartResults.push(questions[i].questionPartsTotal - studentProgress.correctPartResults[i] - studentProgress.incorrectPartResults[i]);
                                        // for sorting the table on the particular question, student progress needs a unique attribute name for this value
                                        studentProgress[scope.questionPageLabel + i] = studentProgress.correctPartResults[i];
                                    }

                                    if (studentProgress.tickCount == gameBoard.questions.length) {
                                        scope.assignmentProgress[k].studentsCorrect++;
                                    }

                                }
                            }
                        });
                    }.bind(this, k));
                    scope.assignmentSelectedQuestion[k] = 0;
                }
            }
        });

        scope.formatMark = function(numerator, denominator, formatAsPercentage) {
            let result;
            if (formatAsPercentage) {
                result = Math.round(100 * numerator / denominator) + "%";
            } else {
                result = numerator + "/" + denominator;
            }
            return result;
        };

        scope.getStateClass = function(studentProgress, index, totalParts, colourBlind, selected) {
            let correctParts = index != null ? studentProgress.correctPartResults[index] : studentProgress.correctQuestionPartsCount;
            let incorrectParts = index != null ? studentProgress.incorrectPartResults[index] : studentProgress.incorrectQuestionPartsCount;
            let status = studentProgress.results[index];

            let result = selected ? "selected " : "";
            result += colourBlind ? "colour-blind " : "";
            if (!studentProgress.user.authorisedFullAccess) {
                result += "revoked";
            } else if (correctParts == totalParts) {
                result += "completed";
            } else if (status == "PASSED" || (correctParts / totalParts) >= scope.passMark) {
                result += "passed";
            } else if (status == "FAILED" || (incorrectParts / totalParts) > (1 - scope.passMark)) {
                result += "failed";
            } else if (correctParts > 0 || incorrectParts > 0) {
                result += "in-progress";
            } else {
                result += "not-attempted";
            }
            return result;
        };

        scope.enabledLeftArrow = function(id) {
            return scope.assignmentSelectedQuestion[id] > 0;
        };
        scope.enabledRightArrow = function(id, questionsLength) {
            return scope.assignmentSelectedQuestion[id] < questionsLength - 1;
        };

        scope.$watchCollection("assignmentSelectedQuestion", function(asq) {
            // For each assignment
            for (let a in asq) {
                // Find the table displaying it

                let tbl = $("#assignment-" + a + "-progress");

                if (tbl.length < 1)
                    continue;

                // Find a cell for the selected question (first row will do)

                let td = tbl.find("tr:first td:eq(" + (asq[a]+1) + ")")

                // If that cell is off the screen, scroll to it.

                let newScrollLeft;
                if (td.offset().left < 0) {
                    newScrollLeft = tbl.scrollLeft() + td.offset().left;
                } else if (td.offset().left + td.width() > tbl.parent().width()) {
                    newScrollLeft = tbl.scrollLeft() + td.offset().left - tbl.parent().width() + td.width();
                }

                tbl.animate({
                    scrollLeft: newScrollLeft,
                },200);
            }
        });

        scope.getAssignmentDownloadLink = function(assignmentId, $event) {
            $event.stopPropagation();
            scope.assignmentCSVLink = api.getCSVDownloadLink(assignmentId)
            scope.modals.assignmentProgressCSVDownload.show();

            // return api.getCSVDownloadLink(assignmentId);
        };

        scope.getGroupProgressDownloadLink = function(groupId, $event) {
            $event.stopPropagation();
            scope.assignmentCSVLink = api.getGroupProgressCSVDownloadLink(groupId)
            scope.modals.assignmentProgressCSVDownload.show();

            // return api.getCSVDownloadLink(assignmentId);
        };

        scope.$on('ngRepeatFinished', function(ngRepeatFinishedEvent) {
            $timeout(function(){
                Opentip.findElements();
            });
        });

	}];

	return {
		PageController: PageController
	};
})