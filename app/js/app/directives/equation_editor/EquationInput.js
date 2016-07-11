define([], function() {

    return ["$timeout", "$rootScope", "api", function($timeout, $rootScope, api) {

        return {
            scope: {
                state: "=",
                questionDoc: "=",
            },
            restrict: "A",
            templateUrl: "/partials/equation_editor/equation_input.html",
            link: function(scope, element, attrs) {
                
                
                scope.edit = function() {
                    $rootScope.showEquationEditor(scope.state, scope.questionDoc).then(function(finalState) {
                        scope.state = finalState;
                        scope.$apply();
                    });
                };

                scope.$watch("state", function(s) {
                    if (s.result) {
                        katex.render(s.result.tex, element.find(".eqn-preview")[0]);
                    } else {
                        element.find(".eqn-preview").html("Click to enter formula");
                    }
                })
            }
        };
    }];
});