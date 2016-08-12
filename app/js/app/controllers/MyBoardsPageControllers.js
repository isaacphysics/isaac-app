/**
 * Copyright 2014 Ian Davies
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

    var PageController = ['$scope', '$state', 'auth', 'api', 'gameBoardTitles', '$rootScope', '$timeout', function($scope, $state, auth, api, gameBoardTitles, $rootScope, $timeout) {

        $rootScope.pageTitle = "My Boards";
        $scope.boardsToDelete = [];
        $scope.safeToDelete = true;
        $scope.trashMode = false;
        $scope.generateGameBoardTitle = gameBoardTitles.generate;


        $scope.filterOptions = [{
            label: "All Boards",
            val: null
        }, {
            label: "Not Started",
            val: "not_attempted"
        }, {
            label: "In Progress",
            val: "in_progress"
        }, {
            label: "Completed",
            val: "completed"
        }];

        $scope.sortOptions = [{
            label: "Date Created",
            val: "created"
        }, {
            label: "Date Visited",
            val: "visited"
        }];



        $scope.filterOption = $scope.filterOptions[0];

        $scope.sortOption = $scope.sortOptions[1];

        var updateBoards = function(limit) {
            $scope.setLoading(true);
            api.userGameBoards($scope.filterOption.val, $scope.sortOption.val, 0, limit).$promise.then(function(boards) {
                $scope.boards = boards;
                $scope.setLoading(false);
            })
        };

        // update boards when filters have been selected
        $scope.$watch("filterOption", function(newVal, oldVal) {
            // TODO: For some reason these watch functions are being fired for no reason
            if (newVal === oldVal) {
                return;
            }
            updateBoards();
        });

        $scope.$watch("sortOption", function(newVal, oldVal) {
            if (newVal === oldVal) {
                return;
            }
            updateBoards();
        });


        updateBoards();

        var mergeInProgress = false;
        $scope.loadMore = function() {
            console.debug($scope.trashMode);
            if (mergeInProgress) return;
            mergeInProgress = true;
            $scope.setLoading(true);
            api.userGameBoards($scope.filterOption.val, $scope.sortOption.val, $scope.boards.results.length).$promise.then(function(newBoards) {
                // Merge new boards into results
                $.merge($scope.boards.results, newBoards.results);
                $scope.setLoading(false);
                mergeInProgress = false;
                if ($scope.trashMode) {
                    $scope.toggleTrashMode();
                }
            });

        };

        $scope.toggleBoards = function(b) {
            if (b) {
                $('.panel').addClass('trashMode');
            } else {
                $('.panel').removeClass('trashMode');
            }
        }

        $scope.toggleTrashMode = function() {
                $scope.boardsToDelete = [];
                if ($scope.trashMode) {
                    // delete all the items in the trash array
                    // empty the trash array
                    $('.panel').removeClass('toDelete');
                    $('.panel').removeClass('trashMode');
                    $scope.trashMode = false;
                    $scope.toggleBoards(false);
                } else {
                    $scope.trashMode = true;
                    $scope.toggleBoards(true);
                }

            }
            // if trashMode is active, clicking the board adds it to trashArray.
            // if trashMode is inactive, allow user to be redirected to that board.
        $scope.boardClick = function(board) {
            if ($scope.trashMode) {
                if ($('.' + board.id).hasClass("toDelete")) {
                    $('.' + board.id).removeClass('toDelete');
                    console.debug("Removing: " + board.id + " from the trash.");
                    $scope.boardsToDelete.splice($scope.boardsToDelete.indexOf(board.id));
                } else {
                    $('.' + board.id).addClass("toDelete");
                    console.debug("Adding: " + board.id + " to the trash.");
                    $scope.boardsToDelete.push(board.id);
                }
                console.debug($scope.boardsToDelete);

            } else {
                $state.go('board', {
                    id: board.id
                });
            }
        }
        $scope.boardDelete = function(board) {
            if ($scope.trashMode) {
                if ($('.' + board.id).hasClass("toDelete")) {
                    $('.' + board.id).removeClass('toDelete');
                    console.debug("Removing: " + board.id + " from the trash.");
                    $scope.boardsToDelete.splice($scope.boardsToDelete.indexOf(board.id));
                } else {
                    $('.' + board.id).addClass("toDelete");
                    console.debug("Adding: " + board.id + " to the trash.");
                    $scope.boardsToDelete.push(board.id);
                }
                console.debug($scope.boardsToDelete);

            } else {
                $scope.deleteBoard(board);
            }
        }

        $scope.deleteMultipleGameBoards = function() {
            // send an XHR request to delete all the boards in $scope.boardsToDelete
            // endpoint will then decide if ALL the boards can be deleted.
            // If a single board cannot be deleted, we return an error with appropriate message.
            console.debug("Deleting multiple game boards");
            if ($scope.boardsToDelete.length != 0) {
                var ids = "";
                for (var b in $scope.boardsToDelete) {
                    ids += $scope.boardsToDelete[b] + ((b != $scope.boardsToDelete.length - 1) ? "," : "");
                }
                console.debug("ID being sent to server: " + ids);
                api.deleteMultipleGameBoards(ids).$promise.then(function() {
                    updateBoards($scope.boards.results.length);
                    $scope.setLoading(false);
                    $scope.showToast($scope.toastTypes.Success, "Boards Deleted", "Successfully deleted the boards you selected.");
                }).catch(function(e) {
                    updateBoards($scope.boards.results.length);
                    $scope.setLoading(false);
                    $scope.showToast($scope.toastTypes.Failure, "Warning", "With error message: (" + e.status + ") " + e.data.errorMessage != undefined ? e.data.errorMessage : "");
                });
                $scope.toggleTrashMode();
            } else {
                if ($scope.trashMode) {
                    $scope.showToast($scope.toastTypes.Failure, "No Boards Selected", "Choose the boards you wish to delete.");
                } else {
                    $scope.showToast($scope.toastTypes.Failure, "No Boards Selected", "Click Select Boards and choose the boards you wish to delete.");
                }
            }

            $scope.boardsToDelete = [];
        }

        $scope.deleteBoard = function(board) {

            lookupAssignedGroups(board).$promise.then(function(groupsAssigned) {
                if (groupsAssigned != null && groupsAssigned.length != 0) {
                    if ($scope.user.role == "ADMIN" || $scope.user.role == "EVENT_MANAGER") {
                        alert("Warning: You currently have groups assigned to this board. If you delete this your groups will still be assigned but you won't be able to unassign them or see the board in your Assigned Boards or My boards page.");
                    } else {
                        $scope.showToast($scope.toastTypes.Failure, "Board Deletion Not Allowed", "You have groups assigned to this board. To delete this board, you must unassign all groups.");
                        return;
                    }
                }

                var boardTitle = board.title ? board.title : $scope.generateGameBoardTitle(board);
                // Warn user before deleting
                var confirmation = confirm("You are about to delete " + boardTitle + " board?");
                if (confirmation) {
                    // TODO: This needs to be reviewed
                    // Currently reloading boards after delete
                    $scope.setLoading(true);
                    api.deleteGameBoard(board.id).$promise.then(function() {
                        updateBoards($scope.boards.results.length);
                        $scope.setLoading(false);
                        $scope.showToast($scope.toastTypes.Success, "Board Deleted", "You have successfully deleted the board: " + boardTitle);
                    }).catch(function(e) {
                        $scope.showToast($scope.toastTypes.Failure, "Board Deletion Failed", "With error message: (" + e.status + ") " + e.data.errorMessage != undefined ? e.data.errorMessage : "");
                    });
                }
            })

        }
        $scope.addDelete = function(board) {
            $scope.deleteBoardsArray.push(board);
            console.debug("Added:" + board.id + " to the boards to be deleted.");
        }

        // duplicate code - I know its bad but this whole file is duplicated so one more function isn't going to destroy the world - just until we refactor this file...
        var lookupAssignedGroups = function(board) {
            var groups = api.assignments.getAssignedGroups({
                gameId: board.id
            });
            return groups;
        }

        $scope.calculateBoardLevels = function(board) {
            // TODO: this logic is duplicated in the assignments controller. We should refactor.
            levels = [];
            for (var i = 0; i < board.questions.length; i++) {
                if (levels.indexOf(board.questions[i].level) == -1 && board.questions[i].level != 0) {
                    levels.push(board.questions[i].level);
                }
            }

            levels.sort(function(a, b) {
                return a > b ? 1 : a < b ? -1 : 0;
            });

            return levels;
        };

        $scope.calculateBoardSubjects = function(board) {
            subjects = [];
            for (i = 0; i < board.questions.length; i++) {
                var q = board.questions[i];

                if (q.tags && q.tags.indexOf("maths") > -1 && subjects.indexOf("maths") == -1)
                    subjects.push("maths");
                else if (q.tags && q.tags.indexOf("physics") > -1 && subjects.indexOf("physics") == -1)
                    subjects.push("physics");
            }

            return subjects;
        }
    }];

    return {
        PageController: PageController
    };
})
