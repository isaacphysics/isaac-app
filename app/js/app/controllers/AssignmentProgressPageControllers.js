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

	var PageController = ['$scope', 'auth', 'api', 'gameBoardTitles', '$timeout', function(scope, auth, api, gameBoardTitles, $timeout) {
        $timeout(function() {
            // Call this asynchronously, so that loading icon doesn't get immediately clobbered by $stateChangeSuccess.
            scope.globalFlags.isLoading = true;
        });

        scope.generateGameBoardTitle = gameBoardTitles.generate;

        scope.groups = [];
        scope.groupExpanded = {}; // Key will be group ID, value bool
        scope.groupAssignments = {}; // Key will be group ID, value will be list of assignments
        scope.assignments = {}; // Key will be assignment ID, value will be assignment
        scope.assignmentExpanded = {}; // Key will be assignment ID, value bool
        scope.assignmentProgress = {}; // Key will be assignment ID, value progress for that assignment.
        scope.assignmentSelectedQuestion = {}; // Key will be assignment ID, value will be index of selected question.
        scope.assignmentAverages = {}; // Key will be assignment ID, value list of averages. One per question.

        var myGroupsPromise = api.groupManagementEndpoint.get().$promise;
        var mySetAssignmentsPromise = api.assignments.getAssignmentsOwnedByMe().$promise;

        Promise.all([myGroupsPromise, mySetAssignmentsPromise]).then(function(r) {
            var groups = r[0];
            var allAssignments = r[1];

            // Initialise master lists of groups and assignments.
            scope.groups = groups;


            var gameboardPromises = [];
            for (var i = 0; i < allAssignments.length; i++) {
                var a = allAssignments[i];
                var groupId = a.groupId;

                scope.groupAssignments[groupId] = scope.groupAssignments[groupId] || [];
                scope.groupAssignments[groupId].push(a);

                a.gameBoard = api.gameBoards.get({id: a.gameboardId});
                gameboardPromises.push(a.gameBoard.$promise);

                scope.assignments[a._id] = a;
            }

            Promise.all(gameboardPromises).then(function() {
                scope.globalFlags.isLoading = false;
                scope.$apply();
            });

        })

        scope.$watchCollection("assignmentExpanded", function() {

            for (var k in scope.assignmentExpanded) {
                if (scope.assignmentExpanded[k] && !scope.assignmentProgress[k]) {
                    scope.globalFlags.isLoading = true;
                    scope.assignmentProgress[k] = api.assignments.getProgress({assignmentId: k});

                    scope.assignmentProgress[k].$promise.then(function(progress) {
                        scope.globalFlags.isLoading = false;

                        scope.assignments[k].gameBoard.$promise.then(function(gameBoard) {

                            // Calculate 'class average', which isn't an average at all, it's the percentage of ticks per question.
                            var questions = gameBoard.questions;
                            scope.assignmentAverages[k] = [];

                            for (var i in questions) {
                                var q = questions[i];
                                var tickCount = 0;

                                for (var j = 0; j < progress.length; j++) {
                                    var studentResults = progress[j].results;

                                    if (studentResults[i] == "PASSED" || studentResults[i] == "PERFECT") {
                                        tickCount++;
                                    }
                                }

                                var tickPercent = Math.round(100 * (tickCount / progress.length));
                                scope.assignmentAverages[k].push(tickPercent);
                            }

                            // Calculate student totals and gameboard totals
                            gameBoard.studentsCorrect = 0;

                            for (var j = 0; j < progress.length; j++) {
                                var studentProgress = progress[j];

                                studentProgress.tickCount = 0;
                                for (var i in studentProgress.results) {
                                    if (studentProgress.results[i] == "PASSED" || studentProgress.results[i] == "PERFECT") {
                                        studentProgress.tickCount++;
                                    }
                                }

                                if (studentProgress.tickCount == gameBoard.questions.length) {
                                    gameBoard.studentsCorrect++;
                                }
                            }
                        });
                    })
                    scope.assignmentSelectedQuestion[k] = 0;
                }
            }
        });

        scope.getStudentClass = function(studentProgress) {
            if (!studentProgress.user.authorisedFullAccess)
                return "revoked";

            var questionCount = studentProgress.results.length;
            var stateCounts = {};

            for (var i in studentProgress.results) {
                stateCounts[studentProgress.results[i]] = (stateCounts[studentProgress.results[i]] || 0) + 1; 
            }

            if (stateCounts["PERFECT"] == questionCount)
                return "complete";
            else if (stateCounts["FAILED"] > (questionCount * 0.3))
                return "fail"
            else
                return "";
        };

        scope.$watchCollection("assignmentSelectedQuestion", function(asq) {
            // For each assignment
            for (var a in asq) {
                // Find the table displaying it

                var tbl = $("#assignment-" + a + "-progress");

                if (tbl.length < 1)
                    continue;

                // Find a cell for the selected question (first row will do)

                var td = tbl.find("tr:first td:eq(" + (asq[a]+1) + ")")

                // If that cell is off the screen, scroll to it.

                var newScrollLeft;
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

	}];

	return {
		PageController: PageController
	};
})