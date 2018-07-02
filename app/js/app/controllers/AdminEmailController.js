/**
 * Copyright 2015 Alistair Stead
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

 export const PageController = ['$scope', 'auth', '$stateParams', 'api', '$window', '$rootScope', '$sce', '$timeout', function($scope, auth, $stateParams, api, $window, $rootScope, $sce, $timeout) {
    $scope.isAdminUser = $rootScope.user.role == 'ADMIN';
    $scope.statistics = null;
    $scope.setLoading(true);
    $scope.apiVersion = api.contentVersion.get();
    $scope.emailTypes = null;

    $scope.lastContentIDSuccessfullyPreviewed = "";

    $scope.htmlPreview = "";
    $scope.plainTextPreview = "";
    $scope.subjectPreview = "";

    $scope.emailToSend = {
        emailType : null,
        contentObjectId : "", 
        users: {
            ADMIN : false,
            EVENT_MANAGER : false,
            CONTENT_EDITOR : false,
            TEACHER : false,
            TESTER : false,
            STAFF : false,
            STUDENT : false,
        }
    };

    $scope.getInitialUserFilterState = function() {
        if($stateParams.userIds != ""){
            $scope.csvuseridlist = $stateParams.userIds;
            return('csvuseridlist');
        }
        return('userfilter');
    }

    $scope.queueSize = "?";

    let queueSizeChecker = function() {
        api.email.getQueueSize({}).$promise.then(function(result){
            let d = new Date();
            $scope.queueSize = "" + result.length + " at " + d.toLocaleTimeString();
            $timeout(queueSizeChecker, 5000);
        }).catch(function(e){
            $scope.showToast($scope.toastTypes.Failure, "Email Queue Size", "Could not get email queue size (" + e.status + ") " + e.statusText);
            clearInterval(timerId); // FIXME What is this timerId thing that is not defined?
        });
    }

    queueSizeChecker();

    let getUserIdArrayFromTextArea = function(){
        let userids = $scope.csvuseridlist.split(/[\s,]+/).map(function(e) {return parseInt(e);});
        return userids;
    }

    $scope.getTotalUsers = function(){
        if($scope.userSelectionType == 'csvuseridlist') {
            let userIdList = getUserIdArrayFromTextArea();
            return userIdList.length;
        }

        let total = 0;
        if($scope.emailToSend.users.ADMIN) {
            total += parseInt($scope.statistics.role.ADMIN);
        }

        if($scope.emailToSend.users.EVENT_MANAGER) {
            total += parseInt($scope.statistics.role.EVENT_MANAGER);
        }

        if($scope.emailToSend.users.CONTENT_EDITOR) {
            total += parseInt($scope.statistics.role.CONTENT_EDITOR);
        }

        if($scope.emailToSend.users.TEACHER) {
            total += parseInt($scope.statistics.role.TEACHER);
        }

        if($scope.emailToSend.users.TESTER) {
            total += parseInt($scope.statistics.role.TESTER);
        }

        if($scope.emailToSend.users.STAFF) {
            total += parseInt($scope.statistics.role.STAFF);
        }

        if($scope.emailToSend.users.STUDENT) {
            total += parseInt($scope.statistics.role.STUDENT);
        }
        return total;
    }

    api.statisticsEndpoint.get().$promise.then(function(result){
        $scope.statistics = result;
        $scope.setLoading(false);
    }).catch(function(e){
        $scope.showToast($scope.toastTypes.Failure, "Statistics load failed", "With error message (" + e.status + ") " + e.statusText);
    });

    api.email.getPreferences().$promise.then(function(result){
        $scope.emailTypes = result;
    }).catch(function(e){
        $scope.showToast($scope.toastTypes.Failure, "Preferences load failed", "With error message (" + e.status + ") " + e.statusText);
    });

    $scope.loadContentTemplate = function(contentId){
        $scope.setLoading(true);
        api.email.get({"id" : $scope.emailToSend.contentObjectId}).$promise.then(function(content){
            $scope.subjectPreview = content.subject;
            $scope.htmlPreview = $sce.trustAsResourceUrl("data:text/html," + encodeURIComponent(content.html));
            $scope.plainTextPreview = $sce.trustAsResourceUrl("data:/html," + encodeURIComponent(content.plainText));
            $scope.setLoading(false);
            $scope.lastContentIDSuccessfullyPreviewed = $scope.emailToSend.contentObjectId;
        }).catch(function(e){
            $scope.showToast($scope.toastTypes.Failure, "Email template failed", "With error message (" + e.status + ") " + e.statusText);
            $scope.setLoading(false);
            $scope.lastContentIDSuccessfullyPreviewed = "";
        });
    };

    $scope.emailTypeChanged = function(emailType){
        $scope.emailToSend.emailType = emailType.name;         
    };

    $scope.validateAndSendEmails = function(){
        //TODO check if loading, if so, disable button

        if(!$scope.emailToSend.emailType || $scope.emailToSend.emailType < 0){
            $scope.setLoading(false);
            $scope.showToast($scope.toastTypes.Failure, "Email sending failed", "You must select a type of email");
            return;
        }

        if($scope.lastContentIDSuccessfullyPreviewed == "" || $scope.emailToSend.contentObjectId != $scope.lastContentIDSuccessfullyPreviewed){
            $scope.setLoading(false);
            $scope.showToast($scope.toastTypes.Failure, "Email sending failed", "You must preview the email before sending");
            return;
        }

        if($scope.userSelectionType == 'userfilter') {
            let usersSelected = false;
            for(let key in $scope.emailToSend.users) {
                if($scope.emailToSend.users[key]){
                    usersSelected = true;
                }
            }

            if(!usersSelected){
                $scope.setLoading(false);
                $scope.showToast($scope.toastTypes.Failure, "Email sending failed", "You must select users to send the email to");
                return;
            }
        }
        else if($scope.userSelectionType == 'csvuseridlist') {
            let numbersAndCommas = /[^,0-9]+/;
            
            if(numbersAndCommas.test($scope.csvuseridlist)){
                $scope.setLoading(false);
                $scope.showToast($scope.toastTypes.Failure, "Email sending failed", "Userids field contains invalid characters");
                return;
            }

            let userids = getUserIdArrayFromTextArea($scope.csvuseridlist);
            
            // Check for NaNs and invalid characters
            for(let i = 0; i < userids.length; i++){
                if(isNaN(userids[i])){
                    $scope.setLoading(false);
                    $scope.showToast($scope.toastTypes.Failure, "Email sending failed", "One of the userIds given evaluates to NaN");
                    return;
                }
            }
        }
        else {
            $scope.showToast($scope.toastTypes.Failure, "Email sending failed", "No user selection type selected");
            return;
        }

        let confirmation = $window.confirm('You are about to send ' + $scope.getTotalUsers() + ' email(s). Are you sure?'); 
        if(confirmation && $scope.userSelectionType == 'userfilter'){ 
            $scope.setLoading(true);
            api.email.sendEmail({
                contentid : $scope.emailToSend.contentObjectId, 
                emailtype: $scope.emailToSend.emailType, 
            }, $scope.emailToSend.users).$promise.then(function(){
                $scope.setLoading(false);
                $scope.showToast($scope.toastTypes.Success, "Success!", "Email has been sent (and filtered) successfully!");
                return;
            }).catch(function(e){
                $scope.setLoading(false);
                $scope.showToast($scope.toastTypes.Failure, "Email sending failed", e.status + " " + e.statusText + ": " + (e.data.errorMessage || ""));
                return;
            });
        }
        else if(confirmation && $scope.userSelectionType == 'csvuseridlist'){
            $scope.setLoading(true);
            api.email.sendEmailWithIds({
                contentid : $scope.emailToSend.contentObjectId, 
                emailtype: $scope.emailToSend.emailType
            }, getUserIdArrayFromTextArea($scope.csvuseridlist)).$promise.then(function(){
                $scope.setLoading(false);
                $scope.showToast($scope.toastTypes.Success, "Success!", "Email has been sent (and filtered) successfully!");
                return;
            }).catch(function(e){
                $scope.setLoading(false);
                $scope.showToast($scope.toastTypes.Failure, "Email sending failed", e.status + " " + e.statusText + ": " + (e.data.errorMessage || ""));
                return;
            });
        }
        else {
            $scope.showToast($scope.toastTypes.Failure, "Email sending failed", "Could not determine between user filter and id list");
            $scope.setLoading(false);
            return;
        }


    };

}];