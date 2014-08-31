/**
 * Copyright 2014 Nick Rogers
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

	var PageController = ['$scope', 'auth', 'api', '$stateParams', function($scope, auth, api, $stateParams) {
		$scope.user = {
			password: '',
			confirmPassword: ''
		};
		$scope.submitted = false;

		$scope.resetPassword = function() {
			api.password.reset({'token': $stateParams.token}, { 'password': $scope.user.password }).$promise.then(function(response) {
				console.log(response);
				$scope.submitted = true;
				$scope.message = "Your password has been reset successfully, you may now log in with your new password.";
			}, function(error) {
				$scope.submitted = true;
				$scope.message = "An error occurred whilst attempting to reset your password, please try again.";
			});
		}
	}];

	return {
		PageController: PageController
	};
});