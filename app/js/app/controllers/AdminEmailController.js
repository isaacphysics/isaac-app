/**
 * Copyright 2015 Alistair Stead
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

	var PageController = ['$scope', 'auth', 'api', '$window', '$rootScope', '$sce', '$timeout', function($scope, auth, api, $window, $rootScope, $sce, $timeout) {
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
	    	emailType : -1,
	    	contentObjectId : "", 
	    	users: {
		    	adminUsers : false,
		    	eventManagerUsers : false,
		    	contentEditorUsers : false,
		    	teacherUsers : false,
		    	testerUsers : false,
		    	studentUsers : false,
	    	}
	    };

	    $scope.queueSize = "?";
	    var checkTimes = 0;

	    var queueSizeChecker = function(){
			console.log("Check:" + checkTimes++);
	    	api.email.getQueueSize({}).$promise.then(function(result){
	    		var d = new Date();
    			$scope.queueSize = "" + result[0] + " at " + d.toLocaleTimeString();
    		}).catch(function(e){
				$scope.showToast($scope.toastTypes.Failure, "Email Queue Size", "Could not get email queue size (" + e.status + ") " + e.statusText);
				clearInterval(timerId);
			});
			$timeout(queueSizeChecker, 5000);
    	}

	    queueSizeChecker();

	    $scope.getTotalUsers = function(){
	    	var total = 0;
	    	if($scope.emailToSend.users.adminUsers) {
	    		total += parseInt($scope.statistics.adminUsers);
	    	}

	    	if($scope.emailToSend.users.eventManagerUsers) {
	    		total += parseInt($scope.statistics.eventManagerUsers);
	    	}

	    	if($scope.emailToSend.users.contentEditorUsers) {
	    		total += parseInt($scope.statistics.contentEditorUsers);
	    	}

	    	if($scope.emailToSend.users.teacherUsers) {
	    		total += parseInt($scope.statistics.teacherUsers);
	    	}

	    	if($scope.emailToSend.users.testerUsers) {
	    		total += parseInt($scope.statistics.testerUsers);
	    	}

	    	if($scope.emailToSend.users.studentUsers) {
	    		total += parseInt($scope.statistics.studentUsers);
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
	    	console.log(result);
	    }).catch(function(e){
			$scope.showToast($scope.toastTypes.Failure, "Preferences load failed", "With error message (" + e.status + ") " + e.statusText);
	    });

	    $scope.loadContentTemplate = function(contentId){
	    	$scope.setLoading(true);
	    	api.email.get({"id" : $scope.emailToSend.contentObjectId}).$promise.then(function(content){
	        	$scope.subjectPreview = content.subject;
	        	$scope.htmlPreview = $sce.trustAsResourceUrl("data:text/html," + encodeURIComponent(content.html));
	        	$scope.plainTextPreview = $sce.trustAsResourceUrl("data:text," + content.plainText);
	        	$scope.setLoading(false);
	        	$scope.lastContentIDSuccessfullyPreviewed = $scope.emailToSend.contentObjectId;
	    	}).catch(function(e){
    			$scope.showToast($scope.toastTypes.Failure, "Email template failed", "With error message (" + e.status + ") " + e.statusText);
	        	$scope.setLoading(false);
	        	$scope.lastContentIDSuccessfullyPreviewed = "";
	    	});
	    };

        $scope.emailTypeChanged = function(idOfSelectedEmailType){
			$scope.emailToSend.emailType = idOfSelectedEmailType;         
		};

	    $scope.validateAndSendEmails = function(){
			
	    	if(!$scope.emailToSend.emailType || $scope.emailToSend.emailType < 0){
    			$scope.showToast($scope.toastTypes.Failure, "Email sending failed", "You must select a type of email");
				return;
	    	}

	    	if($scope.lastContentIDSuccessfullyPreviewed == "" || $scope.emailToSend.contentObjectId != $scope.lastContentIDSuccessfullyPreviewed){
    			$scope.showToast($scope.toastTypes.Failure, "Email sending failed", "You must preview the email before sending");
				return;
	    	}

	    	var usersSelected = false;
	    	for(var key in $scope.emailToSend.users) {
    			if($scope.emailToSend.users[key]){
    				usersSelected = true;
    			}
	    	}

	    	if(!usersSelected){
				$scope.showToast($scope.toastTypes.Failure, "Email sending failed", "You must select users to send the email to");
				return;
			}


        	var confirmation = $window.confirm('You are about to send ' + $scope.getTotalUsers() + ' email(s). Are you sure?'); 
        	if(confirmation){ 
				$scope.setLoading(true);
				api.email.sendEmailWithId({
					contentid : $scope.emailToSend.contentObjectId, 
					emailtype: $scope.emailToSend.emailType, 
					 
				}, $scope.emailToSend.users).$promise.then(function(){
					$scope.setLoading(false);
	    			$scope.showToast($scope.toastTypes.Success, "Success!", "Email has been sent (and filtered) successfully!");
				}).catch(function(e){
	    			$scope.showToast($scope.toastTypes.Failure, "Email sending failed", "With error message (" + e.status + ") " + e.statusText);
		        	$scope.setLoading(false);
				});
			}
	    };

    }]
	return {
		PageController: PageController,
	};
})