/**
 * Copyright 2015 Luke McLean
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import angular from "angular";

export const PageController = ['$rootScope','$scope', 'auth', 'api', 'tags', '$stateParams', '$timeout', function(_$rootScope, $scope, _auth, api, tags, $stateParams, $timeout) {
    // start and end dates for line graphs
    let dataStartDate = new Date(new Date().setYear(new Date().getFullYear() - 5)) // Set it to five years ago at most!
    dataStartDate = dataStartDate.getTime();
    let dataEndDate = new Date().getTime();

    let userOfInterest = $scope.user._id;

    $scope.questionsAnsweredOverTime = null;

    $scope.setLoading(2);

    if ($stateParams.userId) {
        $scope.progress = api.user.getProgress({ userId: $stateParams.userId });
        $scope.viewingOwnData = false;
        userOfInterest = $stateParams.userId;
    } else {
        $scope.progress = api.currentUser.getProgress();
        $scope.viewingOwnData = true;
        userOfInterest = $scope.user._id;
    }

    api.user.getEventsOverTime({userId: userOfInterest, from_date: dataStartDate, to_date:dataEndDate}).$promise.then(function(result) {
        let questionsPerMonth = JSON.parse(angular.toJson(result));
        $scope.questionsAnsweredOverTime = {"Question Attempts": questionsPerMonth};
        $scope.showQuestionsOverTime = true;         
        $scope.setLoading(false);
    }).catch(function(e) {
        console.error("Unable to load user timeline:", e);
        $timeout(function() {
            // Call this asynchronously, so that it happens later than the previous asynchronous call (!)
            $scope.setLoading(false);
        });
    });

    $scope.progress.$promise.then(function() {
        $scope.setLoading(false);

        $scope.progress.percentCorrectQuestions = Math.round(100*$scope.progress.totalQuestionsCorrect/$scope.progress.totalQuestionsAttempted);
        $scope.progress.percentCorrectQuestionParts = Math.round(100*$scope.progress.totalQuestionPartsCorrect/$scope.progress.totalQuestionPartsAttempted);
        $scope.progress.symbolicCorrect = ($scope.progress.correctByType["isaacSymbolicQuestion"] || 0) + ($scope.progress.correctByType["isaacSymbolicChemistryQuestion"] || 0);
        $scope.progress.symbolicAttempts = ($scope.progress.attemptsByType["isaacSymbolicQuestion"] || 0) + ($scope.progress.attemptsByType["isaacSymbolicChemistryQuestion"] || 0);

        $scope.progress.percentCorrectNumeric = Math.round(100*$scope.progress.correctByType["isaacNumericQuestion"]/$scope.progress.attemptsByType["isaacNumericQuestion"]) || 0;
        $scope.progress.percentCorrectMultiChoice = Math.round(100*$scope.progress.correctByType["isaacMultiChoiceQuestion"]/$scope.progress.attemptsByType["isaacMultiChoiceQuestion"]) || 0;
        $scope.progress.percentCorrectSymbolic = Math.round(100*$scope.progress.symbolicCorrect/$scope.progress.symbolicAttempts) || 0;

        $scope.progress.percentCorrectPhysicsSkills14 = Math.round(100*$scope.progress.correctByTag["physics_skills_14"]/$scope.progress.attemptsByTag["physics_skills_14"]) || 0;
        $scope.progress.percentCorrectChemistry16 = Math.round(100*$scope.progress.correctByTag["chemistry_16"]/$scope.progress.attemptsByTag["chemistry_16"]) || 0;
        $scope.progress.percentCorrectPhysBookGCSE = Math.round(100*$scope.progress.correctByTag["phys_book_gcse"]/$scope.progress.attemptsByTag["phys_book_gcse"]) || 0;

        $scope.correctQuestions = {};
        $scope.attemptedQuestions = {};

        $scope.questionsVisible = $scope.correctQuestions;

        $scope.showTeacherProgressTab = $scope.progress.userDetails.role != 'STUDENT';
        if ($scope.showTeacherProgressTab) {
            $scope.progressType = 'teacherProgress';
        } else {
            $scope.progressType = 'studentProgress';
        }

        $scope.toggleProgressType = function() {
            if ($scope.progressType == 'teacherProgress') {
                $scope.progressType = 'studentProgress';
            } else {
                $scope.progressType = 'teacherProgress';
            }
        }

        // --- STREAK PROGRESS --- //
        if ($scope.progress.userSnapshot.dailyStreakRecord) {
            let currentProgressValue = $('#current-streak-progress-bar');
            let radius = 40;
            let circumference = 2 * Math.PI * radius;
            let currentDashOffset = circumference;

            if ($scope.progress.userSnapshot.dailyStreakRecord.currentActivity <= 3) {
                currentDashOffset = circumference * (1 - ($scope.progress.userSnapshot.dailyStreakRecord.currentActivity/3));
            } else if ($scope.progress.userSnapshot.dailyStreakRecord.currentActivity > 3) {
                currentDashOffset = 0;
            }

            currentProgressValue.animate({'stroke-dashoffset' : currentDashOffset}, 500)

            //currentProgressValue.attr('stroke-dashoffset', String(currentDashOffset));
        }

        $scope.toggleVisibleBoards = function() {
            if ($scope.questionsVisible == $scope.correctQuestions) {
                $scope.questionsVisible = $scope.attemptedQuestions;
            } else {
                $scope.questionsVisible = $scope.correctQuestions;
            }
        }

        $scope.achievementsGetStarted = function(achievementType) {
            api.logger.log({
                type: "ACHIEVEMENT_GET_STARTED",
                achievementType: achievementType ,
            });
        }

        $scope.correctQuestions.levelData = [];
        $scope.attemptedQuestions.levelData = [];

        for (let i = 1; i <= 6; i++) {
            $scope.correctQuestions.levelData.push(
                {label: 'Level ' + i.toString(), val: $scope.progress.correctByLevel[i.toString()] || 0}
            );
            $scope.attemptedQuestions.levelData.push(
                {label: 'Level ' + i.toString(), val: $scope.progress.attemptsByLevel[i.toString()] || 0}
            );
        }

        $scope.correctQuestions.subjectData = [];
        $scope.attemptedQuestions.subjectData = [];
        let subjects = ["physics","maths","chemistry"];

        for (let i = 0; i < subjects.length; i++) {
            $scope.correctQuestions.subjectData.push(
                {label: subjects[i].charAt(0).toUpperCase() + subjects[i].slice(1), val: $scope.progress.correctByTag[subjects[i]] || 0}
            );
            $scope.attemptedQuestions.subjectData.push(
                {label: subjects[i].charAt(0).toUpperCase() + subjects[i].slice(1), val: $scope.progress.attemptsByTag[subjects[i]] || 0}
            );
        }


        $scope.correctQuestions.fields = [];
        $scope.attemptedQuestions.fields = [];

        $scope.correctQuestions.fieldData = [];
        $scope.attemptedQuestions.fieldData = [];

        let correctFields = [];
        let attemptedFields = [];

        for (let tid in $scope.progress.correctByTag) {
            let t = tags.getById(tid);
            if (t && t.level == 1) {
                correctFields.push(t);
                $scope.correctQuestions.fields.push(t);
            }
        }

        for (let tid in $scope.progress.attemptsByTag) {
            let t = tags.getById(tid);
            if (t && t.level == 1) {
                attemptedFields.push(t);
                $scope.attemptedQuestions.fields.push(t);
            }
        }

        // Check if any attempts have been made, otherwise don't need to register listeners:
        if (attemptedFields.length > 0) {

            $scope.attemptedQuestions.field = {
                selection: attemptedFields[0],
            };

            $scope.attemptedQuestions.topicsSubject = attemptedFields[0].parent;

            if (correctFields.length != 0) {
                $scope.correctQuestions.field = {
                    selection: correctFields[0],
                };
                $scope.correctQuestions.topicsSubject = correctFields[0].parent;
            }

            $scope.$watch("questionsVisible.field.selection", function(newField) {

                $scope.questionsVisible.fieldData = [];

                if ($scope.questionsVisible.field == null) {
                    return;
                }

                let topics = tags.getDescendents($scope.questionsVisible.field.selection.id);
                for (let i in topics) {
                    let t = topics[i];
                    let value;

                    if ($scope.questionsVisible == $scope.correctQuestions) {
                        value = $scope.progress.correctByTag[t.id] || 0;
                    } else {
                        value = $scope.progress.attemptsByTag[t.id] || 0;
                    }

                    $scope.questionsVisible.fieldData.push({
                        label: t.title,
                        val: value
                    })
                }

                $scope.questionsVisible.topicsSubject = newField.parent;                
            });
        }
    }).catch(function(e) {
            console.error("Unable to load user progress:", e);
            $timeout(function() {
                // Call this asynchronously, so that it happens later than the previous asynchronous call (!)
                $scope.setLoading(false);
            });
        });
    }
];
