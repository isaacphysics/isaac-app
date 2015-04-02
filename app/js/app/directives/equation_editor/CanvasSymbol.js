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

                scope.$watch("symbol.token", function(newt) {

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
                })

                scope.symbol_click = function(e) {
                	scope.$emit("symbol_click", scope.symbolId, e);
                }

                var dbf = function() {
                	var caller = arguments.callee.caller;
                	console.debug(caller.name, caller.arguments);
                }

                scope.dragging = false;
                var grabSymbolX, grabSymbolY;
                var grabPageX, grabPageY;

                var grab = function(pageX, pageY, e) {

                    grabPageX = pageX;
                    grabPageY = pageY;

                    grabSymbolX = scope.symbol.x;
                    grabSymbolY = scope.symbol.y;

                    $("body").on("mouseup", mouseup)
                    $("body").on("mousemove", mousemove);
                }

                var drag = function drag(pageX, pageY, e) {
                    scope.dragging = true;

                	var newSymbolX = grabSymbolX + (pageX - grabPageX);
                	var newSymbolY = grabSymbolY + (pageY - grabPageY);

                    scope.symbol.x = newSymbolX;
                    scope.symbol.y = newSymbolY;

                    // Only call digest, not apply. This avoids a complete recursive update from $rootScope. Probably.
                    scope.$digest();

                }

                var drop = function(pageX, pageY, e) {

                    $("body").off("mouseup", mouseup);
                    $("body").off("mousemove", mousemove);

                    scope.$emit("historyCheckpoint");
                    scope.dragging = false;
                    scope.$apply();
                }

                var mousedown = function(e) {
                    grab(e.pageX, e.pageY, e);

                    e.stopPropagation();
                    //e.preventDefault();
                }

                var mouseup = function(e) {
                    drop(e.pageX, e.pageY, e);

                    e.stopPropagation();
                    //e.preventDefault();
                }

                var mousemove = function(e) {
                    drag(e.pageX, e.pageY, e);

                    e.stopPropagation();
                    e.preventDefault();
                }

                element.on("mousedown", mousedown);

			},
		};
	}];
});