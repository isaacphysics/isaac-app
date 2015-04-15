define([], function() {

    return ["$timeout", function($timeout) {

        return {
            scope: true,
            restrict: "A",
            templateUrl: "/partials/equation_editor/symbol_handle.html",
            link: function(scope, element, attrs) {
                element.on("mousedown", "polygon", function(e) {
                    console.log(e);
                })

                
            },
        };
    }];
});