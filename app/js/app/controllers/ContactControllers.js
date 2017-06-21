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

	var PageController = ['$scope', 'api', '$state', '$rootScope', '$stateParams', function($scope, api, $state, $rootScope, $stateParams) {
		$rootScope.pageTitle = "Contact us";
		$scope.contactForm = {};
		if ($stateParams.subject != null && $stateParams.subject != '' && $stateParams.subject != 'true') {
			$scope.contactForm.subject = $stateParams.subject;
		}

		$scope.user.$promise.then(function() {
			$scope.contactForm = {"firstName" : $scope.user.givenName, "lastName" : $scope.user.familyName, "emailAddress" : $scope.user.email, "subject": $scope.contactForm.subject};
		
			if ($stateParams.preset == 'teacherRequest') {
				if ($scope.user.role != 'TEACHER') {
					$scope.contactForm.subject = "Teacher Account Request",
					$scope.contactForm.message = "Hello,\n\nPlease could you convert my Isaac account into a teacher account.\n\nMy school is: \nI have changed my account email address to be my school email: [Yes/No]\nA link to my school website with a staff list showing my name and email (or a phone number to contact the school) is: \n\nThanks, \n\n" + $scope.contactForm.firstName + " " + $scope.contactForm.lastName;
				} else {
					alert("Your account has already been upgraded to a teacher account.")
				}
			} else if ($stateParams.preset == 'accountDeletion') {
			    $scope.contactForm.subject = "Account Deletion Request",
			    $scope.contactForm.message = "Hello,\n\nPlease could you delete my Isaac account.\n\nThanks, \n\n" + $scope.contactForm.firstName + " " + $scope.contactForm.lastName;
			}
		}).catch(function(){
			if (!$scope.user._id && $stateParams.preset == 'teacherRequest') {
				$state.go('login', {target:"/contact?preset=teacherRequest"})
			} else if (!$scope.user._id && $stateParams.preset == 'accountDeletion') {
			    $state.go('login', {target:"/contact?preset=accountDeletion"})
			}
		});

        $scope.$watchCollection("contactForm", function() {
			$scope.invalidForm = false;
			$scope.formSubmitted = false;
			$scope.errorDuringSubmit = false;
			$scope.invalidEmail = false;
        })

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

			if($scope.user.emailVerificationStatus == 'DELIVERY_FAILED' && $scope.contactForm.emailAddress == $scope.user.email) {

				$scope.invalidEmail = true;
				$scope.modals.emailWarning.show();
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

		$scope.launchTutorial = function() {
			document.cookie = encodeURIComponent('tutorialShown') + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
			document.location.href = "/";
		};
	}];

	return {
		PageController: PageController
	};
});