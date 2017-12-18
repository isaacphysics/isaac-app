define([], function() {

    return ["$timeout", "$rootScope", "api", function($timeout, $rootScope, api) {

        return {
            scope: {
                state: "=",
                questionDoc: "=",
                editorMode: "=",
            },
            restrict: "A",
            templateUrl: "/partials/equation_editor/equation_input.html",
            link: function(scope, element, attrs) {

                scope.textEdit = function() {
                    // This is on a keyUp event so it should not fire when showEquationEditor returns (see below)
                    scope.state.formula = element.find(".eqn-text-input")[0].value;
                    scope.$apply();
                };

                scope.edit = function() {

                    history.pushState({'null':'is null'}, "A Fake Title", window.location.href);
                    window.onpopstate = function(e) {
                        e.preventDefault();
                        $("#equationModal").foundation("reveal", "close");
                    };

                    $rootScope.showEquationEditor(scope.state, scope.questionDoc, scope.editorMode).then(function(finalState) {
                        scope.state = finalState;
                        if (finalState.hasOwnProperty("result") && finalState.result.hasOwnProperty("python")) {
                            element.find(".eqn-text-input")[0].value = finalState.result.python;
                        }
                        scope.$apply();
                    });
                };

                scope.$watch("state", function(s) {
                    if (s && s.result) {
                        katex.render(s.result.tex, element.find(".eqn-preview")[0]);
                    } else if (scope.questionDoc) {
                        element.find(".eqn-preview").html("Click to enter your answer");
                    } else {
                        element.find(".eqn-preview").html("Click to enter a formula!");
                    }
                })
            }
        };
    }];
});
