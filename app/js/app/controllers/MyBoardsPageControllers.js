/**
 * Copyright 2014 Ian Davies
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
define([], function() {

    let PageController = ['$scope', 'auth', 'api', 'gameBoardTitles', 'boardSearchOptions', 'boardProcessor', '$rootScope', '$timeout', '$stateParams', '$state', function($scope, auth, api, gameBoardTitles, boardSearchOptions, boardProcessor, $rootScope, $timeout, $stateParams, $state) {
        
        $rootScope.pageTitle = "My Boards";

        let updateBoards = function(limit) {
            $scope.setLoading(true);
            api.userGameBoards($scope.selectedFilterOption.value, $scope.selectedSortOption.value, 0, limit).$promise.then(function(boards) {
                $scope.boards = boards;
                boardProcessor.augmentBoards(boards.results, $scope.user._id);
                $scope.filterOptions = boardProcessor.filterOptions;
                $scope.setLoading(false);
            })
        };

        $scope.isTeacher = $scope.user != null && ($scope.user.role == 'TEACHER' || $scope.user.role == 'ADMIN' || $scope.user.role == 'CONTENT_EDITOR' || $scope.user.role == 'EVENT_MANAGER');
        $scope.boardSearchOptions = boardSearchOptions;
        $scope.propertyName = 'lastVisited';
        $scope.reverse = true;
        $scope.sortIcon = {sortable: '⇕', ascending: '⇑', descending: '⇓'};
        $scope.selectedBoards = [];

        $scope.loadMore = function() {
            if (mergeInProgress) return;
            mergeInProgress = true;
            $scope.setLoading(true);
            api.userGameBoards($scope.selectedFilterOption.value, $scope.selectedSortOption.value, $scope.boards.results.length).$promise.then(function(newBoards){
                // Merge new boards into results 
                boardProcessor.augmentBoards(newBoards.results, $scope.user._id);
                $.merge($scope.boards.results, newBoards.results);
                $scope.setLoading(false);
                mergeInProgress = false;
            });
        };

        $scope.deleteBoard = function(board){
            lookupAssignedGroups(board.id).$promise.then(function(groupsAssigned) {
                if (groupsAssigned[board.id] != null && groupsAssigned[board.id].length != 0) {
                    if ($scope.user.role == "ADMIN" || $scope.user.role == "EVENT_MANAGER") {
                        alert("Warning: You currently have groups assigned to this board. If you delete this your groups will still be assigned but you won't be able to unassign them or see the board in your Assigned Boards or My boards page.");
                    } else {
                        $scope.showToast($scope.toastTypes.Failure, "Board Deletion Not Allowed", "You have groups assigned to this board. To delete this board, you must unassign all groups.");
                        return;
                    }
                }

                let boardTitle = board.title ? board.title : $scope.generateGameBoardTitle(board);
                // Warn user before deleting
                let confirmation = confirm("You are about to delete "+ boardTitle + " board?");
                if (confirmation) {
                    // TODO: This needs to be reviewed
                    // Currently reloading boards after delete
                    $scope.setLoading(true);
                    api.deleteGameBoard(board.id).$promise.then(function(){
                        updateBoards($scope.boards.results.length);
                        $scope.setLoading(false);
                        $scope.showToast($scope.toastTypes.Success, "Board Deleted", "You have successfully deleted the board: " + boardTitle);
                    }).catch(function(e){
                        $scope.showToast($scope.toastTypes.Failure, "Board Deletion Failed", "With error message: (" + e.status + ") " + e.data.errorMessage != undefined ? e.data.errorMessage : "");
                    });
                }
            });
            $scope.selectedBoards = [];
        }

        $scope.deleteBoards = function() {

            let selectedBoardCount = $scope.selectedBoards.length;

            if (selectedBoardCount == 0) {
                return;
            }

            let selectedBoardString = "";

            $scope.selectedBoards.forEach(function(boardId) {
                selectedBoardString = selectedBoardString + "," + boardId.toString();
            });
            selectedBoardString = selectedBoardString.substring(1);

            lookupAssignedGroups(selectedBoardString).$promise.then(function(groupsAssigned) {

                let assignedCount = 0;

                let confirmationMessage = "Delete " + selectedBoardCount + " board";
                if (selectedBoardCount > 1) {
                    confirmationMessage += "s";
                }
                confirmationMessage += "?";

                let confirmation = confirm(confirmationMessage);
                if (confirmation) {

                    let boardCount = 0;
                    let numSelectedBoards = $scope.selectedBoards.length;

                    $scope.selectedBoards.forEach(function(boardId) {

                        boardCount++;
                        let assigned = false;

                        if (groupsAssigned[boardId] != null && groupsAssigned[boardId].length != 0) {
                            assignedCount = assignedCount + 1;
                            assigned = true;
                        }

                        if (assigned) {
                            return;
                        }

                        $scope.setLoading(true);
                        api.deleteGameBoard(boardId).$promise.then(function(){
                            $scope.boardSelectToggle(boardId);
                            if (boardCount == numSelectedBoards) {
                                // TODO: This needs to be reviewed
                                // Currently reloading boards after delete
                                updateBoards($scope.boards.results.length);
                                $scope.setLoading(false);
                            }
                            $scope.setLoading(false);
                        }).catch(function(e){
                            $scope.showToast($scope.toastTypes.Failure, "Board Deletion Failed", "With error message: (" + e.status + ") " + e.data.errorMessage != undefined ? e.data.errorMessage : "");
                        });
                    });

                    let deletedBoardsCount = selectedBoardCount - assignedCount;
                    let deletionMessage = "";
                    let deletionTitle = "";
                    let toastType = null;

                    if (deletedBoardsCount > 0) {
                        deletionMessage = "You have successfully deleted " + deletedBoardsCount +" board";
                        deletionTitle = "Board";

                        if (deletedBoardsCount > 1) {
                            deletionMessage = deletionMessage + "s";
                            deletionTitle = deletionTitle + "s";
                        }
                        deletionMessage = deletionMessage +".";
                        toastType = $scope.toastTypes.Success;
                        deletionTitle = deletionTitle + " Deleted";
                    }

                    if (assignedCount > 0) {
                        deletionMessage = deletionMessage + " You have groups assigned to some selected boards. To delete the boards, you must unassign all groups.";
                        toastType = $scope.toastTypes.Failure;
                    }

                    $scope.showToast(toastType, deletionTitle, deletionMessage);
                }
            });
        }

        $scope.boardSelectToggle = function(boardId) {

            let idx = $scope.selectedBoards.indexOf(boardId);

            if (idx > -1) {
                $scope.selectedBoards.splice(idx, 1);
            } else {
                $scope.selectedBoards.push(boardId);
            }
        }

        $scope.sortBy = function(propertyName) {
            $scope.reverse = ($scope.propertyName === propertyName) ? !$scope.reverse : false;
            $scope.propertyName = propertyName;
        };

        $scope.$watchGroup(["selectedNoBoardsOption", "selectedFilterOption"], function(newVal, oldVal) {
            if (newVal !== oldVal) {
                updateBoards($scope.selectedNoBoardsOption.value);
            }
        });
        
        $scope.$watch("selectedSortOption", function(newVal, oldVal) {
            if (newVal !== oldVal) {
                updateBoards($scope.boards.results.length);
            }
        });

        $scope.$watch("selectedViewOption", function(newVal, oldVal) {
            if (newVal !== oldVal) {
                let allBoardsLoaded = $scope.selectedFilterOption == boardSearchOptions.filter.values.all && $scope.selectedNoBoardsOption == boardSearchOptions.noBoards.values.all; 
                $state.go('boards', {view: $scope.selectedViewOption.value}, {notify: !allBoardsLoaded}); // only request boards if all boards are not already loaded
                setDefaultBoardSearchOptions($scope.selectedViewOption.defaultFieldName, allBoardsLoaded);
                window.scrollTo(0, 0);
            }
        });

        let setDefaultBoardSearchOptions = function(viewDefaultField, allBoardsLoaded) {
            if (['cardDefault', 'tableDefault'].indexOf(viewDefaultField) >= 0) {
                // API parameters
                for (let boardSearchParameter in $scope.boardSearchOptions) {
                    let boardSearchOption = boardSearchOptions[boardSearchParameter];
                    let selectedOptionVariableName = 'selected' + boardSearchParameter.charAt(0).toUpperCase() + boardSearchParameter.slice(1) + 'Option';
                    let defaultValueKey = boardSearchOption[viewDefaultField];
                    // if all boards are loaded ignore default assignment for selectedNoBoardsOption
                    if (!(allBoardsLoaded && selectedOptionVariableName == 'selectedNoBoardsOption')) {
                        $scope[selectedOptionVariableName] = boardSearchOption.values[defaultValueKey];
                    }
                }
                // Front-end filters
                $scope.exactMatch = {
                    completion: undefined,
                    createdBy: undefined
                };
                $scope.partialMatch = {
                    title: undefined,
                    subjects: undefined,
                    levels: undefined
                };
            }
        };

        let lookupAssignedGroups = function(gameboardIds) {
            let groups = api.assignments.getAssignedGroups({gameboard_ids: gameboardIds});
            return groups;
        };

        // main
        let mergeInProgress = false;
        let queryParamDefinedViewValue = $stateParams.view && boardSearchOptions.view.values[$stateParams.view];
        let suggestedViewValueForScreenSize = Foundation.utils.is_medium_up() ? boardSearchOptions.view.values.table : boardSearchOptions.view.values.card;
        let initialViewValue = queryParamDefinedViewValue || suggestedViewValueForScreenSize;

        setDefaultBoardSearchOptions(initialViewValue.defaultFieldName, false);
        updateBoards($scope.selectedNoBoardsOption.value);
    }];

    return {
        PageController: PageController
    };
})
