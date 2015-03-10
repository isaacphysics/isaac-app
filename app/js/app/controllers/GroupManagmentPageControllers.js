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

	var PageController = ['$scope', 'auth', '$state', '$location', '$window', 'api', '$timeout', function($scope, auth, $state, $location, $window, api, $timeout) {
		// these flags represent whether features have been enabled yet.
		$scope.archivedView = false;
		$scope.emailInviteFeatureAvailable = false;

		$scope.myGroups = api.groupManagementEndpoint.get();

		$scope.selectedGroup = null;
		$scope.selectedGroupMembers = null;
		$scope.selectedGroupToken = null;

		$scope.newGroup = {};

		$scope.setSelectedGroup = function(group) {
			if (group == null || ($scope.selectedGroup && group._id == $scope.selectedGroup._id)) {
				$scope.selectedGroup = null;
				$scope.selectedGroupMembers = null;
				$scope.selectedGroupToken = null;
			} else {
				$scope.selectedGroup = JSON.parse(JSON.stringify(group));	
				$scope.selectedGroupMembers = api.groupManagementEndpoint.getMembers({id: $scope.selectedGroup._id});

				$scope.selectedGroupMembers.$promise.then(function(){
					$timeout(function(){
						Opentip.findElements();
					}, 500);
				})

				$scope.selectedGroupToken = api.groupManagementEndpoint.getToken({id: $scope.selectedGroup._id});
			}
		}

		$scope.saveGroup = function(isUpdate) {
        	var Group = api.groupManagementEndpoint;
        	var groupToSave = null;

        	if($scope.selectedGroup && isUpdate) {
        		groupToSave = new Group($scope.selectedGroup);
        	} else {
        		groupToSave = new Group($scope.newGroup);
        	}

        	var savedItem = groupToSave.$save({id: groupToSave._id}).then(function(grp) {
        		$scope.myGroups = api.groupManagementEndpoint.get();
        		$scope.selectedGroup = grp;
        		$scope.newGroup = {}
        			$scope.showToast($scope.toastTypes.Success, groupToSave.groupName + " group has been saved successfully.");
        	}).catch(function(e) {
        			$scope.showToast($scope.toastTypes.Failure, "Group Save operation failed", "With error message: (" + e.status + ") "+ e.status + ") "+ e.data.errorMessage != undefined ? e.data.errorMessage : "");
        	});
		}

		$scope.deleteMember = function(group, user) {
			var deleteMember = $window.confirm('Are you sure you want to delete?');   
			if (deleteMember) {
				api.groupManagementEndpoint.deleteMember({id: group._id, userId: user._id}).$promise.then(function(result){
					$scope.selectedGroupMembers = result;
				}).catch(function(e) {
        			$scope.showToast($scope.toastTypes.Failure, "Member Delete Operation Failed", "With error message: (" + e.status + ") "+ e.status + ") "+ e.data.errorMessage != undefined ? e.data.errorMessage : "");
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