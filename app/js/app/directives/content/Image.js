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
				var src = scope.isaacImage || scope.src;
				scope.path = api.getImageUrl(src);
			}
		};
	}];
});