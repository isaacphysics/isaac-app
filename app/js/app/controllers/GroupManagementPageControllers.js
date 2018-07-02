/**
 * Copyright 2014 Ian Davies
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
define([], function() {

    let PageController = ['$scope', 'auth', '$state', '$location', '$window', 'api', '$timeout', '$rootScope', '$compile',
    function($scope, auth, $state, $location, $window, api, $timeout, $rootScope, $compile) {
        // these flags represent whether features have been enabled yet.
        $rootScope.pageTitle = "Group Management";

        $scope.archivedView = false;
        $scope.myGroups = api.groupManagementEndpoint.get({"archived_groups_only":$scope.archivedView});

        $scope.emailInviteFeatureAvailable = false;

        $scope.selectedGroup = null;
        $scope.selectedGroupMembers = null;
        $scope.selectedGroupAdditionalManagers = null;
        $scope.selectedGroupToken = null;
        $scope.groupJoinURL = null;

        $scope.newGroup = {};

        $scope.sortOptions = [
            {label: "Alphabetical", val: "groupName", reverse: false},
            {label: "Date Created", val: "created", reverse: true}
        ];
        $scope.sortOption = $scope.sortOptions[0];

        $scope.hasExistingAssignments = false;

        $scope.newAdditionalManager = {}

        api.userGameBoards(null, null, 0, 1).$promise.then(function(boards) {
            if(boards.totalResults > 0){
                $scope.hasExistingAssignments = true;
            }
        })

        $scope.changeArchivedGroupsView = function(newValue) {
            if ($scope.archivedView != newValue) {
                $scope.setSelectedGroup(null);
                $scope.archivedView = newValue;
                $scope.myGroups = api.groupManagementEndpoint.get({"archived_groups_only":$scope.archivedView});
            }
            // don't do anything as there is no change.
        }
        

        $scope.setSelectedGroup = function(group) {
            if (group == null || ($scope.selectedGroup && group._id == $scope.selectedGroup._id)) {
                $scope.selectedGroup = null;
                $scope.selectedGroupMembers = null;
                $scope.selectedGroupToken = null;
                $scope.groupJoinURL = null;
            } else {
                $scope.setLoading(true);
                $scope.selectedGroup = JSON.parse(JSON.stringify(group));    
                $scope.selectedGroupMembers = api.groupManagementEndpoint.getMembers({id: $scope.selectedGroup._id});
                $scope.selectedGroupAdditionalManagers = $scope.selectedGroup.additionalManagers;
                
                $scope.selectedGroupMembers.$promise.then(function(){
                    $timeout(function(){
                        Opentip.findElements();
                    }, 500);
                    $scope.setLoading(false);
                }).catch(function(e) {
                    console.error(e)
                    $scope.setLoading(false);
                });

                api.groupManagementEndpoint.getToken({id: $scope.selectedGroup._id}).$promise.then(function(result){
                    $scope.selectedGroupToken = result;
                    $scope.groupJoinURL = $state.href('accountSettings', {"authToken":$scope.selectedGroupToken.token}, {absolute: true});    
                });
            }
        }

        $scope.deleteSelectedGroup = function(group){
            if (group == null){
                $scope.showToast($scope.toastTypes.Failure, "Group Delete Failed", "No group selected"); 
            } 
            else{
                if($scope.selectedGroup && group._id == $scope.selectedGroup._id) {
                    $scope.selectedGroup = null;
                    $scope.selectedGroupMembers = null;
                    $scope.selectedGroupToken = null;
                    $scope.groupJoinURL = null;
                }

                let deleteGroup = $window.confirm("Are you sure you want to permanently delete the group '" + group.groupName + "' and remove all associated assignments?\n\nTHIS ACTION CANNOT BE UNDONE!"); 
                if(deleteGroup){
                    api.groupManagementEndpoint.delete({id: group._id}).$promise.then(function(result){
                        $scope.myGroups = api.groupManagementEndpoint.get();
                    }).catch(function(e) {
                        $scope.showToast($scope.toastTypes.Failure, "Group Delete Failed", e.data.errorMessage != undefined ? e.data.errorMessage : "");
                    });
                }
                else{
                    return;
                }
            }

        }

        $scope.changeGroupArchiveState = function(archiveState) {
            let Group = api.groupManagementEndpoint;
            let groupToSave = null;

            groupToSave = new Group($scope.selectedGroup);

            if (groupToSave.archived == false) {
                let archiveGroup = $window.confirm('Are you sure you would like to archive this group?');   
                if (!archiveGroup) {
                    return;
                }
            }

            groupToSave.archived = archiveState;

            let savedItem = groupToSave.$save({id: groupToSave._id}).then(function(grp) {
                $scope.myGroups = api.groupManagementEndpoint.get({"archived_groups_only":$scope.archivedView});
                $scope.setSelectedGroup(null);
                $scope.newGroup = {};

                $scope.showToast($scope.toastTypes.Success, "Group archive status updated", groupToSave.groupName + " group archive status has been saved.");
            }).catch(function(e) {
                $scope.showToast($scope.toastTypes.Failure, "Group archive status update failed", e.data.errorMessage != undefined ? e.data.errorMessage : "");
            });
        }

        $scope.saveGroup = function(isUpdate) {
            let Group = api.groupManagementEndpoint;
            let groupToSave = null;

            if($scope.selectedGroup && isUpdate) {
                groupToSave = new Group($scope.selectedGroup);
            } else {
                groupToSave = new Group($scope.newGroup);
            }

            let savedItem = groupToSave.$save({id: groupToSave._id}).then(function(grp) {
                $scope.myGroups = api.groupManagementEndpoint.get();
                $scope.setSelectedGroup(grp);
                $scope.newGroup = {};

                if (!isUpdate) {
                    $scope.modals.shareCode.show();
                } else {
                    $scope.showToast($scope.toastTypes.Success, "Group Saved", groupToSave.groupName + " group has been saved successfully.");
                }
            }).catch(function(e) {
                    $scope.showToast($scope.toastTypes.Failure, "Group Save failed", e.data.errorMessage != undefined ? e.data.errorMessage : "");
            });
        }

        $scope.deleteMember = function(group, user) {
            let deleteMember = $window.confirm('Are you sure you want to remove this user from the group?');   
            if (deleteMember) {
                api.groupManagementEndpoint.deleteMember({id: group._id, userId: user.id}).$promise.then(function(result){
                    $scope.selectedGroupMembers = result;
                    $scope.showToast($scope.toastTypes.Success, "User Removed", "The user has been removed successfully.");
                }).catch(function(e) {
                    $scope.showToast($scope.toastTypes.Failure, "Member Delete Failed", e.data.errorMessage != undefined ? e.data.errorMessage : "");
                });
            } else {
                return;
            }
        }

        $scope.addManager = function(group, email) {
            api.groupManagementEndpoint.addManager({id: group._id, email: email}).$promise.then(function(result){
                $scope.selectedGroup = result;
                $scope.newAdditionalManager.email = '';
                $scope.myGroups = api.groupManagementEndpoint.get();
                $scope.showToast($scope.toastTypes.Success, "Group Manager Added", "The user has been added successfully.");
            }).catch(function(e) {
                $scope.showToast($scope.toastTypes.Failure, "Group Manager Addition Failed", e.data.errorMessage != undefined ? e.data.errorMessage : "");
            });
        }

        $scope.deleteManager = function(group, user) {
            let deleteMember = $window.confirm('Are you sure you want to remove this teacher from the group?\nThey may still have access to student data until students revoke the connection from their My Account pages.');   
            if (deleteMember) {
                api.groupManagementEndpoint.deleteManager({id: group._id, userId: user.id}).$promise.then(function(result){
                    $scope.selectedGroup = result;
                    $scope.myGroups = api.groupManagementEndpoint.get();
                    $scope.showToast($scope.toastTypes.Success, "Group Manager Removed", "The user has been removed successfully.");
                }).catch(function(e) {
                    $scope.showToast($scope.toastTypes.Failure, "Group Manager Removal Failed", e.data.errorMessage != undefined ? e.data.errorMessage : "");
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