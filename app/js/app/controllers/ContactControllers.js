define([], function() {

	var PageController = ['$scope', 'api', function($scope, api) {
		$scope.contactForm = {"firstName" : $scope.user.givenName, "lastName" : $scope.user.familyName, "emailAddress" : $scope.user.email};

		$scope.sendForm = function() {
			var message = {
				"firstName": $scope.contactForm.firstName,
				"lastName": $scope.contactForm.lastName,
				"emailAddress": $scope.contactForm.emailAddress,
				"subject": $scope.contactForm.subject,
				"message": $scope.contactForm.message
			};

			api.contactForm.send({}, message).$promise.then(function(response) {
				console.log("Success");
				// TODO: Inform user accordingly
			}, function(e) {
				console.error("Error submitting form", e);
			});
		}
	}];

	return {
		PageController: PageController
	};
});