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

	var PageController = ['$scope', 'auth', 'api', '$stateParams', '$location', '$timeout', function($scope, auth, api, $stateParams, $location, $timeout) {
		

		$scope.success = false;

		var token = $location.path().split("/")[2];

		$scope.message = "";

		$scope.dots = 1;

		$scope.animate = true;

		$scope.animateDots = function(){
			if($scope.animate){
				$scope.dots = ($scope.dots + 1) % 4;
				$scope.message = "Verifying"
				for(var i = 0; i < $scope.dots; i++)
					$scope.message += ".";
	        		$timeout($scope.animateDots, 300);
        	}
		}

		$scope.animateDots();

		//Verification not needed
		//$scope.message = ("This email address has already been verified.");

		$scope.verifyEmail = function(token){
			api.email.verify({'token': token}).$promise.then(function(response){
				console.log(response);
				$scope.animate = false;
				$scope.message = ("Email address successfully verified!");
				$scope.success = true;
			}, function(error){
				console.log(error);
				$scope.animate = false;
				$scope.message = ("Email address verification failed. Please try again");
				$scope.success = false;
			});
		}

		$scope.verifyEmail();

	}];

	return {
		PageController: PageController
	};
});