define([], function() {

    return ["$timeout", "$rootScope", function($timeout, $rootScope) {

        return {
            scope: {
                state: "=",
            },
            restrict: "A",
            templateUrl: "/partials/equation_editor/equation_input.html",
            link: function(scope, element, attrs) {

                scope.edit = function() {
                    $rootScope.showEquationEditor(scope.state);
                }

                scope.$watch("state", function(s) {
                    console.debug("New state:", s);
                    if (s.result && s.result.tex) {
                        katex.render(s.result.tex, element.find(".eqn-preview")[0]);
                    } else {
                        element.find(".eqn-preview").text("Click here to enter equation");                        
                    }
                }, true);

            },
        };
    }];
});