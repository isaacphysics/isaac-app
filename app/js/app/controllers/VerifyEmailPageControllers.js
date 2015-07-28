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

	var PageController = ['$scope', 'auth', 'api', '$stateParams', '$timeout', function($scope, auth, api, $stateParams, $location, $timeout) {
		
		$scope.verificationStates = {
			IN_PROGRESS: 0,
			SUCCESS : 1,
			FAILED_INVALID: 2,
			FAILED_ALREADY_VERIFIED: 3
		};

		$scope.verificationState = $scope.verificationStates.IN_PROGRESS;
		$scope.message = "Verifying...";
		$scope.furtherVerificationRequested = false;

		$scope.isUserLoggedIn = false;

		$scope.user.$promise.then(function(){
			$scope.isUserLoggedIn = $scope.user != null;
		}).catch(function(){
			$scope.isUserLoggedIn = false;
		});

		api.verifyEmailWithToken.verify({'token': $stateParams.token}).$promise.then(function(response){
			console.log("Success:" + response);
			$scope.message = ("Email successfully verified!");
			$scope.verificationState = $scope.verificationStates.SUCCESS;
		}, function(error){
			console.log(error);
			$scope.message = ("Email verification failed - " + error.data.errorMessage);

			if($scope.message.indexOf("Email already verified.") > -1){
				$scope.verificationState = $scope.verificationStates.FAILED_ALREADY_VERIFIED;
			}
			else{
				$scope.verificationState = $scope.verificationStates.FAILED_INVALID;
			}
		});

		$scope.requestFurtherVerification = function(){
			console.log("Requested further verification");
			$scope.furtherVerificationRequested = true;
			//TODO call the endpoint and show a popup with the result
			api.verifyEmail.requestFurtherVerification().$promise.then(function(response){
				
			}, function(error){
				console.log(error);
			});
		}

	}];

	return {
		PageController: PageController
	};
});