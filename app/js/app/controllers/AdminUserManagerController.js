/**
 * Copyright 2016 Alistair Stead
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

export const PageController = ['$scope', 'auth', 'api', '$window', '$rootScope', '$interval', function($scope, _auth, api, $window, $rootScope, _$interval) {
    $rootScope.pageTitle = "Role Manager";

    $scope.contentVersion = api.contentVersion.get();
    $scope.userSearch = {};
    $scope.userSearch.isLoading = false;
    $scope.userSearch.searchTerms = {role:"", email:"", familyName:"", postcode:"", postcoderadius:"FIFTY_MILES", subjectOfInterest: ""};
    $scope.userManagerSelection = {};

    // FIXME - reimplement this, but in a more sensible location!
    // $scope.indexQueue = null;
    // $scope.segueVersion = api.segueInfo.segueVersion();
    // $scope.cachedVersions = api.segueInfo.cachedVersion();
    // let updateIndexerQueue = function(){
    //     api.contentVersion.currentIndexQueue().$promise.then(function(result){
    //         $scope.indexQueue = result;
    //     });
    // }
    
    // updateIndexerQueue();

    // let indexQueueInterval = $interval(updateIndexerQueue, 30000)
    // $scope.clearIndexQueue = function(){
    //     api.contentVersion.emptyIndexQueue().$promise.then(function(result){
    //         $scope.indexQueue = result;
    //     });
    // }

    // $scope.$on("$destroy", function() {
    //     if (indexQueueInterval) {
    //         $interval.cancel(indexQueueInterval);
    //     }
    // });

    $scope.schoolOtherEntries = api.schools.getSchoolOther();

    $scope.isStaffUser = $rootScope.user.role == 'ADMIN' || $rootScope.user.role == 'EVENT_MANAGER' || $rootScope.user.role == 'CONTENT_EDITOR';
    
    $scope.userSearchSortPredicate = "familyName";

    $scope.hasSearched = false;
    $scope.findUsers = function() {

        $(document).foundation(); // Make sure the elevate/demote dropdowns now work, turning a bug into a feature!

        if ($scope.userSearch.searchTerms != "") {

            $scope.userSearch.isLoading = true;
            // If any of the string based search terms are the empty string, correct them to null to prevent matching on this!
            api.adminUserSearch.search({'familyName' : ($scope.userSearch.searchTerms.familyName == "") ? null : $scope.userSearch.searchTerms.familyName, 
                                        'email' : ($scope.userSearch.searchTerms.email == "") ? null : $scope.userSearch.searchTerms.email, 
                                        'role' : ($scope.userSearch.searchTerms.role == "" || $scope.userSearch.searchTerms.role == "NO_ROLE") ? null : $scope.userSearch.searchTerms.role, 
                                        'schoolURN': ($scope.userSearch.searchTerms.schoolURN == "") ? null : $scope.userSearch.searchTerms.schoolURN, 
                                        'schoolOther' : ($scope.userSearch.searchTerms.schoolOther == "") ? null : $scope.userSearch.searchTerms.schoolOther, 
                                        'postcode' : ($scope.userSearch.searchTerms.postcode == "") ? null : $scope.userSearch.searchTerms.postcode,
                                        'postcodeRadius': ($scope.userSearch.searchTerms.postcoderadius == "") ? null : $scope.userSearch.searchTerms.postcoderadius,
                                        'subjectOfInterest': ($scope.userSearch.searchTerms.subjectOfInterest == "") ? null : $scope.userSearch.searchTerms.subjectOfInterest,
                                    }).$promise.then(function(result){
                $scope.userSearch.results = result;
                $scope.userSearch.isLoading = false;

                //clear selections
                $scope.userManagerSelection = {};

                //Add selections in, so we can select all
                for (let resultItem in $scope.userSearch.results) {
                    if(result.hasOwnProperty(resultItem) && !resultItem.startsWith("$")) {
                        let key = result[resultItem]._id;
                        $scope.userManagerSelection[key] = false;
                    }
                }
            }).catch(function(e){
                $scope.showToast($scope.toastTypes.Failure, "User Search Failed", e.data.errorMessage != undefined ? e.data.errorMessage : "");
                $scope.userSearch.isLoading = false;
            });
            
            $scope.userSearch.hasSearched = true;
        }
    };



    $scope.getSelectedUserIds = function(){
        let userids = new Set();
        for(let key in $scope.userManagerSelection){
            if ($scope.userManagerSelection.hasOwnProperty(key) && $scope.userManagerSelection[key]) {
                userids.add(key);
            }
        }
        return(userids);
    }

    $scope.getSelectedUserIdArray = function(){
        let idSet = $scope.getSelectedUserIds();
        return(Array.from(idSet));
    }

    // Function that gets selected Ids, and finds appropriate email addresses
    $scope.getSelectedUserEmails = function(){
        let emails = new Set();
        let ids = $scope.getSelectedUserIds();
        for (let resultItem in $scope.userSearch.results) {
            let id = $scope.userSearch.results[resultItem]._id;
            if($scope.userSearch.results.hasOwnProperty(resultItem) && !resultItem.startsWith("$") && ids.has("" + id)) {
                emails.add($scope.userSearch.results[resultItem].email)
            }
        }
        return(emails);
    }

    let confirmUnverifiedUserPromotions = function(){
        let ids = $scope.getSelectedUserIds();
        for (let resultItem in $scope.userSearch.results) {
            let id = $scope.userSearch.results[resultItem]._id;
            if ($scope.userSearch.results.hasOwnProperty(resultItem) && !resultItem.startsWith("$") && ids.has("" + id)) {
                // This user is to be promoted
                if ($scope.userSearch.results[resultItem].emailVerificationStatus != "VERIFIED") {
                    let promoteUser = $window.confirm('Are you really sure you want to promote unverified user: (' + $scope.userSearch.results[resultItem].email + ')?'
                        + '\nThey may not be who they claim to be, may have an invalid email or have not yet verified their account.'
                        + '\n\nPressing "Cancel" will abort promotion for all selected users.');
                    if (!promoteUser) {
                        return(false);
                    }
                }
            }
        }
        return(true);
    }

    $scope.modifySelectedUsersRole = function(role) {
        $scope.userSearch.isLoading = true;

        let userIdSet = $scope.getSelectedUserIds();
        let userIds = Array.from(userIdSet);

        // Do not require confirmation for demotion to student role:
        let confirmed = (role == "STUDENT") || confirmUnverifiedUserPromotions();
        if (confirmed) {
            api.adminUserManagerChange.change_role({'role': role}, userIds).$promise.then(function(_result){
                $scope.userSearch.isLoading = false;
                $scope.findUsers();
            }).catch(function(e){
                $scope.showToast($scope.toastTypes.Failure, "Role Change Failed", e.data.errorMessage != undefined ? e.data.errorMessage : "");
                $scope.userSearch.isLoading = false;
            });
        } else {
            $scope.showToast($scope.toastTypes.Failure, "No Users Promoted", "Promotion of users was aborted!");
            $scope.userSearch.isLoading = false;
        }
    }

    $scope.toggleUserSelectionState = false;
    $scope.toggleUserSelection = function(){
        $scope.toggleUserSelectionState = !$scope.toggleUserSelectionState;
        for(let key in $scope.userManagerSelection){
            if($scope.userManagerSelection.hasOwnProperty(key)) {
                $scope.userManagerSelection[key] = $scope.toggleUserSelectionState;
            }
        }
    }

    $scope.modifySelectedUsersEmailVerificationStatus = function(emailVerificationStatus) {
        $scope.userSearch.isLoading = true;
        let emailSet = $scope.getSelectedUserEmails();
        let emails = Array.from(emailSet);

        api.adminUserManagerChange.changeEmailVerificationStatus({'emailVerificationStatus': emailVerificationStatus, "checkEmailsExistBeforeApplying" : true}, emails).$promise.then(function(_result) {
            $scope.userSearch.isLoading = false;
            $scope.findUsers();
        }).catch(function(e){
            $scope.showToast($scope.toastTypes.Failure, "Modification Failed", e.data.errorMessage != undefined ? e.data.errorMessage : "");
            $scope.userSearch.isLoading = false;
        });
    }

    $scope.deleteUser = function(userId, email) {
        let deleteUser = $window.confirm('Are you sure you want to delete the account with email address: ' + email + '?');   

        if (deleteUser) {
                api.adminDeleteUser.delete({'userId' : userId}).$promise.then(function(){
                $scope.showToast($scope.toastTypes.Success, "User Deleted", "You have successfully deleted the user with e-mail: " + email);
                $scope.findUsers();
            }).catch(function(e){
                $scope.showToast($scope.toastTypes.Failure, "User Deletion Failed", e.data.errorMessage != undefined ? e.data.errorMessage : "");
            });
        } else {
            return;
        }
    }

}];
