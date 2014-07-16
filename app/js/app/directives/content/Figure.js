define([], function() {


	return ["api", function(api) {

		return {

			scope: {
				doc: "=isaacFigure",
			},

			restrict: 'A',

			templateUrl: "/partials/content/Figure.html",

			link: function(scope, element, attrs) {
				var src = api.getImageUrl(scope.doc.src);
				scope.imgSrc = src;

			}
		};
	}];
});