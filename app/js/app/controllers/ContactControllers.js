define([], function() {

	var PageController = ['$scope', 'api', function($scope, api) {
		$scope.contactForm = {"firstName" : $scope.user.givenName, "lastName" : $scope.user.familyName, "emailAddress" : $scope.user.email};
		$scope.invalidForm = false;
		$scope.formSubmitted = false;
		$scope.errorDuringSubmit = false;

		$scope.sendForm = function() {
			if($scope.form.$invalid) {
				$scope.invalidForm = true;
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
				// TODO: Inform user accordingly
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