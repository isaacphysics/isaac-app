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

	var SetAssignmentsPageController = ['$scope', 'auth', 'api', 'gameBoardTitles', 'boardSearchOptions', 'boardProcessor', '$rootScope', '$window', '$timeout', '$location', function($scope, auth, api, gameBoardTitles, boardSearchOptions, boardProcessor, $rootScope, $window, $timeout, $location) {
		$rootScope.pageTitle = "Assign Boards";

		$scope.generateGameBoardTitle = gameBoardTitles.generate;
		$scope.boardSearchOptions = boardSearchOptions;

		$scope.myGroups = api.groupManagementEndpoint.get({"archived_groups_only":false}); // get a list of all known unarchived groups for this user.

		$scope.openedAssignPanels = []; // shows those panels currently opened
		$scope.pendingAssignment = {}; // boardId to group id mapping - allows us to know which group is being assigned which board.

		$scope.groupAssignmentInfo = {}; // map of boardId to group list - shows groups currently assigned.

		// allows the view to change which panels are open.
		$scope.toggleAssignPanel = function(board) {
			var indexOfBoard = $scope.openedAssignPanels.indexOf(board.id);
			if ($scope.openedAssignPanels.indexOf(board.id) == -1) {
				$scope.openedAssignPanels.push(board.id);
			} else {
				$scope.openedAssignPanels.splice(indexOfBoard, 1);
			}

			if($scope.myGroups.length == 0)
           		$scope.modals.groupsWarning.show();
		}

		var setDefaultBoardSearchOptions = function(deviceSpecificDefaultField) {
			for (boardSearchParameter in $scope.boardSearchOptions) {
				var boardSearchOption = boardSearchOptions[boardSearchParameter];
				var selectedOptionVariableName = 'selected' + boardSearchParameter.charAt(0).toUpperCase() + boardSearchParameter.slice(1) + 'Option';
				var defaultValueKey = boardSearchOption[deviceSpecificDefaultField];
				$scope[selectedOptionVariableName] = boardSearchOption.values[defaultValueKey];
			}
		};

		var updateBoards = function(limit) {
			var limit = limit || $scope.selectedNoBoardsOption.value;
			$scope.setLoading(true);
			api.userGameBoards($scope.selectedFilterOption.value, $scope.selectedSortOption.value, 0, limit).$promise.then(function(boards) {
				$scope.boards = boards;
				boardProcessor.augmentBoards(boards.results, $scope.user._id);
				updateGroupAssignmentMap($scope.boards.results);
				if ($location.hash()) {
					$scope.toggleAssignPanel({id: $location.hash()});
				}

				$scope.setLoading(false);
			})
		};

		// update boards when filters have been selected
		$scope.$watch("selectedNoBoardsOption", function(newVal, oldVal) {
			if (newVal !== oldVal) {
				updateBoards();
			}
		});
		$scope.$watch("selectedSortOption", function(newVal, oldVal) {
			if (newVal !== oldVal) {
				updateBoards($scope.boards.results.length);
			}
		});

		// update tooltips when this changes.
		$scope.$watch("boards.results", function(newVal, oldVal){
			$timeout(function(){
				Opentip.findElements();
			}, 0);
		}, true);

		// Perform initial load
		setDefaultBoardSearchOptions('cardDefault');
		updateBoards();

		var mergeInProgress = false;
		$scope.loadMore = function() {
			if (mergeInProgress) return;
			mergeInProgress = true;
			$scope.setLoading(true);
			api.userGameBoards($scope.selectedFilterOption.value, $scope.selectedSortOption.value, $scope.boards.results.length).$promise.then(function(newBoards){
				// Augment new boards and merge them into results:
				boardProcessor.augmentBoards(newBoards.results, $scope.user._id);
				updateGroupAssignmentMap(newBoards.results);
				// Remove duplicate boards caused by changing board list in another tab. Test uniqueness on board ID.
				$scope.boards.results = _.unionWith($scope.boards.results, newBoards.results, function(a,b) {return a.id == b.id});
				// Avoid issues if boards have been deleted in another tab:
				if ($scope.boards.totalResults > newBoards.totalResults) {
					$scope.boards.totalResults = newBoards.totalResults;
				}
				$scope.setLoading(false);
				mergeInProgress = false;
			});
		};

		$scope.deleteBoard = function(board){
			lookupAssignedGroups(board.id).$promise.then(function(groupsAssigned) {
				if (groupsAssigned != null && groupsAssigned.length != 0){
					if ($scope.user.role == "ADMIN" || $scope.user.role == "EVENT_MANAGER") {
						alert("Warning: You currently have groups assigned to this board. If you delete this your groups will still be assigned but you won't be able to unassign them or see the board in your Assigned Boards or My boards page.");
					} else {
						$scope.showToast($scope.toastTypes.Failure, "Board Deletion Not Allowed", "You have groups assigned to this board. To delete this board, you must unassign all groups.");
						return;
					}
				}
				
				var boardTitle = board.title ? board.title : $scope.generateGameBoardTitle(board);
				// Warn user before deleting
				var confirmation = confirm("You are about to delete "+ boardTitle + " board?");
				if (confirmation){
	       			// TODO: This needs to be reviewed
	       			// Currently reloading boards after delete
					$scope.setLoading(true);
	       			api.deleteGameBoard(board.id).$promise.then(function(){
				        updateBoards($scope.boards.results.length);
				        $scope.setLoading(false);
				        $scope.showToast($scope.toastTypes.Success, "Board Deleted", "You have successfully deleted the board: " + boardTitle);
	       			}).catch(function(e){
						$scope.showToast($scope.toastTypes.Failure, "Board Deletion Failed", e.data.errorMessage != undefined ? e.data.errorMessage : "");
	       			});
				}
			})
		}

		var lookupAssignedGroups = function(gameboardIds) {
            var groups = api.assignments.getAssignedGroups({gameboard_ids: gameboardIds});
			return groups;
		}

		var updateGroupAssignmentMap = function(boardsToChange) {
			angular.forEach(boardsToChange, function(board, key){

                lookupAssignedGroups(board.id).$promise.then(function(groupsAssigned) {

                    if (groupsAssigned[board.id].length > 0) {
                        $scope.groupAssignmentInfo[board.id] = groupsAssigned[board.id];
                    }
                    $timeout(Opentip.findElements, 0);
                });
			});
		}

		$scope.getListOfGroups = function(listOfGroups) {
			if (!listOfGroups || listOfGroups.length == 0) {
				return "No groups have been assigned."
			}

			var listOfGroupsString = "Board assigned to: ";

			angular.forEach(listOfGroups, function(group, key){
				listOfGroupsString = listOfGroupsString + group.groupName + ", ";
			});

			listOfGroupsString = listOfGroupsString.replace(/,\s*$/, "");

			return listOfGroupsString;
		}

		$scope.assignBoard = function(board) {
			if ($scope.pendingAssignment[board.id]) {
				var dueDate = $scope.pendingAssignment[board.id].dueDate;
				
				if (dueDate != null) {
					dueDate = Date.UTC(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
					var today = new Date();
					today.setUTCHours(0, 0, 0, 0);
					if ((dueDate - today) < 0) {
						$scope.showToast($scope.toastTypes.Failure, "Board Assignment Failed", "Error: Due date cannot be in the past.");
						return;
					}
				}

				var groupToAssign = $scope.pendingAssignment[board.id]._id;
				var assignmentToPost = {"gameboardId" : board.id, "groupId": groupToAssign, "dueDate": dueDate}

				api.assignments.assignBoard(assignmentToPost).$promise.then(function(){
					updateGroupAssignmentMap([board]);
					delete $scope.pendingAssignment[board.id]; // remove from pending list.
					$scope.showToast($scope.toastTypes.Success, "Assignment Saved", "This assignment has been saved successfully.");
				}).catch(function(e){
	        		$scope.showToast($scope.toastTypes.Failure, "Board Assignment Failed", e.data.errorMessage || ("Error " + e.status));
				})
			} else {
	        	$scope.showToast($scope.toastTypes.Failure, "Board Assignment Failed", "Error: Please choose a group.");
	        }
		}

		$scope.unassignBoard = function(group, board) {
			var unassignGroup = $window.confirm('Are you sure you want to unassign this board from this group?');   

			if (unassignGroup){
				api.assignments.unassignBoard({gameId: board.id, groupId: group._id}).$promise.then(function(){
					updateGroupAssignmentMap([board]);
                    delete $scope.groupAssignmentInfo[board.id];
					$scope.showToast($scope.toastTypes.Success, "Assignment Deleted", "This assignment has been unset successfully.");
				}).catch(function(e){
        			$scope.showToast($scope.toastTypes.Failure, "Board Unassignment Failed", e.data.errorMessage || ("Error " + e.status));
				});				
			}
		}
	}];

	var MyAssignmentsPageController = ['$scope', 'auth', 'api', 'gameBoardTitles', 'boardProcessor', '$rootScope', '$timeout', '$location', function($scope, auth, api, gameBoardTitles, boardProcessor, $rootScope, $timeout, $location) {

		$scope.setLoading(true);
		
		$rootScope.pageTitle = "My Assignments";

		$scope.generateGameBoardTitle = gameBoardTitles.generate;
		
		$scope.myAssignments = {};
		
		$scope.myAssignments.completed = [];
		$scope.myAssignments.inProgressRecent = [];
		$scope.myAssignments.inProgressOld = [];
		$scope.sortPredicate = null;

		$scope.now = new Date();
		var fourWeeksAgo = new Date($scope.now - (4 * 7 * 24 * 60 * 60 * 1000));
		// Midnight five days ago:
		var fiveDaysAgo = new Date($scope.now);
		fiveDaysAgo.setDate($scope.now.getDate() - 5);
		fiveDaysAgo.setHours(0, 0, 0, 0);

		var extractBoardsFrom = function(assignments) {
			var boards = []
			for (var i = 0; i < assignments.length; i++) {
				var assignment = assignments[i];
				boards.push(assignment.gameboard);
			}
			return boards;
		}

		api.assignments.getMyAssignments().$promise.then(function(assignments) {
			boardsForProcessing = extractBoardsFrom(assignments);
			boardProcessor.augmentBoards(boardsForProcessing, $scope.user._id);
			angular.forEach(assignments, function(assignment, index) {
				if (assignment.gameboard.percentageCompleted < 100) {
					var noDueDateButRecent = !assignment.dueDate && (assignment.creationDate > fourWeeksAgo);
					var dueDateAndCurrent = assignment.dueDate && (assignment.dueDate >= fiveDaysAgo);
					if (noDueDateButRecent || dueDateAndCurrent) {
						// Assignment either not/only just overdue, or else set within last month but no due date.
						$scope.myAssignments.inProgressRecent.push(assignment);
					} else {
						$scope.myAssignments.inProgressOld.push(assignment);
					}
				} else {
					$scope.myAssignments.completed.push(assignment);
				}
			})
			$scope.setLoading(false);
			// Log this in the front end because the count is used in the global nav, which incorrectly caused a log event.
            api.logger.log({
                type : "VIEW_MY_ASSIGNMENTS"
            });
		});

		$scope.setVisibleBoard = function(state){
			if (state === 'IN_PROGRESS_RECENT') {
				$scope.sortPredicate = ['!dueDate', 'dueDate', '-creationDate'];
				$scope.assignmentsVisible = $scope.myAssignments.inProgressRecent;
			} else if (state === 'IN_PROGRESS_OLD') {
				$scope.sortPredicate = ['!dueDate', 'dueDate', '-creationDate'];
				$scope.assignmentsVisible = $scope.myAssignments.inProgressOld;
			} else {
				$scope.sortPredicate = '-creationDate';
				$scope.assignmentsVisible = $scope.myAssignments.completed;
			}
		}

		// Update the currently shown assignments based on URL hash:
		switch ($location.hash()) {
			case "inprogress":
				$scope.setVisibleBoard('IN_PROGRESS_RECENT');
				break;
			case "older":
				$scope.setVisibleBoard('IN_PROGRESS_OLD');
				break;
			case "completed":
				$scope.setVisibleBoard('COMPLETED');
				break;
			default:
				$scope.setVisibleBoard('IN_PROGRESS_RECENT');
		}
	}];

	return {
		SetAssignmentsPageController: SetAssignmentsPageController,
		MyAssignmentsPageController: MyAssignmentsPageController
	};
})