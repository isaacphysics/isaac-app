define(["app/honest/responsive_video"], function(rv) {

	return ["api", function(api) {

		return {
			scope: {
				doc: "=isaacSymbolicQuestion"
			},

			restrict: 'EA',

			templateUrl: "/partials/content/SymbolicQuestion.html",

			link: function(scope, element, attrs) {


				scope.activateTab = function(i) {
					scope.activeTab = i;
					rv.updateAll();					
				}

				scope.activateTab(-1); // Activate "Answer now" tab by default.

				scope.showAnswer = function() {
					console.debug("Show answer!");
				}

			}
		};
	}];
});