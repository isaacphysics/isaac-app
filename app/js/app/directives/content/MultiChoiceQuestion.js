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

				scope.$watch("selectedAnswer", function() {
					scope.selectedChoice = scope.doc.choices[scope.selectedAnswer];
				})
			}
		};
	}];
});