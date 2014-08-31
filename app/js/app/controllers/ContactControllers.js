/**
 * Copyright 2014 Nick Rogers and Stephen Cummins
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

	var PageController = ['$scope', 'api', function($scope, api) {
		if ($scope.user) {
			$scope.user.$promise.then(function() {
				$scope.contactForm = {"firstName" : $scope.user.givenName, "lastName" : $scope.user.familyName, "emailAddress" : $scope.user.email};				
			})
		}
		
		$scope.invalidForm = false;
		$scope.formSubmitted = false;
		$scope.errorDuringSubmit = false;

		$scope.sendForm = function() {
			if($scope.form.$invalid) {
				$scope.invalidForm = true;
				$scope.form.$pristine= false;

				// This will mark all invalid fields as dirty to highlight errors in the view.
	        	for(var i in $scope.form.$error.required){
	        		$scope.form.$error.required[i].$setViewValue($scope.form.$error.required[i].$viewValue);
	        	}

				return;
			}

			var message = {
				"firstName": $scope.contactForm.firstName,
				"lastName": $scope.contactForm.lastName,
				"emailAddress": $scope.contactForm.emailAddress,
				"subject": $scope.contactForm.subject,
				"message": $scope.contactForm.message
			};

			api.contactForm.send({}, message).$promise.then(function(response) {
				$scope.invalidForm = false;
				$scope.formSubmitted = true;
			}, function(e) {
				console.error("Error submitting form", e);
				$scope.errorDuringSubmit = true;
			});
		}
	}];

	return {
		PageController: PageController
	};
});