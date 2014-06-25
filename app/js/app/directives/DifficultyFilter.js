define(["app/honest/difficulty"], function(Difficulty) {


	return ["$state", function($state) {

		return {

			scope: {
				config: "=difficultyFilter",
			},

			restrict: "A",

			templateUrl: "/partials/difficulty_filter.html",

			link: function(scope, element, attrs) {

				var difficulty = new Difficulty(element,
				{
	                // Replace with real function to get state
	                get:function(callback) {
	                	callback(scope.config);
	                },
	                // Does nothing - replace as required
	                change:function(state)
	                {
	                	scope.$apply();
	                }
	            });

			    scope.$watch("config", function() {
			    	difficulty.plotHexagons(scope.config);
			    }, true)
			}
		};
	}]

});