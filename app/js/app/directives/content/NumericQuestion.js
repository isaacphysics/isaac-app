define(["app/honest/responsive_video"], function(rv) {


	return ["api", function(api) {

		return {
			scope: true,

			restrict: 'A',

			templateUrl: "/partials/content/NumericQuestion.html",

			link: function(scope, element, attrs) {

				scope.doc = undefined;
				scope.$parent.$watch(attrs.isaacNumericQuestion, function(newDoc) {
					scope.doc = newDoc;
				});

				scope.selectedChoice = {
					type: "quantity",
				};

			}
		};
	}];
});