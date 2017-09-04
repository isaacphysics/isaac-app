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

	var PageController = ['$rootScope', '$scope', 'auth', 'api', function($rootScope, $scope, auth, api) {
		
		$scope.$root.segueEnvironment = "LIVE"; //Live by default

		//Find out which version we're on
		api.environment.get().$promise.then(function(response){
			$scope.$root.segueEnvironment = response.segueEnvironment;
		});

		$scope.notificationToggle = function() {

            $rootScope.notificationWebSocket.send("VIEW_NOTIFICATIONS");
            $rootScope.notificationListLength = 0;
            $rootScope.notificationPopups = [];
            $('.dl-notifications').slideToggle(200);

		}

	}];

	return {
		PageController: PageController
	};
});