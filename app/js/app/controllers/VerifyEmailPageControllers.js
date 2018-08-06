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

export const PageController = ['$scope', 'auth', 'api', '$stateParams', function($scope, auth, api, $stateParams) {
	
	$scope.verificationStates = {
		CAN_REQUEST: 0,
		IN_PROGRESS: 1,
		FAILED: 2,
		SUCCESS: 3,
	};

	$scope.verificationState = $scope.verificationStates.CAN_REQUEST;
	$scope.message = "";
	$scope.isUserLoggedIn = false;
	$scope.currentEmailIsVerified = false;
	$scope.returnUrlPath = window.location.pathname + '?userid=' + $stateParams.userid;
	$scope.userEmail = "";
	$scope.idsDontMatch = false;
	
	$scope.verifyWithToken = function(userid, token) {
		$scope.verificationState = $scope.verificationStates.IN_PROGRESS;
		api.emailVerification.verify({'userid' : userid, 'token': token}).$promise.then(function(_response) {
			$scope.verificationState = $scope.verificationStates.SUCCESS;
			$scope.message = "E-mail address verified";
			$scope.user.emailVerificationStatus = "VERIFIED";
		}, function(error) {
			$scope.verificationState = $scope.verificationStates.FAILED;
			$scope.message = "Failed - " + error.data.errorMessage;
		});
	}

	$scope.user.$promise.then(function() {
		$scope.isUserLoggedIn = $scope.user != null && $scope.user != undefined;
		$scope.currentEmailIsVerified = $scope.user.emailVerificationStatus == "VERIFIED";
		$scope.userEmail = $scope.user.email;
		$scope.idsDontMatch = $scope.user._id != $stateParams.userid;
	}).catch(function() {
		$scope.isUserLoggedIn = false;
	});

	//If the user requests a further verification email, request one from the endpoint
	$scope.requestFurtherVerification = function() {
		api.verifyEmail.requestEmailVerification({'email': $scope.user.email}).$promise.then(function(_response) {
			$scope.verificationState = $scope.verificationStates.IN_PROGRESS;
		}, function(error) {
			$scope.verificationState = $scope.verificationStates.FAILED;
			$scope.message = "Failed - " + error.data.errorMessage;
		});
	}

	//If we get a token, check it
	if ($stateParams.userid != null && $stateParams.token != null) {
		$scope.verifyWithToken($stateParams.userid, $stateParams.token);
	}
	else if ($scope.user != null && $scope.user.email != null && $stateParams.userid != null) {
		//Allow them to request a token
		$scope.verificationState = $scope.verificationStates.CAN_REQUEST;
	}
	else {
		$scope.verificationState = $scope.verificationStates.FAILED;
		$scope.message = "Failed - this page received bad parameters";
	}
}];
