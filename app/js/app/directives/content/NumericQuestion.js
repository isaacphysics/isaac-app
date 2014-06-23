define(["app/honest/responsive_video"], function(rv) {


	return ["api", function(api) {

		return {
			scope: {
				doc: "=isaacNumericQuestion"
			},

			restrict: 'EA',

			templateUrl: "/partials/content/NumericQuestion.html",

			link: function(scope, element, attrs) {

				scope.selectedChoice = {
					type: "quantity",
				};

			}
		};
	}];
});