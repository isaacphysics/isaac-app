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

                scope.canvasOffset = { };
                scope.draggingNewSymbol = false;

                scope.equationEditorElement = element;

                scope.selectedSymbols = [];
                scope.selectionHandleFlags = {
                    showCalc: false,
                    showResize: true,
                    showMove: true
                };

                scope.$on("triggerCloseMenus", function() {
                	scope.$broadcast("closeMenus");
                });

                scope.$on("triggerResizeMenu", function() {
                	scope.$broadcast("resizeMenu");
                });

                $(window).on("resize", function() {
                    element.find(".top-menu").css({"bottom": scope.equationEditorElement.height()}).removeClass("active-menu");
                });

                scope.$on("newSymbolDrag", function(_, symbol, pageX, pageY, mousePageX, mousePageY) {
                    scope.draggingNewSymbol = true;

                    var tOff = element.find(".trash-button").position();
                    var tWidth = element.find(".trash-button").width();
                    var tHeight = element.find(".trash-button").height();
                    scope.trashActive = (mousePageX > tOff.left && mousePageX < tOff.left + tWidth && mousePageY > tOff.top && mousePageY < tOff.top + tHeight);

                    sketch.updatePotentialSymbol(symbol, pageX, pageY);
                    scope.$digest();

                });

                scope.notifySymbolDrag = function(x,y) {
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
                            symbol: sketch.potentialSymbol.subtreeObject(false, true),
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
                            symbol: sketch.potentialSymbol.subtreeObject(false, true),
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

                $rootScope.showEquationEditor = function(initialState, questionDoc) {

                    return new Promise(function(resolve, reject) {

                        delete scope.symbolLibrary.customVars;
                        delete scope.symbolLibrary.customFunctions;
                        if (questionDoc && questionDoc.availableSymbols) {
                            var parsed = parseCustomSymbols(questionDoc.availableSymbols);
                            if (parsed.vars.length > 0) {
                                scope.symbolLibrary.customVars = parsed.vars;
                            }
                            if (parsed.fns.length > 0) {
                                scope.symbolLibrary.customFunctions = parsed.fns;
                            }
                        }

                        $(".result-preview>span").empty();
                        $(".result-preview").width(0);

                        var eqnModal = $('#equationModal');
                        eqnModal.one("opened.fndtn.reveal", function() {
                            element.find(".top-menu").css("bottom", scope.equationEditorElement.height());
                        });
                        
                        eqnModal.foundation("reveal", "open");
                        scope.state = initialState || { symbols: []  };
                        scope.questionDoc = questionDoc;
                        
                        scope.log = {
                            type: "EQN_EDITOR_LOG",
                            questionId: scope.questionDoc ? scope.questionDoc.id : null,
                            screenSize: { width: window.innerWidth, height: window.innerHeight },
                            actions: [{
                                event: "OPEN",
                                timestamp: new Date().getTime()
                            }]
                        };

                        scope.history = [JSON.parse(JSON.stringify(scope.state))];
                        scope.historyPtr = 0;
                        //element.find("canvas").remove();

                        // TODO: Redisplay old equations in the centre

                        scope.future = [];
                        var p = new p5( function(p) {
                            sketch = new MySketch(p, scope, element.width(), element.height(), scope.state.symbols);
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
                var greekLetters = ["\\alpha","\\beta","\\gamma","\\delta","\\varepsilon","\\zeta","\\eta","\\theta","\\iota","\\kappa","\\lambda","\\mu","\\nu","\\xi","\\omicron","\\pi","\\rho","\\sigma","\\tau","\\upsilon","\\phi","\\chi","\\psi","\\omega"];
                var greekLettersUpper = ["\\Gamma","\\Delta","\\Theta","\\Lambda","\\Xi","\\Pi","\\Sigma","\\Upsilon","\\Phi","\\Psi","\\Omega"];
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
                    "\\phi": "φ",
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
                    "\\Omega": "Ω"
                };
                var inverseLetterMap = {};
                for(var k in letterMap) {
                    inverseLetterMap[letterMap[k]] = k;
                }
                inverseLetterMap["ε"] = "\\varepsilon"; // Make sure that this one wins.

                var convertToLatexIfGreek = function(s) {
                    if (s == "epsilon") {
                        return "\\varepsilon";
                    }
                    if (greekLetters.indexOf("\\"+s) > -1) {
                        return "\\" + s;
                    }
                    if (greekLettersUpper.indexOf("\\"+s) > -1) {
                        return "\\" + s;
                    }
                    return s;
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
                                if(name.substring(0,3) == "arc") {
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
                                    newSym.menu.label += "_{" + p2 +"}";
                                }

                                partResults.push(newSym);
                            }
                        }

                        var root = partResults[0];
                        for (var k = 0; k < partResults.length-1; k++) {
                            partResults[k].children = { right: partResults[k+1] }
                            root.menu.label += " " + partResults[k+1].menu.label;
                        }
                        switch(partResults[0].type) {
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
                        s = s.replace(new RegExp(k+"(?=[A-Za-z0-9])", "g"), inverseLetterMap[k] + ' ');
                        // Otherwise just replace it.
                        s = s.replace(new RegExp(k, "g"), inverseLetterMap[k]);
                    }
                    return s;
                }

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

                    console.log("New state:",s);

                    var rp = $(".result-preview>span");

                    rp.empty();


                    if (scope.state.result) {
                        scope.state.result["uniqueSymbols"] = replaceSpecialChars(scope.state.result["uniqueSymbols"]).replace(/\\/g,"");
                        // Sort them into a unique order:
                        scope.state.result["uniqueSymbols"] = scope.state.result["uniqueSymbols"].split(", ").sort(uniqueSymbolsSortFn).join(", ")
                        scope.state.result["uniqueSymbols"] = scope.state.result["uniqueSymbols"].replace(/varepsilon/g, "epsilon");

                        scope.state.result["tex"] = replaceSpecialChars(scope.state.result["tex"]);
                        scope.state.result["python"] = replaceSpecialChars(scope.state.result["python"]).replace(/\\/g,"").replace(/varepsilon/g, "epsilon");
                        katex.render(scope.state.result["tex"], rp[0]);
                    }

                    var w =  scope.state.result ? rp.outerWidth() : 0;
                    var resultPreview = $(".result-preview");
                    resultPreview.stop(true);
                    resultPreview.animate({width: w}, 200);

                    scope.$emit("historyCheckpoint");
                }

                var stringSymbols = function(ss) {
                	var symbols = [];
                	for(var i in ss) {
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

                scope.symbolLibrary = {

                    latinLetters: stringSymbols(latinLetters),

                    latinLettersUpper: stringSymbols(latinLettersUpper),

                    greekLetters: stringSymbols(greekLetters),
                    
                    greekLettersUpper: stringSymbols(greekLettersUpper),


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
                            label:  "\\sin",
                            texLabel: true
                        }
                    },{
                        type: "Fn",
                        properties: {
                            name: "cos",
                            innerSuperscript: true
                        },
                        menu: {
                            label:  "\\cos",
                            texLabel: true
                        }
                    },{
                        type: "Fn",
                        properties: {
                            name: "tan",
                            innerSuperscript: true
                        },
                        menu: {
                            label:  "\\tan",
                            texLabel: true
                        }
                    }
                    ],

                    otherFns: [{
                        type: "Fn",
                        properties: {
                            name: "ln",
                            allowSubscript: false
                        },
                        menu: {
                            label:  "\\ln",
                            texLabel: true
                        }
                    },{
                        type: "Fn",
                        properties: {
                            name: "log",
                            allowSubscript: true
                        },
                        menu: {
                            label:  "\\log",
                            texLabel: true
                        }
                    }
                    ],

                };

                scope.latinLetterTitle = {
                    menu: {
                        label: "abc",
                    },
                    type: "string",
                };

                scope.latinLetterUpperTitle = {
                    type: "string",
                    menu: { label: "ABC" }
                };

                scope.greekLetterTitle = {
                    type: "string",
                    menu : {
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
                            type: "UNDO",
                            timestamp: new Date().getTime()
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
                            type: "REDO",
                            timestamp: new Date().getTime()
                    });
                    }
                };

                scope.submit = function() {
                    $("#equationModal").foundation("reveal", "close");
                    api.logger.log({
                        type : "CLOSE_EQUATION_EDITOR"
                    });
                    scope.log.finalState = [];
                    sketch.symbols.forEach(function(e) {
                       scope.log.finalState.push(e.subtreeObject(true, true));
                    });
                    scope.log.actions.push({
                        type: "CLOSE",
                        timestamp: new Date().getTime()
                    });
                    console.log("\nLOG: ~" + 2*JSON.stringify(scope.log).length + "kb\n\n", JSON.stringify(scope.log));
                };

                scope.centre = function() {
                    sketch.centre();
                }

                element.on("keydown", function(e) {
                    console.log("KeyDown", e.which);

                    switch(e.which) {
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

                    for(var i in scope.selectedSymbols) {
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