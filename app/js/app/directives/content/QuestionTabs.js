define(["app/honest/responsive_video"], function(rv) {


	return ["api", function(api) {

		return {

			restrict: 'EA',

			transclude: true,

			templateUrl: "/partials/content/QuestionTabs.html",

			link: function(scope, element, attrs, ctrls, transclude) {

				scope.activateTab = function(i) {
					scope.activeTab = i;
					rv.updateAll();					
				}

				scope.activateTab(-1); // Activate "Answer now" tab by default.

				scope.checkAnswer = function() {
					if (scope.selectedChoice != null) {

						var s = api.questionValidator.validate({id: scope.doc.id}, scope.selectedChoice);

						s.$promise.then(function foo(r) {
							scope.validationResponse = r;
						}, function bar(e) {
							console.error("Error validating answer:", e);
						});

					} else {
						// TODO: Somehow tell the user that they need to choose an option before clicking Check.
					}
				}

				scope.$watch("selectedChoice", function() {
					delete scope.validationResponse;
				}, true);


				// Prevent the transcluded template from getting a new child scope - attach it to our scope.
				transclude(scope, function(clone, scope) {
					element.find(".transclude-here").append(clone);
				})

			}
		};
	}];
});