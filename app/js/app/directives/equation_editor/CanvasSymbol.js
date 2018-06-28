define(["/partials/equation_editor/canvas_symbol.html"], function(templateUrl) {

	return ["$timeout", function($timeout) {

		return {
            scope: {
            	symbol: "=",
            	selected: "=",
                symbolId: "=",
            },
			restrict: "A",
			templateUrl: templateUrl,
			link: function(scope, element, attrs) {
                scope.name+="CANVAS SYMBOL"

                var renderToken = function() {
                    var newt = scope.symbol.token;

                    if (newt && scope.symbol.type == "string") {
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
                    scope.$emit("selection_grab", scope.symbolId, "move", e);
                }
                
                var touchStart = function(e) {
                    e = e.originalEvent;
                    if(e.touches.length == 1) {
                        scope.$emit("selection_grab", scope.symbolId, "move", e);
                        element.on("touchmove", touchMove);
                        element.on("touchend", touchEnd);
                    }
                }

                var touchMove = function(e) {
                    e = e.originalEvent;
                    if (e.touches.length == 1) {
                        scope.$emit("selection_drag", e.touches[0].pageX, e.touches[0].pageY, e);
                        e.stopPropagation();
                        e.preventDefault();
                    }
                }

                var touchEnd = function(e) {
                    e = e.originalEvent;
                    if (e.changedTouches.length == 1) {
                        scope.$emit("selection_drop", e.changedTouches[0].pageX, e.changedTouches[0].pageY, e);
                        e.stopPropagation();
                        e.preventDefault();

                        element.off("touchmove", touchMove);
                        element.off("touchend", touchEnd);
                    }
                }

                element.on("mousedown", mousedown);
                element.on("touchstart", touchStart);

			},
		};
	}];
});