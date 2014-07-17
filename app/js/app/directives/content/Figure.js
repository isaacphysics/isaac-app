define([], function() {


	return ["api", function(api) {

		return {

			scope: true,

			restrict: 'A',

			templateUrl: "/partials/content/Figure.html",

			link: function(scope, element, attrs) {

				scope.doc = undefined;
				scope.imgSrc = undefined;
				
				scope.$parent.$watch(attrs.isaacFigure, function(newDoc) {
					scope.doc = newDoc;

					var src = api.getImageUrl(scope.doc.src);
					scope.imgSrc = src;
				});

			}
		};
	}];
});