define([], function() {


	return ["api", function(api) {

		return {
			scope: true,

			restrict: 'A',

			templateUrl: "/partials/content/Image.html",

			link: function(scope, element, attrs) {

				scope.src = undefined;
				scope.path = undefined;
				scope.$parent.$watch(attrs.isaacImage, function(newSrc) {
					scope.src = newSrc;

					scope.path = api.getImageUrl(scope.src);
				});

			}
		};
	}];
});