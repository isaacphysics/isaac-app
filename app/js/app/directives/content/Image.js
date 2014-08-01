define([], function() {


	return ["api", function(api) {

		return {
			scope: true,

			restrict: 'A',

			templateUrl: "/partials/content/Image.html",

			link: function(scope, element, attrs) {

				scope.doc = undefined;
				scope.path = undefined;
				scope.$parent.$watch(attrs.isaacImage, function(newDoc) {
					scope.doc = newDoc;

					scope.path = api.getImageUrl(scope.doc.src);
				});

			}
		};
	}];
});