define(["app/honest/responsive_video"], function(rv) {


	return ["api", function(api) {

		return {
			scope: {
				doc: "=isaacMultiChoiceQuestion"
			},

			restrict: 'EA',

			templateUrl: "/partials/content/MultiChoiceQuestion.html",

			link: function(scope, element, attrs) {

				scope.$watch("selectedAnswer", function() {
					scope.selectedChoice = scope.doc.choices[scope.selectedAnswer];
				})
			}
		};
	}];
});