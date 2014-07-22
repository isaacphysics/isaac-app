define([], function() {


	return [function() {

		return {

			scope: true,

			restrict: 'A',

			templateUrl: "/partials/content/FigureRef.html",

			link: function(scope, element, attrs) {

				var update = function() {
					scope.figNum = scope.figures[attrs.isaacFigureRef];					
				}

				scope.$watchCollection("figures", update);
				update();
			}
		};
	}];
});