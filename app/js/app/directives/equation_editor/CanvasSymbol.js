define([], function() {

	return ["$timeout", function($timeout) {

		return {
            scope: {
            	symbol: "=",
            	selected: "=",
                symbolId: "=",
            },
			restrict: "A",
			templateUrl: "/partials/equation_editor/canvas_symbol.html",
			link: function(scope, element, attrs) {
                scope.name+="CANVAS SYMBOL"

                var renderToken = function() {
                    var newt = scope.symbol.token;

                    if (newt) {
                        var el = element.find(".canvas-symbol");
                        var rt = el.find(".katex-render-target");

                        // Set style here as ng-style has not been processed yet, so measurements will be wrong otherwise.
                        el.css({
                            fontSize: scope.symbol.fontSize,
                            lineHeight: scope.symbol.lineHeight,
                        });

                        katex.render(scope.symbol.token, rt[0]);

                        el.css({
                            marginLeft: -el.width()/2,
                            marginTop: -el.height()/2
                        });
                    }
                };

                scope.$watch("symbol.token", renderToken);
                scope.$watch("symbol.fontSize", renderToken);

                var dbf = function() {
                	var caller = arguments.callee.caller;
                	console.debug(caller.name, caller.arguments);
                }


                var mousedown = function(e) {
                    scope.$emit("selection_grab", scope.symbolId, e.pageX, e.pageY, "move", e);
                }

                element.on("mousedown", mousedown);

			},
		};
	}];
});