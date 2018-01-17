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

                if (scope.questionDoc && scope.questionDoc.availableSymbols) {
                    try {
                        scope.symbolList = scope.questionDoc.availableSymbols.map(function (str) {return str.trim().replace(';', ',')}).join(", ");
                    } catch (err) {
                        // Do not let invalid availableSymbols prevent anyone from answering the question!
                        scope.symbolList = null;
                    }
                }


                var timer = null;
                scope.textEdit = function() {
                    if (timer) {
                        $timeout.cancel(timer);
                        timer = null;
                    }
                    timer = $timeout(function() {
                        // This is on a keyUp event so it should not fire when showEquationEditor returns (see below)
                        scope.state = {result: {python: element.find(".eqn-text-input")[0].value}, textEntry: true};
                    }, 250);
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
                        // We have an existing answer to the question.
                        // If we have the LaTeX form, render it; else answer was typed:
                        if (s.result.tex) {
                            katex.render(s.result.tex, element.find(".eqn-preview")[0]);
                        } else {
                            element.find(".eqn-preview").html("Click to replace your typed answer");
                        }
                        // If we have the python form, add it to the text entry box:
                        if (s.result.python) {
                            element.find(".eqn-text-input")[0].value = s.result.python;
                        }
                    } else if (scope.questionDoc) {
                        // This is a question part not yet attempted:
                        element.find(".eqn-preview").html("Click to enter your answer");
                    } else {
                        // This is probably the /equality page:
                        element.find(".eqn-preview").html("Click to enter a formula!");
                    }
                })
            }
        };
    }];
});
