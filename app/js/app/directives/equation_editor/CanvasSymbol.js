define([], function() {

	return ["$timeout", function($timeout) {

		return {
            scope: {
            	symbol: "=",
            	selected: "=",
            },
			restrict: "A",
			templateUrl: "/partials/equation_editor/canvas_symbol.html",
			link: function(scope, element, attrs) {
                scope.name+="CANVAS SYMBOL"

                $timeout(function() {
	                var el = element.find(".canvas-symbol");
                	el.css("marginLeft", -el.width()/2);
                	el.css("marginTop", -el.height()/2);
                })

                scope.symbol_click = function(e) {
                	scope.$emit("symbol_click", scope.symbol, e);
                }
			},
		};
	}];
});