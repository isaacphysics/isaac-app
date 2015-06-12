/**
 * Copyright 2014 Stephen Cummins
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

	var PageController = ['$scope', 'auth', 'api', '$state', function($scope, auth, api, $state) {
		$scope.isLoggedIn = false;
		$scope.isTeacher = false;

		$scope.user.$promise.then(function(){
			$scope.isLoggedIn = $scope.user != null;
			$scope.isTeacher = $scope.isLoggedIn && ($scope.user.role == 'TEACHER' || $scope.user.role == 'ADMIN' || $scope.user.role == 'CONTENT_EDITOR');
		}).catch(function(){
			$scope.isLoggedIn = false;
			$scope.isTeacher = false;
		});

		$scope.setAssignmentModal = function() {
			if ($scope.isTeacher) {
				$scope.modals.setAssignmentModal.show()	
			} else {
				alert("You must first be registered as a teacher to use this function.");
			}
		}

		$scope.navigateToStateIfTeacher = function(stateName) {
			if ($scope.isTeacher) {
				$state.go(stateName);
			} else {
				alert("You must first be registered as a teacher to use this function.");
			}
		}

	}];

	return {
		PageController: PageController
	};
});