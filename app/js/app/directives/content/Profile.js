define([], function() {


	return ["api", function(api) {

		return {

			scope: {
				doc: "=isaacProfile",
			},

			restrict: 'EA',

			templateUrl: "/partials/content/Profile.html",

			link: function(scope, element, attrs) {

			}
		};
	}];
});