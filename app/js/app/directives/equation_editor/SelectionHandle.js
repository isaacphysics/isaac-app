define([], function() {

    return ["$timeout", function($timeout) {

        return {
            scope: true,
            restrict: "A",
            templateUrl: "/partials/equation_editor/selection_handle.html",
            link: function(scope, element, attrs) {

                element.on("mousedown", "polygon.handle-move", function(e) {
                    scope.$emit("selection_grab", null, e.pageX, e.pageY, "move", e);
                });

                element.on("mousedown", "polygon.handle-resize", function(e) {
                    scope.$emit("selection_grab", null, e.pageX, e.pageY, "resize", e);
                });

            },
        };
    }];
});