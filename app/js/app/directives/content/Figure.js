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

					var nextNum = Object.keys(scope.figures).length + 1;
					var figId = scope.doc.id || ("auto-fig-id-" + nextNum);

					console.debug("Adding figure:", figId);
					scope.figures[figId] = nextNum;

					scope.figNum = scope.figures[figId];

					var src = api.getImageUrl(scope.doc.src);
					scope.imgSrc = src;
				});


			}
		};
	}];
});