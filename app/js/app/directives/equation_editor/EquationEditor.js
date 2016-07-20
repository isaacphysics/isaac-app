"use strict";
define(function(require) {

    var MySketch = require("inequality").MySketch;

    return ["$timeout", "$rootScope", "api", function($timeout, $rootScope, api) {

        return {
            scope: true,
            restrict: "A",
            templateUrl: "/partials/equation_editor/equation_editor.html",
            link: function(scope, element, attrs) {

                element.on("touchstart touchmove", "canvas", function(e) {
                    e.preventDefault();
                });

                var sketch = null;

                scope.canvasOffset = {};
                scope.draggingNewSymbol = false;

                scope.equationEditorElement = element;

                scope.selectedSymbols = [];
                scope.selectionHandleFlags = {
                    showCalc: false,
                    showResize: true,
                    showMove: false
                };

                scope.$on("triggerCloseMenus", function() {
                    scope.$broadcast("closeMenus");
                });

                scope.$on("triggerResizeMenu", function() {
                    scope.$broadcast("resizeMenu");
                });

                $(window).on("resize", function() {
                    element.find(".top-menu").css({
                        "bottom": scope.equationEditorElement.height()
                    }).removeClass("active-menu");
                });

                scope.$on("newSymbolDrag", function(_, symbol, pageX, pageY, mousePageX, mousePageY) {


                    scope.draggingNewSymbol = true;
                    scope.mousePageX = pageX;
                    scope.mousePageY = pageY;
                    var tOff = element.find(".trash-button").position();
                    var tWidth = element.find(".trash-button").width();
                    var tHeight = element.find(".trash-button").height();
                    scope.trashActive = (mousePageX > tOff.left && mousePageX < tOff.left + tWidth && mousePageY > tOff.top && mousePageY < tOff.top + tHeight);

                    sketch.updatePotentialSymbol(symbol, pageX, pageY);
                    scope.$digest();


                });

                scope.notifySymbolDrag = function(x, y) {
                    var tOff = element.find(".trash-button").position();
                    var tWidth = element.find(".trash-button").width();
                    var tHeight = element.find(".trash-button").height();

                    scope.trashActive = (x > tOff.left && x < tOff.left + tWidth && y > tOff.top && y < tOff.top + tHeight);
                    scope.$apply();
                };

                scope.$on("newSymbolAbortDrag", function() {
                    if (scope.draggingNewSymbol) {
                        scope.draggingNewSymbol = false;
                        scope.log.actions.push({
                            event: "ABORT_POTENTIAL_SYMBOL",
                            symbol: sketch.potentialSymbol.subtreeObject(false, true, true),
                            timestamp: Date.now()
                        });
                        sketch.updatePotentialSymbol(null);
                        scope.$digest();
                    }
                });

                scope.$on("spawnSymbol", function(_e) {
                    var offset = element.offset();
                    var width = element.width();
                    var height = element.height();

                    scope.draggingNewSymbol = false;

                    if (scope.trashActive) {
                        scope.log.actions.push({
                            event: "TRASH_POTENTIAL_SYMBOL",
                            symbol: sketch.potentialSymbol.subtreeObject(false, true, true),
                            timestamp: Date.now()
                        });
                        sketch.updatePotentialSymbol(null);
                        return;
                    }

                    // TODO: Improve with different widget types
                    sketch.commitPotentialSymbol();

                    scope.$broadcast("historyCheckpoint");

                    // console.log("scope.state: ", scope.state);
                });

                scope.logOnClose = function(event) {
                    // This ought to catch people who navigate away without closing the editor!
                    if (scope.log != null) {
                        scope.log.actions.push({
                            event: "NAVIGATE_AWAY",
                            timestamp: Date.now()
                        });
                        api.logger.log(scope.log);
                    }
                };

                $rootScope.showEquationEditor = function(initialState, questionDoc, editorMode) {

                    return new Promise(function(resolve, reject) {

                        delete scope.symbolLibrary.customVars;
                        delete scope.symbolLibrary.customFunctions;
                        delete scope.symbolLibrary.customChemicalSymbols;
                        delete scope.symbolLibrary.customFunction;

                        if (editorMode == "maths" && questionDoc && questionDoc.availableSymbols) {
                            var parsed = parseCustomSymbols(questionDoc.availableSymbols);
                            if (parsed.vars.length > 0) {
                                scope.symbolLibrary.customVars = parsed.vars;
                            }
                            if (parsed.fns.length > 0) {
                                scope.symbolLibrary.customFunctions = parsed.fns;
                            }
                        } else if (questionDoc && questionDoc.availableSymbols && editorMode == "chemistry") {
                            var parsed = parseCustomChemicalSymbols(questionDoc.availableSymbols);
                            if (parsed.length > 0) {
                                scope.symbolLibrary.customChemicalSymbols = parsed;
                            } else {
                                console.debug("Didn't parse any chemical symbols.");
                            }
                        }

                        $(".result-preview>span").empty();
                        $(".result-preview").width(0);

                        var eqnModal = $('#equationModal');
                        eqnModal.one("opened.fndtn.reveal", function() {
                            element.find(".top-menu").css("bottom", scope.equationEditorElement.height());
                        });

                        eqnModal.foundation("reveal", "open");
                        scope.state = initialState || {
                            symbols: []
                        };
                        scope.questionDoc = questionDoc;
                        scope.editorMode = editorMode;


                        scope.log = {
                            type: "EQN_EDITOR_LOG",
                            questionId: scope.questionDoc ? scope.questionDoc.id : null,
                            screenSize: {
                                width: window.innerWidth,
                                height: window.innerHeight
                            },
                            actions: [{
                                event: "OPEN",
                                timestamp: Date.now()
                            }]
                        };

                        // Log just before the page closes if tab/browser closed:
                        window.addEventListener("beforeunload", scope.logOnClose);
                        // Log the editor being closed and submit log event to server:
                        eqnModal.one("close", function(e) {
                            scope.log.finalState = [];
                            sketch.symbols.forEach(function(e) {
                               scope.log.finalState.push(e.subtreeObject(true, true));
                            });
                            scope.log.actions.push({
                                event: "CLOSE",
                                timestamp: Date.now()
                            });
                            if (scope.segueEnvironment == "DEV") {
                                console.log("\nLOG: ~" + (JSON.stringify(scope.log).length/1000).toFixed(2) + "kb\n\n", JSON.stringify(scope.log));
                            }
                            window.removeEventListener("beforeunload", scope.logOnClose);
                            api.logger.log(scope.log);
                            scope.log = null;
                        });

                        scope.history = [JSON.parse(JSON.stringify(scope.state))];
                        scope.historyPtr = 0;
                        //element.find("canvas").remove();

                        // TODO: Redisplay old equations in the centre

                        scope.future = [];
                        var p = new p5(function(p) {
                            sketch = new MySketch(p, scope, element.width(), element.height(), scope.state.symbols);
                            scope.sketch = sketch;
                            return sketch;
                        }, element.find(".equation-editor")[0]);

                        eqnModal.one("closed.fndtn.reveal", function() {
                            sketch.p.remove();
                            resolve(scope.state);
                        })

                    });
                };

                var latinLetters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
                var latinLettersUpper = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
                var greekLetters = ["\\alpha", "\\beta", "\\gamma", "\\delta", "\\varepsilon", "\\zeta", "\\eta", "\\theta", "\\iota", "\\kappa", "\\lambda", "\\mu", "\\nu", "\\xi", "\\omicron", "\\pi", "\\rho", "\\sigma", "\\tau", "\\upsilon", "\\phi", "\\chi", "\\psi", "\\omega"];
                var greekLettersUpper = ["\\Gamma", "\\Delta", "\\Theta", "\\Lambda", "\\Xi", "\\Pi", "\\Sigma", "\\Upsilon", "\\Phi", "\\Psi", "\\Omega"];
                var elements = ["H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne", "Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar", "K", "Ca", "Sc", "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn", "Ga", "Ge", "As", "Se", "Br", "Kr", "Rb", "Sr", "Y", "Zr", "Nb", "Mo", "Tc", "Ru", "Rh", "Pd", "Ag", "Cd", "In", "Sn", "Sb", "Te", "I", "Xe", "Cs", "Ba", "La", "Ce", "Pr", "Nd", "Pm", "Sm", "Eu", "Gd", "Tb", "Dy", "Ho", "Er", "Tm", "Yb", "Lu", "Hf", "Ta", "W", "Re", "Os", "Ir", "Pt", "Au", "Hg", "Tl", "Pb", "Bi", "Po", "At", "Rn", "Fr", "Ra", "Ac", "Th", "Pa", "U", "Np", "Pu", "Am", "Cm", "Bk", "Cf", "Es", "Fm", "Md", "No", "Lr", "Rf", "Db", "Sg", "Bh", "Hs", "Mt", "Ds", "Rg", "Cn", "Uut", "Fl", "Uup", "Lv", "Uus", "Uuo"];
                var particles = ["alpha", "beta", "gamma", "neutrino", "antineutrino", "proton", "neutron", "electron"];
                var letterMap = {
                    "\\alpha": "α",
                    "\\beta": "β",
                    "\\gamma": "γ",
                    "\\delta": "δ",
                    "\\epsilon": "ε",
                    "\\varepsilon": "ε",
                    "\\zeta": "ζ",
                    "\\eta": "η",
                    "\\theta": "θ",
                    "\\iota": "ι",
                    "\\kappa": "κ",
                    "\\lambda": "λ",
                    "\\mu": "μ",
                    "\\nu": "ν",
                    "\\xi": "ξ",
                    "\\omicron": "ο",
                    "\\pi": "π",
                    "\\rho": "ρ",
                    "\\sigma": "σ",
                    "\\tau": "τ",
                    "\\upsilon": "υ",
                    "\\phi": "ϕ",
                    "\\chi": "χ",
                    "\\psi": "ψ",
                    "\\omega": "ω",
                    "\\Gamma": "Γ",
                    "\\Delta": "Δ",
                    "\\Theta": "Θ",
                    "\\Lambda": "Λ",
                    "\\Xi": "Ξ",
                    "\\Pi": "Π",
                    "\\Sigma": "Σ",
                    "\\Upsilon": "Υ",
                    "\\Phi": "Φ",
                    "\\Psi": "Ψ",
                    "\\Omega": "Ω",
                };

                var chemicalSymbols = {};
                var chemicalSymbolsArray = elements.concat(particles);

                for (var i in chemicalSymbolsArray) {

                    chemicalSymbols[chemicalSymbolsArray[i]] = i;
                }

                var inverseLetterMap = {};
                for (var k in letterMap) {
                    inverseLetterMap[letterMap[k]] = k;
                }
                inverseLetterMap["ε"] = "\\varepsilon"; // Make sure that this one wins.

                var convertToLatexIfGreek = function(s) {
                    if (s == "epsilon") {
                        return "\\varepsilon";
                    }
                    if (greekLetters.indexOf("\\" + s) > -1) {
                        return "\\" + s;
                    }
                    if (greekLettersUpper.indexOf("\\" + s) > -1) {
                        return "\\" + s;
                    }
                    return s;
                };


                var parseCustomChemicalSymbols = function(symbols) {
                    // take symbols in string ["H", "He", "Li", "electron", "proton", "antineutrino"]
                    var custom = [];
                    for (var i in symbols) {
                        var s = symbols[i].trim();
                        if (s.length == 0) {
                            console.warn("Tried to parse zero-length symbol in list:", symbols);
                            continue;
                        }
                        console.debug("Parsing:", s);
                        console.log(chemicalSymbols.hasOwnProperty(s));
                        if (chemicalSymbols.hasOwnProperty(s)) {
                            var type = (chemicalSymbols[s] <= (elements.length - 1)) ? 'ChemicalElement' : 'Particle';
                            if (type == 'Particle') {
                                var index_of_particle = chemicalSymbols[s] - elements.length;
                                var particle_label = scope.symbolLibrary.particles[index_of_particle].menu.label;
                                custom.push({
                                    type: type,
                                    menu: {
                                        label: particle_label,
                                        texLabel: true,
                                        fontSize: "2em"
                                    },
                                    properties: {
                                        type: s,
                                        particle: scope.symbolLibrary.particles[index_of_particle].properties.particle
                                    }
                                });

                            } else {
                                custom.push({
                                    type: type,
                                    properties: {
                                        element: s
                                    },
                                    menu: {
                                        label: "\\text{" + s + "}",
                                        texLabel: true,
                                        // add here option for it to be part of nuclear equation
                                    }
                                });
                            }
                        }

                    }
                    return custom;
                };

                var parseCustomSymbols = function(symbols) {
                    var r = {
                        vars: [],
                        fns: [],
                    };

                    for (var i in symbols) {
                        var s = symbols[i].trim();
                        if (s.length == 0) {
                            console.warn("Tried to parse zero-length symbol in list:", symbols);
                            continue;
                        }

                        console.debug("Parsing:", s);

                        var parts = s.split(" ");
                        var partResults = [];
                        for (var j in parts) {
                            var p = parts[j];

                            if (p.endsWith("()")) {
                                var name = p.replace(/\(\)/g, "");
                                var innerSuperscript = ["sin", "cos", "tan", "arcsin", "arccos", "arctan", "sinh", "cosh", "tanh", "cosec", "sec", "cot", "arccosec", "arcsec", "arccot", "cosech", "sech", "coth", "arccosech", "arcsech", "arccoth", "arcsinh", "arccosh", "arctanh"].indexOf(name) > -1;
                                var allowSubscript = name == "log";
                                if (name.substring(0, 3) == "arc") {
                                    partResults.push({
                                        type: "Fn",
                                        properties: {
                                            name: name.substring(3),
                                            innerSuperscript: innerSuperscript,
                                            allowSubscript: allowSubscript
                                        },
                                        children: {
                                            superscript: {
                                                type: "Num",
                                                properties: {
                                                    significand: -1,
                                                    exponent: 0
                                                }
                                            }
                                        },
                                        menu: {
                                            label: "\\" + name,
                                            texLabel: true
                                        }
                                    });
                                } else {
                                    partResults.push({
                                        type: "Fn",
                                        properties: {
                                            name: name,
                                            innerSuperscript: innerSuperscript,
                                            allowSubscript: allowSubscript
                                        },
                                        menu: {
                                            label: "\\" + name,
                                            texLabel: true
                                        }
                                    });
                                }
                            } else {
                                var p1 = convertToLatexIfGreek(p.split("_")[0]);
                                var newSym = {
                                    type: "Symbol",
                                    properties: {
                                        letter: letterMap[p1] || p1,
                                    },
                                    menu: {
                                        label: p1,
                                        texLabel: true,
                                    }
                                };
                                var p2 = convertToLatexIfGreek(p.split("_")[1]);
                                if (p2) {
                                    newSym.children = {
                                        subscript: {
                                            type: "Symbol",
                                            properties: {
                                                letter: letterMap[p2] || p2,
                                                upright: p2.length > 1
                                            }
                                        }
                                    };
                                    newSym.menu.label += "_{" + p2 + "}";
                                }

                                partResults.push(newSym);
                            }
                        }

                        var root = partResults[0];
                        for (var k = 0; k < partResults.length - 1; k++) {
                            partResults[k].children = {
                                right: partResults[k + 1]
                            }
                            root.menu.label += " " + partResults[k + 1].menu.label;
                        }
                        switch (partResults[0].type) {
                            case "Symbol":
                                r.vars.push(root);
                                break;
                            case "Function":
                                r.fns.push(root);
                                break;
                        }

                    }

                    return r;
                };

                var replaceSpecialChars = function(s) {
                    for (var k in inverseLetterMap) {
                        // Special characters have special needs (i.e., a space after them).
                        // If the special character is followed by a non-special character, add a space:
                        s = s.replace(new RegExp(k + "(?=[A-Za-z0-9])", "g"), inverseLetterMap[k] + ' ');
                        // Otherwise just replace it.
                        s = s.replace(new RegExp(k, "g"), inverseLetterMap[k]);
                    }
                    return s;
                };

                // Make a single dict for lookup to impose an order. Should be quicker than indexOf repeatedly!
                var uniqueSymbolsTotalOrder = {};
                var uniqueSymbols = latinLetters.concat(latinLettersUpper, greekLetters, greekLettersUpper);
                for (var i = 0; i < uniqueSymbols.length; i++) {
                    uniqueSymbolsTotalOrder[uniqueSymbols[i]] = i;
                }

                var uniqueSymbolsSortFn = function(a, b) {
                    // Are these functions?
                    if (a.indexOf("()") > -1 && b.indexOf("()") > -1) {
                        if (a > b) return 1;
                        if (a < b) return -1;
                        return 0;
                    } else if (a.indexOf("()") > -1) {
                        return 1;
                    } else if (b.indexOf("()") > -1) {
                        return -1;
                    }
                    // For compound symbols, position using base symbol:
                    var baseA = convertToLatexIfGreek(a.split("_")[0].trim());
                    var baseB = convertToLatexIfGreek(b.split("_")[0].trim());
                    // We have a dict with the symbols and an integer order:
                    if (baseA in uniqueSymbolsTotalOrder && baseB in uniqueSymbolsTotalOrder) {
                        return uniqueSymbolsTotalOrder[baseA] - uniqueSymbolsTotalOrder[baseB];
                    } else if (baseA in uniqueSymbolsTotalOrder) {
                        return 1;
                    } else if (baseB in uniqueSymbolsTotalOrder) {
                        return -1;
                    }
                    // Otherwise use default guess:
                    if (a > b) return 1;
                    if (a < b) return -1;
                    return 0;
                }

                scope.newEditorState = function(s) {
                    scope.state = s;

                    console.log("New state:", s);

                    var rp = $(".result-preview>span");

                    rp.empty();

                    // this renders the result in the preview box in the bottom right corner of the eqn editor
                    if (scope.state.result) {
                        scope.state.result["uniqueSymbols"] = replaceSpecialChars(scope.state.result["uniqueSymbols"]).replace(/\\/g, "");
                        // Sort them into a unique order:
                        scope.state.result["uniqueSymbols"] = scope.state.result["uniqueSymbols"].split(", ").sort(uniqueSymbolsSortFn).join(", ")
                        scope.state.result["uniqueSymbols"] = scope.state.result["uniqueSymbols"].replace(/varepsilon/g, "epsilon");

                        scope.state.result["tex"] = replaceSpecialChars(scope.state.result["tex"]);
                        scope.state.result["python"] = replaceSpecialChars(scope.state.result["python"]).replace(/\\/g, "").replace(/varepsilon/g, "epsilon");
                        katex.render(scope.state.result["tex"], rp[0]);
                    }

                    var w = scope.state.result ? rp.outerWidth() : 0;
                    var resultPreview = $(".result-preview");
                    resultPreview.stop(true);
                    resultPreview.animate({
                        width: w
                    }, 200);

                    scope.$emit("historyCheckpoint");
                }

                var stringSymbols = function(ss) {
                    var symbols = [];
                    for (var i in ss) {
                        var s = ss[i];
                        symbols.push({
                            type: "Symbol",
                            properties: {
                                letter: letterMap[s] || s
                            },
                            menu: {
                                label: s,
                                texLabel: true,
                            }
                        });
                    }

                    return symbols;
                };

                var chemicalElements = function(elementArray) {
                    var elements = [];

                    for (var i in elementArray) {

                        var currentElement = elementArray[i];
                        elements.push({
                            type: "ChemicalElement",
                            properties: {
                                element: currentElement
                            },
                            menu: {
                                label: "\\text{" + currentElement + "}",
                                texLabel: true,
                                // add here option for it to be part of nuclear equation
                            }
                        });
                    }
                    return elements;
                };
                var numberStrings = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

                var theNumbers = function(numberArray) {
                    var elements = [];
                    for (var i = 0; i < 10; i++) {
                        var numString = i.toString();

                        elements[numberStrings[i]] = {
                            type: "Num",
                            properties: {
                                significand: numString,
                            },
                            menu: {
                                label: numString,
                                texLabel: false,
                            }
                        }
                    }


                    return elements;
                };


                scope.symbolLibrary = {

                    latinLetters: stringSymbols(latinLetters),

                    latinLettersUpper: stringSymbols(latinLettersUpper),

                    greekLetters: stringSymbols(greekLetters),

                    greekLettersUpper: stringSymbols(greekLettersUpper),

                    chemicalElements: chemicalElements(elements),

                    theNumbers: theNumbers(numberStrings),

                    particles: [{
                        type: 'Particle',
                        menu: {
                            label: '\\alpha',
                            texLabel: true,
                            fontSize: "2em"
                        },
                        properties: {
                            particle: 'α',
                            type: 'alpha',

                        }
                    }, {
                        type: 'Particle',
                        menu: {
                            label: '\\beta',
                            texLabel: true,
                            fontSize: "2em"
                        },
                        properties: {
                            particle: 'β',
                            type: 'beta'
                        }
                    }, {
                        type: 'Particle',
                        menu: {
                            label: '\\gamma',
                            texLabel: true,
                            fontSize: "2em"
                        },
                        properties: {
                            particle: 'γ',
                            type: 'gamma'
                        }
                    }, {
                        type: 'Particle',
                        menu: {
                            label: '\\nu',
                            texLabel: true,
                            fontSize: "2em"
                        },
                        properties: {
                            particle: 'ν',
                            type: 'neutrino'
                        }
                    }, {
                        type: 'Particle',
                        menu: {
                            label: '\\bar{\\nu}',
                            texLabel: true,
                            fontSize: "2em"
                        },
                        properties: {
                            particle: 'ν̅',
                            type: 'antineutrino'
                        }
                    }, {
                        type: 'Particle',
                        menu: {
                            label: '\\text{p}',
                            texLabel: true,
                            fontSize: "2em"
                        },
                        properties: {
                            particle: 'p',
                            type: 'proton'
                        }
                    }, {
                        type: 'Particle',
                        menu: {
                            label: '\\text{n}',
                            texLabel: true,
                            fontSize: "2em"
                        },
                        properties: {
                            particle: 'n',
                            type: 'neutron'
                        }
                    }, {
                        type: 'Particle',
                        menu: {
                            label: '\\text{e}',
                            texLabel: true,
                            fontSize: "2em"
                        },
                        properties: {
                            particle: 'e',
                            type: 'electron'
                        }
                    }, ],

                    theStates: [{
                        type: 'StateSymbol',
                        menu: {
                            label: '\\text{(g)}',
                            texLabel: true,
                            fontSize: "2em"
                        },
                        properties: {
                            state: 'gas',
                        }
                    }, {
                        type: 'StateSymbol',
                        menu: {
                            label: '\\text{(l)}',
                            texLabel: true,
                            fontSize: "2em"
                        },
                        properties: {
                            state: 'liquid',
                        }
                    }, {
                        type: 'StateSymbol',
                        menu: {
                            label: '\\text{(aq)}',
                            texLabel: true,
                            fontSize: "2em"
                        },
                        properties: {
                            state: 'aqueous',
                        }
                    }, {
                        type: 'StateSymbol',
                        menu: {
                            label: '\\text{(s)}',
                            texLabel: true,
                            fontSize: "2em"
                        },
                        properties: {
                            state: 'solid',
                        }
                    }, {
                        type: 'StateSymbol',
                        menu: {
                            label: '\\text{(m)}',
                            texLabel: true,
                            fontSize: "2em"
                        },
                        properties: {
                            state: 'metal',
                        }
                    }],

                    chemOps: [{
                        type: 'Relation',
                        menu: {
                            label: '\\rightarrow',
                            texLabel: true,
                        },
                        properties: {
                            relation: 'rightarrow'
                        }
                    }, {
                        type: "BinaryOperation",
                        properties: {
                            operation: "+",
                        },
                        menu: {
                            label: "+",
                            texLabel: true
                        }
                    }, {
                        type: "BinaryOperation",
                        properties: {
                            operation: "-",
                        },
                        menu: {
                            label: "-",
                            texLabel: true
                        }
                    },{
                        type: "Relation",
                        menu: {
                            label: '\\rightleftharpoons ',
                            texLabel: true,
                        },
                        properties: {
                            relation: 'equilibrium'
                        }
                    },{
                        type: "Brackets",
                        properties: {
                            type: "round",
                        },
                        menu: {
                            label: "(x)",
                            texLabel: true
                        }
                    }],
                    reducedOps: [{
                        type: "BinaryOperation",
                        properties: {
                            operation: "+",
                        },
                        menu: {
                            label: "+",
                            texLabel: true
                        }
                    }, {
                        type: "BinaryOperation",
                        properties: {
                            operation: "−",
                        },
                        menu: {
                            label: "-",
                            texLabel: true
                        }
                    }, {
                        type: "Fraction",
                        menu: {
                            label: "\\frac{a}{b}",
                            texLabel: true
                        }
                    }, {
                        type: "Brackets",
                        properties: {
                            type: "round",
                        },
                        menu: {
                            label: "(x)",
                            texLabel: true
                        }
                    }, {
                        type: "Radix",
                        menu: {
                            label: "\\sqrt{x}",
                            texLabel: true
                        }
                    }, {

                        type: 'Relation',
                        menu: {
                            label: '=',
                            texLabel: true,
                        },
                        properties: {
                            relation: '='
                        }
                    }],

                    /*
                                        equality: [{
                                            type: "string",
                                            label: "=",
                                            token: "=",
                                            fontSize: 48,
                                            texLabel: true
                                        },{
                                            type: "string",
                                            label: "<",
                                            token: "<",
                                            fontSize: 48,
                                            texLabel: true
                                        },{
                                            type: "string",
                                            label: ">",
                                            token: ">",
                                            fontSize: 48,
                                            texLabel: true
                                        },{
                                            type: "string",
                                            label: "\\leq",
                                            token: "\\leq",
                                            fontSize: 48,
                                            texLabel: true
                                        },{
                                            type: "string",
                                            label: "\\geq",
                                            token: "\\geq",
                                            fontSize: 48,
                                            texLabel: true
                                        }
                                        ],

                                        calculus: [{
                                            type: "string",
                                            label: "\\int",
                                            token: "\\int",
                                            fontSize: 48,
                                            texLabel: true
                                        },{
                                            type: "string",
                                            label: "\\mathrm{d}",
                                            token: "\\mathrm{d}",
                                            fontSize: 48,
                                            texLabel: true
                                        },{
                                            type: "string",
                                            label: "\\mathrm{e}",
                                            token: "\\mathrm{e}",
                                            fontSize: 48,
                                            texLabel: true
                                        },{
                                            type: "string",
                                            label: "\\ln",
                                            token: "\\ln",
                                            fontSize: 48,
                                            texLabel: true
                                        },{
                                            type: "string",
                                            label: "\\log",
                                            token: "\\log",
                                            fontSize: 48,
                                            texLabel: true
                                        }
                                        ],

                                        operators: [{
                                            type: "string",
                                            label: "+",
                                            token: "+",
                                            fontSize: 48,
                                            texLabel: true
                                        },{
                                            type: "line",
                                            label: "-",
                                            token: "-",
                                            length: 40,
                                            texLabel: true
                                        },{
                                            type: "string",
                                            label: "\\times",
                                            token: "\\times",
                                            fontSize: 48,
                                            texLabel: true
                                        },{
                                            type: "line",
                                            label: "\\frac{a}{b}",
                                            token: ":frac",
                                            length: 100,
                                            texLabel: true
                                        },{
                                            type: "string",
                                            label: "\\pm",
                                            token: "\\pm",
                                            fontSize: 48,
                                            texLabel: true
                                        },{
                                            type: "container",
                                            subType: "sqrt",
                                            width: 148,
                                            height: 60,
                                            label: "\\sqrt{x}",
                                            texLabel: true
                                        },{
                                            type: "container",
                                            subType: "brackets",
                                            width: 220,
                                            height: 70,
                                            label: "(x)",
                                            texLabel: true
                                        },{
                                            type: "container",
                                            subType: "abs",
                                            width: 148,
                                            height: 60,
                                            label: "|x|",
                                            texLabel: true
                                        }, {
                                            type: "string",
                                            label: "!",
                                            token: "!",
                                            fontSize: 48,
                                            texLabel: true
                                        }
                                        ],
                    */
                    trig: [{
                        type: "Fn",
                        properties: {
                            name: "sin",
                            innerSuperscript: true
                        },
                        menu: {
                            label: "\\sin",
                            texLabel: true
                        }
                    }, {
                        type: "Fn",
                        properties: {
                            name: "cos",
                            innerSuperscript: true
                        },
                        menu: {
                            label: "\\cos",
                            texLabel: true
                        }
                    }, {
                        type: "Fn",
                        properties: {
                            name: "tan",
                            innerSuperscript: true
                        },
                        menu: {
                            label: "\\tan",
                            texLabel: true
                        }
                    }],

                    otherFns: [{
                        type: "Fn",
                        properties: {
                            name: "ln",
                            allowSubscript: false
                        },
                        menu: {
                            label: "\\ln",
                            texLabel: true
                        }
                    }, {
                        type: "Fn",
                        properties: {
                            name: "log",
                            allowSubscript: true
                        },
                        menu: {
                            label: "\\log",
                            texLabel: true
                        }
                    }],

                };

                scope.particlesTitle = {
                    menu: {
                        label: "α",
                    },
                    type: "string",
                };

                scope.elementsTitle = {
                    menu: {
                        label: "H",
                    },
                    type: "string",
                };


                scope.latinLetterTitle = {
                    menu: {
                        label: "abc",
                    },
                    type: "string",
                };

                scope.latinLetterUpperTitle = {
                    type: "string",
                    menu: {
                        label: "ABC"
                    }
                };

                scope.greekLetterTitle = {
                    type: "string",
                    menu: {
                        label: "\\alpha\\beta",
                        texLabel: true
                    }
                };

                scope.greekLetterUpperTitle = {
                    type: "string",
                    menu: {
                        label: "\\Gamma\\Sigma",
                        texLabel: true
                    }
                };
                /*
                                scope.equalityTitle = {
                                    fontSize: 48,
                                    type: "string",
                                    label: "="
                                };

                                scope.operatorMenuTitle = {
                                    fontSize: 48,
                                    type: "string",
                                    label: "\\pm",
                                    texLabel: true
                                };

                                scope.calculusTitle = {
                                    type: "string",
                                    menu: {
                                        label: "\\int",
                                        texLabel: true
                                    }
                                };
                */
                scope.trigTitle = {
                    type: "string",
                    menu: {
                        label: "\\sin",
                        texLabel: true
                    }
                };

                scope.otherFnTitle = {
                    type: "string",
                    menu: {
                        label: "\\log",
                        texLabel: true
                    }
                };

                scope.historyPtr = -1;
                scope.history = [];

                scope.$on("historyCheckpoint", function() {

                    var newEntry = JSON.stringify(scope.state);
                    var currentEntry = JSON.stringify(scope.history[scope.historyPtr]);

                    if (newEntry != currentEntry) {
                        scope.historyPtr++;
                        scope.history.splice(scope.historyPtr, scope.history.length - scope.historyPtr, JSON.parse(newEntry));

                        console.log("historyCheckpoint:", scope.history);
                    }
                });

                scope.undo = function() {
                    if (scope.historyPtr > 0) {
                        scope.historyPtr--;

                        var e = scope.history[scope.historyPtr];
                        scope.state = JSON.parse(JSON.stringify(e));
                        sketch.symbols = [];
                        for (var i in scope.state.symbols) {
                            sketch.parseSubtreeObject(scope.state.symbols[i]);
                        }
                        scope.log.actions.push({
                            event: "UNDO",
                            timestamp: Date.now()
                        });

                    }
                };

                scope.redo = function() {
                    if (scope.historyPtr < scope.history.length - 1) {
                        scope.historyPtr++;

                        var e = scope.history[scope.historyPtr];
                        scope.state = JSON.parse(JSON.stringify(e));
                        sketch.symbols = [];
                        for (var i in scope.state.symbols) {
                            sketch.parseSubtreeObject(scope.state.symbols[i]);
                        }
                        scope.log.actions.push({
                            event: "REDO",
                            timestamp: Date.now()
                        });
                    }
                };

                scope.submit = function() {
                    $("#equationModal").foundation("reveal", "close");
                };

                scope.centre = function() {
                    sketch.centre();
                }

                element.on("keydown", function(e) {
                    console.log("KeyDown", e.which);

                    switch (e.which) {
                        case 8: // Backspace. Deliberately fall through.
                        case 46: // Delete
                            e.stopPropagation();
                            e.preventDefault();
                            scope.trash();
                            scope.$apply();
                            break;
                    }
                });

                // TODO: Make this work under new regime
                var updateSelectionRender = function() {
                    return;
                    var selectionHandle = element.find("[selection-handle]");
                    var canvasOffset = element.offset();

                    var maxX = 0;
                    var maxY = 0;

                    for (var i in scope.selectedSymbols) {
                        var sid = scope.selectedSymbols[i];
                        var e = $("#" + sid + " .canvas-symbol");
                        var offset = e.offset();

                        var localPos = {
                            left: offset.left - canvasOffset.left,
                            top: offset.top - canvasOffset.top,
                            width: e.width(),
                            height: e.height()
                        };

                        maxX = Math.max(maxX, localPos.left + localPos.width);
                        maxY = Math.max(maxY, localPos.top + localPos.height);
                    }

                    selectionHandle.css({
                        left: maxX,
                        top: maxY
                    });

                    scope.selectionHandleFlags.showCalc = scope.selectedSymbols.length == 1 && scope.state.symbols[scope.selectedSymbols[0]].fromCalc;
                    scope.selectionHandleFlags.showResize = scope.selectedSymbols.length == 1;
                    scope.selectionHandleFlags.enableSymbolModMenu = scope.selectedSymbols.length == 1 && scope.state.symbols[scope.selectedSymbols[0]].enableMods;
                    //scope.selectionHandleFlags.symbolModMenuOpen = false
                };

                // TODO: As above
                scope.$watchCollection("selectedSymbols", updateSelectionRender);

                // TODO: Decide how to edit numbers.
                /*
                scope.$on("selection_calc", function(_, e) {

                    // If we got here, there should be precisely one symbol selected.

                    if (scope.selectedSymbols.length != 1) {
                        console.error(new Error("Can only edit single numbers"));
                        debugger;
                    }

                    scope.$broadcast("editNumber", scope.state.symbols[scope.selectedSymbols[0]]);

                    scope.$digest();

                    e.stopPropagation();
                    e.preventDefault();
                });*/

                // TODO: Implement symbol mods in TypeScript
                /*
                var rebuildSymbolToken = function(s) {
                    s.token = s.baseToken;

                    if(s.vector== 1) {
                        s.token = "\\mathbf{" + s.token + "}";
                    } else if (s.vector == 2) {
                        s.token = "\\mathbf{\\hat " + s.token + "}";
                    }



                    if (s.dot == 1) {
                        s.token = "\\dot{" + s.token + "}";
                    } else if (s.dot == 2) {
                        s.token = "\\ddot{" + s.token + "}";
                    }

                    for (var i = 0; i < s.prime || 0; i++) {
                        s.token += "'";
                    }

                };

                scope.$on("selection_mod", function(_, type, e) {

                    // If we got here, there should be precisely one symbol selected.
                    if (scope.selectedSymbols.length != 1) {
                        console.error(new Error("Can only modify single symbols"));
                        debugger;
                    }

                    var s = scope.state.symbols[scope.selectedSymbols[0]];
                    console.debug("Add mod:", type, s);

                    switch(type) {
                        case "dot":
                            s.dot = s.dot || 0;
                            s.dot = (s.dot + 1) % 3;
                            rebuildSymbolToken(s);
                            break;
                        case "prime":

                            s.prime = s.prime || 0;
                            s.prime = (s.prime + 1) % 3;
                            rebuildSymbolToken(s);
                            break;
                        case "vector":
                            s.vector = s.vector || 0;
                            s.vector = (s.vector + 1) % 3;
                            rebuildSymbolToken(s);
                            break;
                    }
                    scope.$apply();

                    e.stopPropagation();
                    e.preventDefault();
                });
                */
                scope.$on("menuOpened", function() {
                    // TODO: Deselect symbols when opening menus
                    //scope.selectedSymbols.length = 0;
                    //scope.selectionHandleFlags.symbolModMenuOpen = false
                });

                scope.trash = function() {
                    // TODO: Delete selected symbols
                    /*
                    if (scope.selectedSymbols.length > 0) {
                        for (var i in scope.selectedSymbols){
                            var sid = scope.selectedSymbols[i];
                            delete scope.state.symbols[sid];
                        }
                        scope.selectedSymbols.length = 0;
                        scope.selectionHandleFlags.symbolModMenuOpen = false;
                    }
                    */
                    scope.$emit("historyCheckpoint");
                }
            }
        };
    }];
});
