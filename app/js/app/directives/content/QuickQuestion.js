define([], function() {


	return ["api", function(api) {

		return {
			scope: {
				doc: "=isaacQuickQuestion"
			},

			restrict: 'EA',

			templateUrl: "/partials/content/QuickQuestion.html",
		};
	}];
});