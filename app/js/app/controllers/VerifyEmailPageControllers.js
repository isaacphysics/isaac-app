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
			CAN_REQUEST: 0,
			IN_PROGRESS: 1,
			FAILED: 2,
			SUCCESS: 3,
		};

		$scope.email = $stateParams.email;
		$scope.verificationState = $scope.verificationStates.CAN_REQUEST;
		$scope.message = "";

		$scope.verifyWithToken = function(userid, email, token){
			$scope.verificationState = $scope.verificationStates.IN_PROGRESS;
			console.log("Params:" + userid + ", " + email + ", " + token);
			api.emailVerification.verify({'userid' : userid, 'email': email, 'token': token}).$promise.then(function(response){
				$scope.verificationState = $scope.verificationStates.SUCCESS;
				$scope.message = "Account verified";
			}, function(error){
				$scope.verificationState = $scope.verificationStates.FAILED;
				$scope.message = "Failed - " + error.data.errorMessage;
			});
		}


		//If the user requests a further verification email, request one from the endpoint
		$scope.requestFurtherVerification = function(){
			console.log("Requested further verification - " + $stateParams.email);
			api.verifyEmail.requestEmailVerification({'email': $stateParams.email}).$promise.then(function(response){
				$scope.verificationState = $scope.verificationStates.IN_PROGRESS;
			}, function(error){
				$scope.verificationState = $scope.verificationStates.FAILED;
				$scope.message = "Failed - " + error.data.errorMessage;
			});
		}

		//If we get a token, check it
		console.log($stateParams);
		if($stateParams.userid != null && $stateParams.email != null && $stateParams.token != null){
			console.log("Attempted to verify using token")
			$scope.verifyWithToken($stateParams.userid, $stateParams.email, $stateParams.token);
		}
		else if($stateParams.email != null){
			//Allow them to request a token
			if($stateParams.requested){
				$scope.verificationState = $scope.verificationStates.IN_PROGRESS;
			}
			else{
				$scope.verificationState = $scope.verificationStates.CAN_REQUEST;
			}
		}
		else{
			$scope.verificationState = $scope.verificationStates.FAILED;
				$scope.message = "Failed - bad parameters";
		}



	}];

	return {
		PageController: PageController
	};
});