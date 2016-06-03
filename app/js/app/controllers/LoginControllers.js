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

	var PageController = ['$scope', 'auth', 'api', '$stateParams', '$window', function($scope, auth, api, $stateParams, $window) {

		$scope.auth = auth;
		$scope.target = $stateParams.target;
		$scope.loginUser = {};

		$scope.login = function() {

			$scope.loginAttempted = true;
			delete $scope.errorMessage;
			// Only submit if form is valid
			if($scope.form.$valid) {
				// $scope.userEmail = $scope.user.email;
				auth.login($scope.loginUser).then(function(){
					// Success		
					if (!$scope.target) {
						$window.location.href = '/';
					} else {
						$window.location.href = $scope.target;
					}

				}).catch(function(reason) {
					// Error
					$scope.errorMessage = reason.data.errorMessage;
					$scope.$apply();
				})
			}
		}
		$scope.socialLogin = function(provider, target) {
			auth.loginRedirect(provider, target).$promise.then(function(){
				// Success
				console.log('Successful login');
			},
			function(reason){
				// Error
				console.log(reason.data.errorMessage);
			});
		}
		$scope.resetPassword = function() {
			$scope.forgottenPassword = true;

			// Only submit if an email has been entered
			if($scope.form.email.$valid) {
				api.password.reset({'email': $scope.loginUser.email}).$promise.then(function(){
					// Alert user that email has been sent
					$scope.passwordResetFlag = true;
				}).catch(function(e){
					$scope.showToast($scope.toastTypes.Failure, "Password Reset Request Failed", "With error message (" + e.status + ") "+ e.status + ") "+ e.data.errorMessage != undefined ? e.data.errorMessage : "");
				});
			}
		}

		$scope.signUpFunction = function() {
			$scope.$root.user.email = $scope.loginUser.email;
			$scope.$root.user.password = $scope.loginUser.password;
			return $scope.user;
			// I don't know why this code is here; but it was this side of the return statement before!
			// Hide mobile log in form if shown
			// TODO: Find a better place for this, or just angularize the entire mobile log in form
			if ($("#mobile-login-form").hasClass('ru-drop-show')) {
				$("#mobile-login-form").ruDropDownToggle();
			}
		}
	}]

	return {
		PageController: PageController,
	};
})