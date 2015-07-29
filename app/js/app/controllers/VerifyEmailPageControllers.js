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
			CAN_REQUEST: '',
			REQUESTED: 'Email address not verified. Please check your email.',
			IN_PROGRESS: 'Verifying...',
			SUCCESS : 'Email successfully verified!',
			FAILED_INVALID: 'Email verification failed.',
			FAILED_ALREADY_VERIFIED: 'Email verification failed - already verified.',
			FURTHER_VERIFICATION_FAILED: 'Request for verification email failed.'
		};

		$scope.email = $stateParams.email;
		$scope.verificationState = $scope.verificationStates.CAN_REQUEST;
		$scope.errorMessage = "test";

		$scope.verifyWithToken = function(token){
			$scope.verificationState = $scope.verificationStates.IN_PROGRESS;
			api.verifyEmailWithToken.verify({'token': $stateParams.token}).$promise.then(function(response){
				$scope.verificationState = $scope.verificationStates.SUCCESS;
			}, function(error){
				$scope.errorMessage = error.errorMessage;
				if(error.data.errorMessage.indexOf("Email already verified.") > -1){
					$scope.verificationState = $scope.verificationStates.FAILED_ALREADY_VERIFIED;
				}
				else{
					$scope.verificationState = $scope.verificationStates.FAILED_INVALID;
				}
			});
		}


		//If the user requests a further verification email, request one from the endpoint
		$scope.requestFurtherVerification = function(){
			console.log("Requested further verification");
			api.verifyEmail.requestEmailVerification($scope.email).$promise.then(function(response){
				$scope.verificationState = $scope.verificationStates.REQUESTED;
			}, function(error){
				$scope.errorMessage = error.statusText;
				$scope.verificationState = $scope.verificationStates.FURTHER_VERIFICATION_FAILED;
				console.log(error);
			});
		}


		//If we get a token, check it
		if($stateParams.token != null){
			$scope.verifyWithToken($stateParams.token);
		}
		else if($stateParams.email != null){
			$scope.email = $stateParams.email;
			//Allow them to request a token
			if($stateParams.requested){
				$scope.verificationState = $scope.verificationStates.REQUESTED;
			}
			else{
				$scope.verificationState = $scope.verificationStates.CAN_REQUEST;
			}
		}
		else{
			$scope.verificationState = $scope.verificationStates.FAILED_INVALID;
		}



	}];

	return {
		PageController: PageController
	};
});