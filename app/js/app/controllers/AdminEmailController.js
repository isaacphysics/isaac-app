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

	var PageController = ['$scope', 'auth', 'api', '$window', '$rootScope', function($scope, auth, api, $window, $rootScope) {
		$scope.isAdminUser = $rootScope.user.role == 'ADMIN';
	    $scope.statistics = null;
	    $scope.setLoading(true);
	    $scope.apiVersion = api.contentVersion.get();

	    $scope.emailConsoleProperties = {
	    	adminUsers : false,
	    	eventManagerUsers : false,
	    	contentEditorUsers : false,
	    	teacherUsers : false,
	    	testerUsers : false,
	    	studentUsers : false,
	    	contentObjectId : ""
	    }

	    api.statisticsEndpoint.get().$promise.then(function(result){
	        $scope.statistics = result;
	        $scope.setLoading(false);
	        console.log($scope.statistics);
	    });

	    $scope.loadContentTemplate = function(contentId){
	    	$scope.setLoading(true);
	    	api.emailTemplate.get($scope.emailConsoleProperties.contentObjectId).$promise.then(function(content){
	    		console.log(content);
	        	$scope.setLoading(false);
	    	});
	    }

    }]
	return {
		PageController: PageController,
	};
})