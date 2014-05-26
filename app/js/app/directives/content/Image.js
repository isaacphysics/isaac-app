define([], function() {


	return ["api", function(api) {

		return {

			scope: {
				id: "=",
				isaacImage: "=",
			},

			restrict: 'EA',

			templateUrl: "/partials/content/Image.html",

			link: function(scope, element, attrs) {

				scope.src = api.getImageUrl(scope.id || scope.isaacImage);

			}
		};
	}];
});