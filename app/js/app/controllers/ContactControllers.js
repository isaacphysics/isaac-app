define([], function() {

	var PageController = ['$scope', 'api', function($scope, api) {
		$scope.sendForm = function() {
			var message = {
				"firstName": form.firstName.value,
				"lastName": form.lastName.value,
				"emailAddress": form.emailAddress.value,
				"subject": form.subject.value,
				"message": form.message.value
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