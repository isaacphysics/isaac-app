define(["app/honest/responsive_video"], function(rv) {


	return ["api", function(api) {

		return {

			restrict: 'A',

			transclude: true,

			templateUrl: "/partials/content/QuestionTabs.html",

			link: function(scope, element, attrs, ctrls, transclude) {


				if (scope.doc.bestAttempt) {
					scope.validationResponse = scope.doc.bestAttempt;
					scope.selectedChoice = scope.validationResponse.answer;
				} else {

					// We have to explicitly initialise to null so that the 
					// validationResponse watcher fires on the question. This
					// can allow it to remove the accordion watcher.

					scope.validationResponse = null;
				}

				scope.activateTab = function(i) {
					scope.activeTab = i;
					rv.updateAll();

					if (i > -1) {
						api.logger.log({
							type : "VIEW_HINT",
							questionId : scope.doc.id,
							hintIndex : i,
						})
					}		
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

				scope.$watch("selectedChoice", function(newVal, oldVal) {
					if (newVal === oldVal)
						return; // Init

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