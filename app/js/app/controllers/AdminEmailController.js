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

	var PageController = ['$scope', 'auth', 'api', '$window', '$rootScope', '$sce', function($scope, auth, api, $window, $rootScope, $sce) {
		$scope.isAdminUser = $rootScope.user.role == 'ADMIN';
	    $scope.statistics = null;
	    $scope.setLoading(true);
	    $scope.apiVersion = api.contentVersion.get();
	    $scope.emailTypes = null;

	    $scope.lastContentIDSuccessfullyPreviewed = "";

	    $scope.htmlPreview = "";

	    $scope.emailToSend = {
	    	emailType : {"preferenceIndex" : -1},
	    	contentObject :{"id": ""},
	    	users: {
		    	adminUsers : false,
		    	eventManagerUsers : false,
		    	contentEditorUsers : false,
		    	teacherUsers : false,
		    	testerUsers : false,
		    	studentUsers : false,
	    	}
	    };

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
	        	$scope.htmlPreview = $sce.trustAsResourceUrl("data:text/html," + encodeURIComponent(content.html));
	        	$scope.setLoading(false);
	        	$scope.lastContentIDSuccessfullyPreviewed = $scope.emailToSend.contentObjectId;
	    	}).catch(function(e){
    			$scope.showToast($scope.toastTypes.Failure, "Email template failed", "With error message (" + e.status + ") " + e.statusText);
	        	$scope.setLoading(false);
	        	$scope.lastContentIDSuccessfullyPreviewed = "";
	    	});
	    }

	    $scope.validateAndSendEmails = function(){
	    	//TODO get the email preference out of the dropdown
	    	console.log($scope.emailTypes);

	    	$scope.emailToSend.emailType.preferenceIndex = $scope.emailTypes;
	    	if($scope.emailToSend.emailType < 0){
	    		$scope.emailToSend.emailType.$invalid = true;
	    	}

	    	if(!$scope.contentLoaded || !$scope.contentLoaded.id || !$scope.contentLoaded.id == "" || $scope.contentLoaded != $scope.emailToSend.contentObjectId){
				$scope.emailToSend.contentObjectId.$invalid = true;
	    	}

	    	$scope.emailToSend.users.$invalid = true;
	    	for(var key in $scope.emailToSend.users) {
	    		if(key.substring(0, 1) != "$"){
	    			if($scope.emailToSend.users[key]){
	    				$scope.emailToSend.users.$invalid = false;
	    			}
	    		}
	    	}


	    }

    }]
	return {
		PageController: PageController,
	};
})