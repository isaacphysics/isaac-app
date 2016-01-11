/**
 * Copyright 2016 Alistair Stead
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

	var PageController = ['$scope', 'auth', 'api', '$window', '$rootScope', '$interval', function($scope, auth, api, $window, $rootScope, $interval) {
		$rootScope.pageTitle = "Role Manager";

		$scope.contentVersion = api.contentVersion.get();
		$scope.userSearch = {};
		$scope.userSearch.isLoading = false;
		$scope.userSearch.searchTerms = {role:"", email:"", familyName:"", postcode:""};
		$scope.userManagerSelection = {};

		$scope.indexQueue = null;
		$scope.segueVersion = api.segueInfo.segueVersion();
		$scope.cachedVersions = api.segueInfo.cachedVersion();
		var updateIndexerQueue = function(){
			api.contentVersion.currentIndexQueue().$promise.then(function(result){
				$scope.indexQueue = result;		
			});
		}
		
		updateIndexerQueue();

		var indexQueueInterval = $interval(updateIndexerQueue, 30000)
		$scope.clearIndexQueue = function(){
			api.contentVersion.emptyIndexQueue().$promise.then(function(result){
				$scope.indexQueue = result;
			});
		}

		$scope.$on("$destroy", function() {
	        if (indexQueueInterval) {
	            $interval.cancel(indexQueueInterval);
	        }
	    });

		$scope.schoolOtherEntries = api.schools.getSchoolOther();

		$scope.isStaffUser = $rootScope.user.role == 'ADMIN' || $rootScope.user.role == 'EVENT_MANAGER' || $rootScope.user.role == 'CONTENT_EDITOR';
		
		$scope.userSearchSortPredicate = "familyName";

		$scope.hasSearched = false;
		$scope.findUsers = function() {
			if ($scope.userSearch.searchTerms != "") {
				var role = $scope.userSearch.searchTerms.role;
				var schoolOther = $scope.userSearch.searchTerms.schoolOther;
				var postcode = $scope.userSearch.searchTerms.postcode;

				if ($scope.userSearch.searchTerms.role == "" || $scope.userSearch.searchTerms.role == "NO_ROLE") {
					role = null;
				}
				
				if ($scope.userSearch.searchTerms.schoolOther == "") {
					schoolOther = null;
				}

				if ($scope.userSearch.searchTerms.postcode == "") {
					postcode = null;
				}

				$scope.userSearch.isLoading = true;
				api.adminUserSearch.search({'familyName' : $scope.userSearch.searchTerms.familyName, 'email' : $scope.userSearch.searchTerms.email, 'role' : role, 
																									'schoolOther': schoolOther, schoolURN : $scope.userSearch.searchTerms.schoolURN, 
																									'postcode' : postcode}).$promise.then(function(result){
					$scope.userSearch.results = result;
					$scope.userSearch.isLoading = false;

					//clear selections
					$scope.userManagerSelection = {};

					//Add selections in, so we can select all
					for (var resultItem in $scope.userSearch.results) {
						debugger
						if(result.hasOwnProperty(resultItem) && !resultItem.startsWith("$")) {
							var key = result[resultItem]._id;
							$scope.userManagerSelection[key] = false;
						}
					}
				}).catch(function(e){
					$scope.showToast($scope.toastTypes.Failure, "User Search Failed", "With error message: (" + e.status + ") "+ e.status + ") "+ e.data.errorMessage != undefined ? e.data.errorMessage : "");
					$scope.userSearch.isLoading = false;
				});
				
				$scope.userSearch.hasSearched = true;
			}
		};

		$scope.modifySelectedUsersRole = function(role) {
			$scope.userSearch.isLoading = true;

			userids = [];
			for(var key in $scope.userManagerSelection){
				if ($scope.userManagerSelection[key]) {
					userids.push(key);
				}
			}

			api.adminUserManagerChange.change_role({'role': role}, userids).$promise.then(function(result){
				$scope.userSearch.isLoading = false;
				$scope.findUsers();
			}).catch(function(e){
				$scope.showToast($scope.toastTypes.Failure, "Demotion Failed", "With error message: (" + e.status + ") "+ e.status + ") "+ e.data.errorMessage != undefined ? e.data.errorMessage : "");
				$scope.userSearch.isLoading = false;
			});
		}

		$scope.getSelectedUserIds = function(){
			userids = [];
			for(var key in $scope.userManagerSelection){
    			if ($scope.userManagerSelection.hasOwnProperty(key) && $scope.userManagerSelection[key]) {
					userids.push(key);
				}
			}
			return(userids);
		}
		$scope.toggleUserSelectionState = false;
		$scope.toggleUserSelection = function(){
			$scope.toggleUserSelectionState = !$scope.toggleUserSelectionState;
			for(var key in $scope.userManagerSelection){
				debugger
				if($scope.userManagerSelection.hasOwnProperty(key)) {
					$scope.userManagerSelection[key] = $scope.toggleUserSelectionState;
				}
			}
		}

		$scope.modifySelectedUsersEmailVerificationStatus = function(emailVerificationStatus) {
			$scope.userSearch.isLoading = true;

			var userIds = getSelectedUserIds();

			api.adminUserManagerChange.changeEmailVerificationStatus({'emailVerificationStatus': emailVerificationStatus}, userids).$promise.then(function(result){
				$scope.userSearch.isLoading = false;
				$scope.findUsers();
			}).catch(function(e){
				$scope.showToast($scope.toastTypes.Failure, "Modification Failed", "With error message: (" + e.status + ") "+ e.status + ") "+ e.data.errorMessage != undefined ? e.data.errorMessage : "");
				$scope.userSearch.isLoading = false;
			});
		}

		$scope.deleteUser = function(userId, email) {
			var deleteUser = $window.confirm('Are you sure you want to delete the account with email address: ' + email + '?');   

			if (deleteUser) {
					api.adminDeleteUser.delete({'userId' : userId}).$promise.then(function(){
					$scope.showToast($scope.toastTypes.Success, "User Deleted", "You have successfully deleted the user with e-mail: " + email);
					$scope.findUsers();
				}).catch(function(e){
					$scope.showToast($scope.toastTypes.Failure, "User Deletion Failed", "With error message: (" + e.status + ") "+ e.status + ") "+ e.data.errorMessage != undefined ? e.data.errorMessage : "");
				});
			} else {
				return;
			}
		}

	}]


	return {
		PageController: PageController,
	};
})