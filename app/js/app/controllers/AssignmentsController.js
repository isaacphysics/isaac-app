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

	var calculateBoardLevels = function(board){
			levels = [];
			for(i = 0; i < board.questions.length; i++) {
				if (levels.indexOf(board.questions[i].level) == -1) {
					levels.push(board.questions[i].level);
				}
			}

			levels.sort(function (a, b) {
   				return a > b ? 1 : a < b ? -1 : 0;
			});

			return levels;
	}

	var SetAssignmentsPageController = ['$scope', 'auth', 'api', 'gameBoardTitles', '$rootScope', '$window', '$timeout', function($scope, auth, api, gameBoardTitles, $rootScope, $window, $timeout) {
		$scope.globalFlags.isLoading = true;
		
		$rootScope.pageTitle = "Assign Boards";

		$scope.generateGameBoardTitle = gameBoardTitles.generate;

		$scope.myGroups = api.groupManagementEndpoint.get(); // get a list of all known groups for this user.

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
		}

		$scope.filterOptions = [
			{label: "All Boards", val: null},
			{label: "Not Started", val: "not_attempted"},
			{label: "In Progress", val: "in_progress"},
			{label: "Completed", val: "completed"}
		];

		$scope.sortOptions = [
			{label: "Date Created", val: "created"},
			{label: "Date Visited", val: "visited"}
		];

		$scope.filterOption = $scope.filterOptions[0];
		$scope.sortOption = $scope.sortOptions[0];

		var updateBoards = function(limit) {
			$scope.globalFlags.isLoading = true;
			api.userGameBoards($scope.filterOption.val, $scope.sortOption.val, 0, limit).$promise.then(function(boards) {
				$scope.boards = boards;

				updateGroupAssignmentMap($scope.boards.results)

				$scope.globalFlags.isLoading = false;
				$scope.globalFlags.displayLoadingMessage = false;
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

		// update tooltips when this changes.
		$scope.$watch("boards.results", function(newVal, oldVal){
			$timeout(function(){
				Opentip.findElements();
				//TODO: when an assignment is set the tooltip number doesn't update until a page refresh.
			}, 500);
			
		}, true);

		// Perform initial load
		updateBoards();

		var mergeInProgress = false;
		$scope.loadMore = function() {
			if (mergeInProgress) return;
			mergeInProgress = true;
			$scope.globalFlags.isLoading = true;
			api.userGameBoards($scope.filterOption.val, $scope.sortOption.val, $scope.boards.results.length).$promise.then(function(newBoards){
				// Merge new boards into results 
				updateGroupAssignmentMap(newBoards.results)

				$.merge($scope.boards.results, newBoards.results);
				$scope.globalFlags.isLoading = false;
				$scope.globalFlags.displayLoadingMessage = false;
				mergeInProgress = false;
			});
		};

		$scope.deleteBoard = function(id, name){
			// Warn user before deleting
			var confirmation = confirm("You are about to delete "+name+" board?");
			if (confirmation){
       			// TODO: This needs to be reviewed
       			// Currently reloading boards after delete
				$scope.globalFlags.isLoading = true;
       			api.deleteGameBoard(id).$promise.then(function(){
			        updateBoards($scope.boards.results.length);
       			});
			}
		}

		$scope.calculateBoardLevels = calculateBoardLevels;

		var lookupAssignedGroups = function(board) {
			var groups = api.assignments.getAssignedGroups({gameId: board.id});
			return groups;
		}

		var updateGroupAssignmentMap = function(boardsToChange) {
			angular.forEach(boardsToChange, function(board, key){
				$scope.groupAssignmentInfo[board.id] = lookupAssignedGroups(board);
			});
		}

		$scope.getListOfGroups = function(listOfGroups) {
			if (listOfGroups.length == 0) {
				return "No groups have been assigned."
			}

			var listOfGroupsString = "Groups: ";

			angular.forEach(listOfGroups, function(group, key){
				listOfGroupsString = listOfGroupsString + group.groupName + ", ";
			});

			listOfGroupsString = listOfGroupsString.replace(/,\s*$/, "");

			return listOfGroupsString;
		}

		$scope.assignBoard = function(board) {
			var groupToAssign = $scope.pendingAssignment[board.id]._id;

			api.assignments.assignBoard({gameId: board.id, groupId: groupToAssign}).$promise.then(function(){
				updateGroupAssignmentMap([board]);
				delete $scope.pendingAssignment[board.id]; // remove from pending list.
			}).catch(function(e){
        		$scope.showToast($scope.toastTypes.Failure, "Board Assignment Failed", "Error " + e.status + ") "+ e.data.errorMessage != undefined ? e.data.errorMessage : "");
			})
		}

		$scope.unassignBoard = function(group, board) {
			var unassignGroup = $window.confirm('Are you sure you want to unassign this board from this group?');   

			if (unassignGroup){
				api.assignments.unassignBoard({gameId: board.id, groupId: group._id}).$promise.then(function(){
					updateGroupAssignmentMap([board]);
				}).catch(function(e){
        			$scope.showToast($scope.toastTypes.Failure, "Board Unassignment Failed", "Error " + e.status + ") "+ e.data.errorMessage != undefined ? e.data.errorMessage : "");
				});				
			}
		}
	}];

	var MyAssignmentsPageController = ['$scope', 'auth', 'api', 'gameBoardTitles', '$rootScope', function($scope, auth, api, gameBoardTitles, $rootScope) {
			$scope.globalFlags.isLoading = true;
			
			$rootScope.pageTitle = "My Assignments";

			$scope.generateGameBoardTitle = gameBoardTitles.generate;
			
			$scope.myAssignments = {};
			
			$scope.myAssignments.completed = [];
			$scope.myAssignments.inProgress = [];

			$scope.assignmentsVisible = $scope.myAssignments.inProgress;

			api.assignments.getMyAssignments().$promise.then(function(results) {
				angular.forEach(results, function(assignment, index) {
					if (assignment.gameboard.percentageCompleted < 100) {
						$scope.myAssignments.inProgress.push(assignment);
					} else {
						$scope.myAssignments.completed.push(assignment);
					}
				})
			});

			$scope.toggleVisibleBoards = function(){
				if ($scope.assignmentsVisible == $scope.myAssignments.inProgress) {
					$scope.assignmentsVisible = $scope.myAssignments.completed;
				} else {
					$scope.assignmentsVisible = $scope.myAssignments.inProgress;
				}
			}

			$scope.calculateBoardLevels = calculateBoardLevels;
		}];

	return {
		SetAssignmentsPageController: SetAssignmentsPageController,
		MyAssignmentsPageController: MyAssignmentsPageController
	};
})