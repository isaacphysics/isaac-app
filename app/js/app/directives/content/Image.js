define([], function() {


	return ["api", function(api) {

		return {

			scope: {
				src: "=",
				isaacImage: "=",
			},

			restrict: 'EA',

			templateUrl: "/partials/content/Image.html",

			link: function(scope, element, attrs) {

				scope.path = api.getImageUrl(scope.src || scope.isaacImage);

			}
		};
	}];
});