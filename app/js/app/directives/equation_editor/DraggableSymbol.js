
define([], function() {

	return [function() {

		return {
            scope: {
                symbol: "=",
            },
			restrict: "A",
            templateUrl: "/partials/equation_editor/draggable_symbol.html",
			link: function(scope, element, attrs) {
                scope.name="DRAGGABLESYMBOL"

                scope.$watch("symbol.token", function(newt) {
                    if (newt)
                        katex.render(scope.symbol.token, element.find(".symbol-token>span")[0]);
                });

                scope.$watch("symbol.label", function(newLabel) {
                    if (newLabel && scope.symbol.texLabel)
                        katex.render(scope.symbol.label, element.find(".symbol-label")[0]);
                });

                scope.dragging = false;

                var grabLocalX, grabLocalY;

                var lastPageX = 0;
                var lastPageY = 0;
                var grab = function(pageX, pageY, e) {
                    scope.dragging = true;
                    scope.$apply();

                    var offset = $(e.target).offset();
                    grabLocalX = pageX - offset.left;
                    grabLocalY = pageY - offset.top;

                    lastPageX = pageX;
                    lastPageY = pageY;

                    $("body").on("mouseup", mouseup)
                    $("body").on("mousemove", mousemove);
                }

                var drag = function(pageX, pageY, e) {

                    if ("lockVertical" in attrs)
                        pageY = lastPageY;

                    // Tell our parents that we've moved.
                    scope.$emit("symbolDrag", pageX, pageY, pageX - lastPageX, pageY - lastPageY);
                    lastPageX = pageX;
                    lastPageY = pageY;

                    // Parent may have moved. Recompute our position based on (potentially) new origin.
                    element.css("left", 0);
                    element.css("top", 0);
                    var originOffset = element.offset();

                    var requiredPageLeft = pageX - grabLocalX;
                    var requiredPageTop = pageY - grabLocalY;

                    element.css("left", requiredPageLeft - originOffset.left);
                    element.css("top", requiredPageTop - originOffset.top);

                }

                var drop = function(pageX, pageY, e) {

                    var token = element.find(".symbol-token");
                    var tokenOffset = token.offset();

                    element.css("left", 0);
                    element.css("top", 0);

                    // TODO: Work out why the "-1" is necessary here...
                    scope.$emit("symbolDrop", scope.symbol, tokenOffset.left + token.width() / 2 - 1, tokenOffset.top + token.height() / 2 - 1);
                    $("body").off("mouseup", mouseup);
                    $("body").off("mousemove", mousemove);

                    scope.dragging = false;
                    scope.$apply();
                }

                var mousedown = function(e) {
                    grab(e.pageX, e.pageY, e);

                    e.stopPropagation();
                    e.preventDefault();
                }

                var mouseup = function(e) {
                    drop(e.pageX, e.pageY, e);

                    e.stopPropagation();
                    e.preventDefault();
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