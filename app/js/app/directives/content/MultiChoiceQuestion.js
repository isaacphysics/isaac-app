define(["app/honest/responsive_video"], function(rv) {


	return ["api", function(api) {

		return {
			scope: true,

			restrict: 'A',

			templateUrl: "/partials/content/MultiChoiceQuestion.html",

			link: function(scope, element, attrs) {

				scope.doc = undefined;
				scope.$parent.$watch(attrs.isaacMultiChoiceQuestion, function(newDoc) {
					scope.doc = newDoc;
				});

				scope.$watch("selectedChoice", function() {
					if (scope.selectedChoice === null) {
						return;
					}

					// Find index of selected choice
					// Can't use indexOf as they are different objects
					for (var i = 0; i < scope.doc.choices.length; i++) {
						var choice = scope.doc.choices[i];

						// Use JSON.stringify to do a deep comparison (compares children and value)
						if (JSON.stringify(choice) === JSON.stringify(scope.selectedChoice)) {
							scope.selectedAnswer = i;
							break;
						}
					}
				});

				scope.$watch("selectedAnswer", function() {
					scope.selectedChoice = scope.doc.choices[scope.selectedAnswer];
				})
			}
		};
	}];
});