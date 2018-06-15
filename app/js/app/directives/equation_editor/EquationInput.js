define(["/partials/equation_editor/equation_input.html"], function(templateUrl) {

    return ["$timeout", "$rootScope", "api", function($timeout, $rootScope, api) {

        return {
            scope: {
                state: "=",
                questionDoc: "=",
                editorMode: "=",
            },
            restrict: "A",
            templateUrl: templateUrl,
            link: function(scope, element, attrs) {
                scope.textEntryError = [];
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
                    // This is on a keyUp event so it should not fire when showEquationEditor returns (see below)
                    if (timer) {
                        $timeout.cancel(timer);
                        timer = null;
                    }
                    timer = $timeout(function() {
                        var pycode = element.find(".eqn-text-input")[0].value;
                        var openBracketsCount = pycode.split('(').length - 1;
                        var closeBracketsCount = pycode.split(')').length - 1;

                        scope.state = {result: {python: pycode}, textEntry: true};
                        var regexStr = "[^ (-)*-/0-9<->A-Z^-_a-z±²-³¼-¾×÷]+";
                        var badCharacters = RegExp(regexStr);
                        var goodCharacters = RegExp(regexStr.replace("^", ""), 'g');
                        scope.textEntryError = [];
                        if (/\\[a-zA-Z()]|[{}]/.test(pycode)) {
                            scope.textEntryError.push('LaTeX syntax is not supported.');
                        }
                        if (badCharacters.test(pycode)) {
                            scope.textEntryError.push('Some of the characters you are using are not allowed: ' + _.uniq(pycode.replace(goodCharacters, '')).join(' '));
                        }
                        if (openBracketsCount != closeBracketsCount) {
                            scope.textEntryError.push('You are missing some ' + (closeBracketsCount > openBracketsCount ? 'opening' : 'closing') + ' brackets.');
                        }
                        if (/\.[0-9]/.test(pycode)) {
                            scope.textEntryError.push('Please convert decimal numbers to fractions.');
                        }
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
                        // If we have the python form, add it to the text entry box (unless we're currently typing in the box; Safari bug!):
                        if (s.result.python && !(element.find(".eqn-text-input")[0] === document.activeElement)) {
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
