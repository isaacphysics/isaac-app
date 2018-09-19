"use strict";
define(["p5",
        "nearley",
        "app/js/lib/equation_editor/grammar.ne",
        "app/ts/inequality/Inequality.ts",
        "/partials/equation_editor/equation_input.html"],
        function(p5, nearley, grammar, MySketch, templateUrl) {

    MySketch = MySketch.MySketch;
    const compiledGrammar = nearley.Grammar.fromCompiled(grammar);

    const parseExpression = (expression = '') => {
        const parser = new nearley.Parser(compiledGrammar)
        let output = null
        try {
            output = parser.feed(expression).results
        } catch (error) {
            output = { error }
        }
        return output
    }
    void parseExpression;

    return ["$timeout", "$rootScope", "api", function($timeout, $rootScope, _api) {

        return {
            scope: {
                state: "=",
                questionDoc: "=",
                editorMode: "=",
            },
            restrict: "A",
            templateUrl: templateUrl,
            link: function(scope, element, _attrs) {

                scope.isEquality = _.startsWith(window.location.pathname, "/equality");

                scope.textEntryError = [];
                if (scope.questionDoc && scope.questionDoc.availableSymbols) {
                    try {
                        scope.symbolList = scope.questionDoc.availableSymbols.map(function (str) {return str.trim().replace(';', ',')}).join(", ");
                    } catch (err) {
                        // Do not let invalid availableSymbols prevent anyone from answering the question!
                        scope.symbolList = null;
                    }
                }

                scope.selectedSymbols = [];

                let letterMap = {"\\alpha": "α", "\\beta": "β", "\\gamma": "γ", "\\delta": "δ", "\\epsilon": "ε", "\\varepsilon": "ε", "\\zeta": "ζ", "\\eta": "η", "\\theta": "θ", "\\iota": "ι", "\\kappa": "κ", "\\lambda": "λ", "\\mu": "μ", "\\nu": "ν", "\\xi": "ξ", "\\omicron": "ο", "\\pi": "π", "\\rho": "ρ", "\\sigma": "σ", "\\tau": "τ", "\\upsilon": "υ", "\\phi": "ϕ", "\\chi": "χ", "\\psi": "ψ", "\\omega": "ω", "\\Gamma": "Γ", "\\Delta": "Δ", "\\Theta": "Θ", "\\Lambda": "Λ", "\\Xi": "Ξ", "\\Pi": "Π", "\\Sigma": "Σ", "\\Upsilon": "Υ", "\\Phi": "Φ", "\\Psi": "Ψ", "\\Omega": "Ω"};
                let inverseLetterMap = {};
                for (let k in letterMap) {
                    inverseLetterMap[letterMap[k]] = k;
                }
                inverseLetterMap["ε"] = "\\varepsilon"; // Make sure that this one wins.

                let sketch = null;
                let editorCanvas = element.find(".equation-editor-text-entry")[0];
                let p = new p5(function (p5instance) {
                    sketch = new MySketch(p5instance, scope, element.width(), element.height(), [], true);
                    $rootScope.sketch = sketch;
                    return sketch;
                }, editorCanvas);
                void p;

                // Magic starts here

                let countChildren = function(root) {
                    let q = [root];
                    let count = 1;
                    while (q.length > 0) {
                        let e = q.shift();
                        let c = Object.keys(e.children).length;
                        if (c > 0) {
                            count = count + c;
                            q = q.concat(Object.values(e.children));
                        }
                    }
                    return count
                };

                let timer = null;
                scope.textEdit = function() {
                    // This is on a keyUp event so it should not fire when showEquationEditor returns (see below)
                    if (timer) {
                        $timeout.cancel(timer);
                        timer = null;
                    }
                    timer = $timeout(function() {
                        let pycode = element.find(".eqn-text-input")[0].value;

                        scope.state = {result: {python: pycode}};
                        scope.textEntryError = [];

                        let parsedExpression = _.uniqWith(parseExpression(pycode), _.isEqual);
                        //console.log(parsedExpression);

                        if (parsedExpression.hasOwnProperty('error') || (parsedExpression.length === 0 && pycode != '')) {
                            // A parse error of some description!
                            // TODO: If there is an 'error' key, do something with it here. It contains useful information.
                            // if (parsedExpression.hasOwnProperty('error') {
                            //     let error = parsedExpression.error;
                            //     console.log(error.offset, error.token);
                            // }
                            console.warn("Failed to parse user input '" + pycode + "'!");

                            let openBracketsCount = pycode.split('(').length - 1;
                            let closeBracketsCount = pycode.split(')').length - 1;
                            let regexStr = "[^ (-)*-/0-9<->A-Z^-_a-z±²-³¼-¾×÷]+";
                            let badCharacters = new RegExp(regexStr);
                            let goodCharacters = new RegExp(regexStr.replace("^", ""), 'g');
                            if (/\\[a-zA-Z()]|[{}]/.test(pycode)) {
                                scope.textEntryError.push('LaTeX syntax is not supported.');
                            }
                            if (/\|.+?\|/.test(pycode)) {
                                scope.textEntryError.push('Vertical bar syntax for absolute value is not supported; use abs() instead.');
                            }
                            if (badCharacters.test(pycode)) {
                                scope.textEntryError.push('Some of the characters you are using are not allowed: ' + _.uniq(pycode.replace(goodCharacters, '')).join(' '));
                            }
                            if (openBracketsCount !== closeBracketsCount) {
                                scope.textEntryError.push('You are missing some ' + (closeBracketsCount > openBracketsCount ? 'opening' : 'closing') + ' brackets.');
                            }
                            if (/\.[0-9]/.test(pycode)) {
                                scope.textEntryError.push('Please convert decimal numbers to fractions.');
                            }

                        } else {
                            // Successfully parsed something:
                            if (pycode === '') {
                                element.find(".eqn-preview").html("Click here to enter a formula!");
                                scope.symbols = [];
                                scope.state.result.tex = "";
                                scope.state.result.python = "";
                                scope.state.result.mathml = "";
                                sketch.symbols = [];
                            } else if (parsedExpression.length === 1) {
                                sketch.parseSubtreeObject(parsedExpression[0], true, true);
                            } else {
                                let sizes = _.map(parsedExpression, countChildren);
                                let i = sizes.indexOf(Math.max.apply(null, sizes));
                                sketch.parseSubtreeObject(parsedExpression[i], true, true);
                            }
                            scope.state.userInput = pycode;
                        }

                    }, 250);
                };

                let replaceSpecialChars = function (s) {
                    for (let k in inverseLetterMap) {
                        // Special characters have special needs (i.e., a space after them).
                        // If the special character is followed by a non-special character, add a space:
                        s = s.replace(new RegExp(k + "(?=[A-Za-z0-9])", "g"), inverseLetterMap[k] + ' ');
                        // Otherwise just replace it.
                        s = s.replace(new RegExp(k + '', "g"), inverseLetterMap[k]);
                    }
                    return s;
                };

                scope.newEditorState = function (s) {
                    scope.state = s;
                    scope.state.textEntry = true;

                    console.log("New state:", s);

                    let rp = element.find(".eqn-preview");
                    rp.empty();

                    // this renders the result in the preview box in the bottom right corner of the eqn editor
                    if (scope.state.result) {
                        scope.state.result["tex"] = replaceSpecialChars(scope.state.result["tex"]);
                        scope.state.result["python"] = replaceSpecialChars(scope.state.result["python"]).replace(/\\/g, "").replace(/varepsilon/g, "epsilon");
                        katex.render(scope.state.result["tex"], rp[0]);
                    }

                    // TODO: Set the initial state?
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
                        // If we have the LaTeX form, render it; else answer was typed and we failed to parse it:
                        if (s.result.tex) {
                            katex.render(s.result.tex, element.find(".eqn-preview")[0]);
                        } else {
                            // This branch is only triggered when we can't parse a typed answer.
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
