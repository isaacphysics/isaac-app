define([], function() {


	return ["api", function(api) {

		return {
			scope: {
				doc: "=isaacMultiChoiceQuestion"
			},

			restrict: 'EA',

			templateUrl: "/partials/content/MultiChoiceQuestion.html",

			link: function(scope, element, attrs) {

				scope.activeTab = -1; // Activate "Answer now" tab by default.

				scope.activateTab = function(i) {
					scope.activeTab = i;
				}

				scope.checkAnswer = function() {
					if (scope.selectedAnswer != null) {

						var selectedChoice = scope.doc.choices[scope.selectedAnswer];

						var s = api.questionValidator.validate({id: scope.doc.id}, selectedChoice);

						s.$promise.then(function foo(r) {
							scope.validationResponse = r;
						}, function bar(e) {
							console.error("Error validating answer:", e);
						});

					} else {
						// TODO: Somehow tell the user that they need to choose an option before clicking Check.
					}
				}

				scope.$watch("selectedAnswer", function() {
					delete scope.validationResponse;
				})
			}
		};
	}];
});