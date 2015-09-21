define([], function() {

    return ["$timeout", function($timeout) {

        return {
            scope: true,
            restrict: "A",
            templateUrl: "/partials/equation_editor/selection_handle.html",
            link: function(scope, element, attrs) {

                element.on("mousedown", "polygon.handle-move", function(e) {
                    scope.$emit("selection_grab", null, "move", e);
                });

                element.on("mousedown", "polygon.handle-resize", function(e) {
                    scope.$emit("selection_grab", null, "resize", e);
                });

                element.on("mousedown touchstart", "polygon.handle-calc", function(e) {
                    scope.$emit("selection_calc", e);
                });

                element.on("mousedown touchstart", "polygon.handle-show-symbol-mod-menu", function(e) {
                    scope.selectionHandleFlags.symbolModMenuOpen = true;
                    scope.$apply();

                    e.stopPropagation();
                    e.preventDefault();
                });

                element.on("mousedown touchstart", "polygon.handle-vector", function(e) {
                    scope.$emit("selection_mod", "vector", e);
                });
                element.on("mousedown touchstart", "polygon.handle-dot", function(e) {
                    scope.$emit("selection_mod", "dot", e);
                });
                element.on("mousedown touchstart", "polygon.handle-prime", function(e) {
                    scope.$emit("selection_mod", "prime", e);
                });

                var touchStart = function(mode, e) {
                    e = e.originalEvent;
                    if(e.touches.length == 1) {
                        scope.$emit("selection_grab", scope.symbolId, mode, e);
                        element.on("touchmove", touchMove);
                        element.on("touchend", touchEnd);
                    }
                };

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

                element.on("touchstart", "polygon.handle-move", touchStart.bind(null, "move"));
                element.on("touchstart", "polygon.handle-resize", touchStart.bind(null, "resize"));

                element.on("touchmove", touchMove);
                element.on("touchend", touchEnd);



            },
        };
    }];
});