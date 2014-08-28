define([], function() {

	var PageController = ['$scope', 'api', function($scope, api) {
		if ($scope.user) {
			$scope.contactForm = {"firstName" : $scope.user.givenName, "lastName" : $scope.user.familyName, "emailAddress" : $scope.user.email};
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