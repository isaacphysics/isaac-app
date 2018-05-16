"use strict";
define(function (require) {

    var MySketch = require("inequality").MySketch;
    var tester = require("lib/equation_editor/test_cases.js");
    return ["$timeout", "$rootScope", "api", "$stateParams", function ($timeout, $rootScope, api, $stateParams) {

        return {
            scope: true,
            restrict: "A",
            templateUrl: "/partials/equation_editor/equation_editor.html",
            link: function (scope, element, attrs) {


                /*** Lifecycle and buttons ***/


                // The DOM element that holds the menus and the canvas.
                scope.equationEditorElement = element;

                // Prevent default event handling on the canvas.
                element.on("touchstart touchmove touchended", "canvas", function (e) {
                    e.preventDefault();
                });

                // This holds the p5 sketch, the actual equation editor.
                var sketch = null;

                // Are we dragging a new symbol from the menu?
                scope.draggingNewSymbol = false;

                // The moving symbol(s) when symbol(s) are moving.
                // In practice, only one (top-level) symbol can be moving at any given time, because no multi-touch.
                scope.selectedSymbols = [];

                // TODO Figure out this one. I'm not sure this is necessary, really...
                scope.selectionHandleFlags = {
                    showCalc: false,
                    showResize: true,
                    showMove: false
                };

                scope.historyPtr = -1;
                scope.history = [];

                // Adds a checkpoint to the history, so we can undo and redo.
                scope.$on("historyCheckpoint", function () {
                    var newEntry = JSON.stringify(scope.state);
                    var currentEntry = JSON.stringify(scope.history[scope.historyPtr]);

                    if (newEntry !== currentEntry) {
                        scope.historyPtr++;
                        scope.history.splice(scope.historyPtr, scope.history.length - scope.historyPtr, JSON.parse(newEntry));

                        console.log("historyCheckpoint:", scope.history);
                    }
                });

                scope.undo = function () {
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

                scope.redo = function () {
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

                // ? This seems to be unnecessary now.
                scope.trash = function () {
                    scope.$emit("historyCheckpoint");
                };

                // Closes the editor and returns to the question screen with a potential answer.
                scope.submit = function () {
                    $("#equationModal").foundation("reveal", "close");
                };

                // Centres all the objects in the canvas.
                scope.centre = function () {
                    sketch.centre();
                };

                scope.newEditorState = function (s) {
                    scope.state = s;

                    console.log("New state:", s);

                    var rp = $(".result-preview>span");

                    rp.empty();

                    // this renders the result in the preview box in the bottom right corner of the eqn editor
                    if (scope.state.result) {
                        scope.state.result["uniqueSymbols"] = replaceSpecialChars(scope.state.result["uniqueSymbols"]).replace(/\\/g, "");
                        // Sort them into a unique order:
                        scope.state.result["uniqueSymbols"] = scope.state.result["uniqueSymbols"].split(", ").sort(uniqueSymbolsSortFn).join(", ");
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
                };

                // Handles key commands.
                // Some of these may be removed (like the trash one). Some are still useful, like the test cases.
                element.on("keydown", function (e) {
                    var test_cases_lib = ($stateParams.mode === 'chemistry') ? tester.testCasesChemistry : tester.testCasesMaths;
                    if ($stateParams.testing) {
                        console.log("KeyDown", e.which || e.keyCode);
                        switch (e.which || e.keyCode) {
                            case 8: // Backspace. Deliberately fall through.
                            case 46: // Delete
                                e.stopPropagation();
                                e.preventDefault();
                                scope.trash();
                                scope.$apply();
                                break;
                            default:
                                var key = String.fromCharCode(e.which || e.keyCode);
                                if (test_cases_lib.hasOwnProperty(key)) {
                                    $rootScope.sketch.loadTestCase(test_cases_lib[key].testCase);
                                    scope.log.actions.push({
                                        event: "LOAD_TEST_CASE",
                                        testCase: key,
                                        timestamp: Date.now()
                                    });
                                    console.debug("Loading test case " + key + " | " + test_cases_lib[key].description);
                                } else {
                                    console.debug("Test case " + key + " does not exist.");
                                }
                                break;
                        }
                    } else {
                        switch (e.which || e.keyCode) {
                            case 8: // Backspace. Deliberately fall through.
                            case 46: // Delete
                                e.stopPropagation();
                                e.preventDefault();
                                scope.trash();
                                scope.$apply();
                                break;
                        }
                    }
                });

                // Perfomr some action when the menu is opened.
                // ? Maybe not needed?
                scope.$on("menuOpened", function () {

                });

                // Sends a message to close the menu.
                scope.$on("triggerCloseMenus", function () {
                    scope.$broadcast("closeMenus");
                });

                // Sends a message to resize the menu (number of rows).
                scope.$on("triggerResizeMenu", function () {
                    scope.$broadcast("resizeMenu");
                });

                // Adjusts the editor on window resizes.
                $(window).on("resize", function () {
                    element.find(".top-menu").css({
                        "bottom": scope.equationEditorElement.height()
                    }).removeClass("active-menu");
                });

                // A symbol starts being dragged from the menu.
                scope.$on("newSymbolDrag", function (_, symbol, pageX, pageY, mousePageX, mousePageY) {
                    sketch.p.frameRate(60);
                    scope.draggingNewSymbol = true;
                    scope.mousePageX = pageX;
                    scope.mousePageY = pageY;
                    var tOff = element.find(".trash-button").position();
                    var tHeight = element.find(".trash-button").height();

                    if (null != sketch.potentialSymbol) {
                        var sym = sketch.potentialSymbol;
                        var box = sym.subtreeBoundingBox();
                        var pos = sym.getAbsolutePosition();
                        var bLeft = box.x + pos.x;
                        var bRight = bLeft + box.w;
                        var bTop = box.y + pos.y;
                        var bBottom = bTop + box.h;
                        // No need to check if we go past the right side of the button, as the button is stuck to
                        // the right side of the screen anyway (and doing it right gave me headaches, so...)
                        scope.trashActive =
                            (bRight > tOff.left &&
                            bBottom > tOff.top &&
                            bBottom < tOff.top + tHeight) ||
                            (mousePageX > tOff.left && // This second part is good to have when dragging hexagons
                            mousePageY > tOff.top &&
                            mousePageY < tOff.top + tHeight);
                    }
                    sketch.updatePotentialSymbol(symbol, pageX, pageY);
                    scope.$digest();
                });

                // TODO This does not seem to make any difference, whether it's being called or not.
                scope.notifySymbolDrag = function (x, y) {
                    var tOff = element.find(".trash-button").position();
                    var tHeight = element.find(".trash-button").height();

                    if (null != sketch.movingSymbol) {
                        var sym = sketch.movingSymbol;
                        var box = sym.subtreeBoundingBox();
                        var pos = sym.getAbsolutePosition();
                        var bLeft = box.x + pos.x;
                        var bRight = bLeft + box.w;
                        var bTop = box.y + pos.y;
                        var bBottom = bTop + box.h;
                        // See above for right-side-stuff.
                        scope.trashActive =
                            (bRight > tOff.left &&
                            bBottom > tOff.top &&
                            bBottom < tOff.top + tHeight) ||
                            (x > tOff.left && // This second part is safe to have anyway
                            y > tOff.top &&
                            y < tOff.top + tHeight);
                    }

                    scope.$apply();
                };

                // A symbol is dragged from the menu and dropped on the menu. The symbol is not committed to the canvas.
                scope.$on("newSymbolAbortDrag", function () {
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
                    sketch.p.frameRate(7);
                });

                // A symbol is dragged from the menu and dropped on the canvas. The symbol is committed to the canvas.
                scope.$on("spawnSymbol", function (_e) {
                    scope.draggingNewSymbol = false;

                    if (scope.trashActive) {
                        scope.log.actions.push({
                            event: "TRASH_POTENTIAL_SYMBOL",
                            symbol: sketch.potentialSymbol.subtreeObject(false, true, true),
                            timestamp: Date.now()
                        });
                        sketch.updatePotentialSymbol(null);
                        sketch.p.frameRate(7);
                        return;
                    }

                    sketch.commitPotentialSymbol();

                    scope.$broadcast("historyCheckpoint");
                });

                // Logs when people navigate away without closing the editor.
                scope.logOnClose = function (event) {
                    if (scope.log != null) {
                        scope.log.actions.push({
                            event: "NAVIGATE_AWAY",
                            timestamp: Date.now()
                        });
                        api.logger.log(scope.log);
                    }
                };

                // Parses available symbols and generates the menu bar. Then opens the editor.
                // FIXME This function may or may not need refactoring to improve the flexibility of menu creation.
                $rootScope.showEquationEditor = function (initialState, questionDoc, editorMode) {

                    return new Promise(function (resolve, reject) {

                        delete scope.symbolLibrary.customVars;
                        delete scope.symbolLibrary.customFunctions;
                        delete scope.symbolLibrary.customChemicalSymbols;
                        delete scope.symbolLibrary.augmentedOps;

                        scope.symbolLibrary.augmentedOps = scope.symbolLibrary.reducedOps.concat(scope.symbolLibrary.hiddenOps);
                        scope.symbolLibrary.augmentedTrig = scope.symbolLibrary.trigFunctionsStandard;

                        var userIsPrivileged = document.location.pathname === '/equality' || _.includes(['ADMIN', 'CONTENT_EDITOR', 'EVENT_MANAGER'], scope.user.role);

                        if (editorMode === "maths" && questionDoc && questionDoc.availableSymbols) {
                            scope.symbolLibrary.augmentedOps = scope.symbolLibrary.reducedOps;
                            scope.symbolLibrary.augmentedTrig = scope.symbolLibrary.reducedTrigFunctions;
                            var parsedSymbols = parseCustomSymbols(questionDoc.availableSymbols);

                            var customSymbolsParsed = false;
                            if (parsedSymbols.vars.length > 0) {
                                scope.symbolLibrary.customVars = parsedSymbols.vars;
                                customSymbolsParsed = true;
                            }
                            if (parsedSymbols.fns.length > 0) {
                                scope.symbolLibrary.customFunctions = parsedSymbols.fns;
                                customSymbolsParsed = true;
                            }
                            if (parsedSymbols.operators.length > 0) {
                                scope.symbolLibrary.augmentedOps = scope.symbolLibrary.reducedOps.concat(parsedSymbols.operators);
                                customSymbolsParsed = true;
                            }
                            if (parsedSymbols.derivatives.length > 0) {
                                var theseDerivatives = null;
                                if (customSymbolsParsed) {
                                    theseDerivatives = userIsPrivileged ? parsedSymbols.derivatives.slice(2) : parsedSymbols.derivatives;
                                    if (scope.symbolLibrary.customFunctions) {
                                        scope.symbolLibrary.customFunctions = scope.symbolLibrary.customFunctions.concat(theseDerivatives);
                                    } else {
                                        scope.symbolLibrary.customFunctions = theseDerivatives;
                                    }
                                }
                                scope.symbolLibrary.derivatives = theseDerivatives;
                                customSymbolsParsed = true;
                            }
                            if (!customSymbolsParsed) {
                                console.debug("No custom symbols.");
                            }
                        } else if (editorMode === "chemistry" && questionDoc && questionDoc.availableSymbols) {
                            var parsed = parseCustomChemicalSymbols(questionDoc.availableSymbols);
                            if (parsed.length > 0) {
                                scope.symbolLibrary.customChemicalSymbols = parsed;
                            } else {
                                console.debug("No custom symbols.");
                            }
                        }

                        $(".result-preview>span").empty();
                        $(".result-preview").width(0);

                        var eqnModal = $('#equationModal');
                        eqnModal.one("opened.fndtn.reveal", function () {
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
                            mode: scope.editorMode,
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
                        eqnModal.one("close", function (e) {
                            scope.log.finalState = [];
                            sketch.symbols.forEach(function (e) {
                                scope.log.finalState.push(e.subtreeObject(true, true));
                            });
                            scope.log.actions.push({
                                event: "CLOSE",
                                timestamp: Date.now()
                            });
                            if (scope.segueEnvironment === "DEV") {
                                console.log("\nLOG: ~" + (JSON.stringify(scope.log).length / 1000).toFixed(2) + "kb\n\n", JSON.stringify(scope.log));
                            }
                            window.removeEventListener("beforeunload", scope.logOnClose);
                            api.logger.log(scope.log);
                            scope.log = null;
                        });

                        scope.history = [JSON.parse(JSON.stringify(scope.state))];
                        scope.historyPtr = 0;
                        //element.find("canvas").remove();

                        scope.future = [];
                        var p = new p5(function (p) {
                            sketch = new MySketch(p, scope, element.width(), element.height(), scope.state.symbols);
                            $rootScope.sketch = sketch;
                            return sketch;
                        }, element.find(".equation-editor")[0]);

                        eqnModal.one("closed.fndtn.reveal", function () {
                            sketch.p.remove();
                            resolve(scope.state);
                        });

                    });
                };


                /*** Symbol parsing and menu building ***/
                /***  --==[ Madness lies ahead ]==--  ***/

                var latinLetters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
                var latinLettersUpper = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
                var greekLetters = ["\\alpha", "\\beta", "\\gamma", "\\delta", "\\varepsilon", "\\zeta", "\\eta", "\\theta", "\\iota", "\\kappa", "\\lambda", "\\mu", "\\nu", "\\xi", "\\omicron", "\\pi", "\\rho", "\\sigma", "\\tau", "\\upsilon", "\\phi", "\\chi", "\\psi", "\\omega"];
                var greekLettersUpper = ["\\Gamma", "\\Delta", "\\Theta", "\\Lambda", "\\Xi", "\\Pi", "\\Sigma", "\\Upsilon", "\\Phi", "\\Psi", "\\Omega"];
                // Make a single dict for lookup to impose an order.
                var uniqueSymbolsTotalOrder = {};
                var uniqueSymbols = latinLetters.concat(latinLettersUpper, greekLetters, greekLettersUpper);
                for (var i in uniqueSymbols) {
                    uniqueSymbolsTotalOrder[uniqueSymbols[i]] = i;
                }

                var elements = ["H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne", "Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar", "K", "Ca", "Sc", "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn", "Ga", "Ge", "As", "Se", "Br", "Kr", "Rb", "Sr", "Y", "Zr", "Nb", "Mo", "Tc", "Ru", "Rh", "Pd", "Ag", "Cd", "In", "Sn", "Sb", "Te", "I", "Xe", "Cs", "Ba", "La", "Ce", "Pr", "Nd", "Pm", "Sm", "Eu", "Gd", "Tb", "Dy", "Ho", "Er", "Tm", "Yb", "Lu", "Hf", "Ta", "W", "Re", "Os", "Ir", "Pt", "Au", "Hg", "Tl", "Pb", "Bi", "Po", "At", "Rn", "Fr", "Ra", "Ac", "Th", "Pa", "U", "Np", "Pu", "Am", "Cm", "Bk", "Cf", "Es", "Fm", "Md", "No", "Lr", "Rf", "Db", "Sg", "Bh", "Hs", "Mt", "Ds", "Rg", "Cn", "Nh", "Fl", "Mc", "Lv", "Ts", "Og"];

                var opsMap = {"<": "<", ">": ">", "<=": "\\leq", ">=": "\\geq"};
                // Make a single dict for lookup to impose an order.
                var uniqueOperatorsTotalOrder = {};
                var count = 0;
                for (var operator in opsMap) {
                    uniqueOperatorsTotalOrder[operator] = count++;
                }

                var trigFunctions = ["sin", "cos", "tan", "arcsin", "arccos", "arctan", "sinh", "cosh", "tanh", "cosec", "sec", "cot", "arccosec", "arcsec", "arccot", "cosech", "sech", "coth", "arccosech", "arcsech", "arccoth", "arcsinh", "arccosh", "arctanh"];
                var trigFunctionsStandard = ["sin", "cos", "tan", "arcsin", "arccos", "arctan", "cosec", "sec", "cot", "arccosec", "arcsec", "arccot"];
                var trigFunctionsHyp = ["sinh", "cosh", "tanh", "cosech", "sech", "coth", "arccosech", "arcsech", "arccoth", "arcsinh", "arccosh", "arctanh"];
                var trigReduced = ["sin", "cos", "tan"];
                var trigMap = {};
                for (var i in trigFunctions) {
                    trigMap[trigFunctions[i]] = i;
                }

                var particles = ["alpha", "beta", "gamma", "neutrino", "antineutrino", "proton", "neutron", "electron"];

                var letterMap = {"\\alpha": "α", "\\beta": "β", "\\gamma": "γ", "\\delta": "δ", "\\epsilon": "ε", "\\varepsilon": "ε", "\\zeta": "ζ", "\\eta": "η", "\\theta": "θ", "\\iota": "ι", "\\kappa": "κ", "\\lambda": "λ", "\\mu": "μ", "\\nu": "ν", "\\xi": "ξ", "\\omicron": "ο", "\\pi": "π", "\\rho": "ρ", "\\sigma": "σ", "\\tau": "τ", "\\upsilon": "υ", "\\phi": "ϕ", "\\chi": "χ", "\\psi": "ψ", "\\omega": "ω", "\\Gamma": "Γ", "\\Delta": "Δ", "\\Theta": "Θ", "\\Lambda": "Λ", "\\Xi": "Ξ", "\\Pi": "Π", "\\Sigma": "Σ", "\\Upsilon": "Υ", "\\Phi": "Φ", "\\Psi": "Ψ", "\\Omega": "Ω"};
                var inverseLetterMap = {};
                for (var k in letterMap) {
                    inverseLetterMap[letterMap[k]] = k;
                }
                inverseLetterMap["ε"] = "\\varepsilon"; // Make sure that this one wins.

                var chemicalSymbols = {};
                var chemicalSymbolsArray = elements.concat(particles);
                for (var i in chemicalSymbolsArray) {
                    chemicalSymbols[chemicalSymbolsArray[i]] = i;
                }

                var derivativesStandard = [];

                var convertToLatexIfGreek = function (s) {
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

                // Parses an array of chemical symbols as strings, like
                // ["H", "He", "Li", "electron", "proton", "antineutrino"]
                var parseCustomChemicalSymbols = function (symbols) {
                    var parsedChemicalSymbols = [];
                    for (var i in symbols) {
                        var s = symbols[i].trim();
                        if (s.length === 0) {
                            console.warn("Tried to parse zero-length symbol in list:", symbols);
                            continue;
                        }
                        console.debug("Parsing:", s);
                        if (chemicalSymbols.hasOwnProperty(s)) {
                            var type = (chemicalSymbols[s] <= (elements.length - 1)) ? 'ChemicalElement' : 'Particle';
                            if (type === 'Particle') {
                                var index_of_particle = chemicalSymbols[s] - elements.length;
                                var particle_label = scope.symbolLibrary.particles[index_of_particle].menu.label;
                                parsedChemicalSymbols.push({
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
                                parsedChemicalSymbols.push({
                                    type: type,
                                    properties: {
                                        element: s
                                    },
                                    menu: {
                                        label: "\\text{" + s + "}",
                                        texLabel: true
                                        // add here option for it to be part of nuclear equation
                                    }
                                });
                            }
                        }

                    }
                    return parsedChemicalSymbols;
                };

                // Parses a single letter.
                var parseCustomSymbol_Letter = function (p) {
                    var parts = p.split("_");
                    var letter = convertToLatexIfGreek(parts[0]);
                    var parsedSymbol = {
                        type: "Symbol",
                        properties: {
                            letter: letterMap[letter] || letter
                        },
                        menu: {
                            label: letter,
                            texLabel: true
                        }
                    };
                    var modifiers = ["prime"];
                    if (parts.length > 1) {
                        if (_.indexOf(modifiers, parts[1]) > -1) {
                            parsedSymbol.properties.modifier = parts[1];
                            parsedSymbol.menu.label = letter + "'";
                        }
                        if (_.indexOf(modifiers, parts[parts.length-1]) === -1) {
                            var subscriptLetter = parts[parts.length-1];
                            var subscriptSymbol;
                            if (isNaN(subscriptLetter)) {
                                subscriptSymbol = {
                                    type: "Symbol",
                                    properties: {
                                        letter: letterMap[subscriptLetter] || subscriptLetter,
                                        upright: subscriptLetter.length > 1
                                    }
                                };
                            } else {
                                subscriptSymbol = {
                                    type: "Num",
                                    properties: {
                                        significand: subscriptLetter
                                    }
                                };
                            }
                            parsedSymbol.children = {
                                subscript: subscriptSymbol,
                            };
                            parsedSymbol.menu.label += "_{" + subscriptLetter + "}";
                        }
                    }
                    return parsedSymbol;
                };

                // Parses a single differential as split by the differential regex (see caller).
                var parseCustomSymbol_Differential = function (parsedDiff) {
                    var diffType = parsedDiff[1];
                    var diffOrder = parsedDiff[2] || 0;
                    var diffArgument = parsedDiff[3] || null;
                    var diffLetter = {"delta":"δ","Delta":"∆","d":"d"}[diffType] || "?";
                    var diffLatex = "\\mathrm{" + ( {"delta":"\\delta","Delta":"\\Delta","d":"d"}[diffType] || "?" ) + "}";

                    var diffSymbol = {
                        type: "Differential",
                        properties: {
                            letter: diffLetter
                        },
                        children: {},
                        menu: {
                            label: diffLatex,
                            texLabel: true
                        }
                    };

                    if (diffOrder > 1) {
                        diffSymbol.children["order"] = {
                            type: "Num",
                            properties: {
                                significand: "" + diffOrder,
                            }
                        };
                        diffSymbol.menu.label = diffSymbol.menu.label + "^{" + diffOrder + "}";
                    }

                    if (null != diffArgument) {
                        diffSymbol.children["argument"] = parseCustomSymbol_Letter(diffArgument);
                        diffSymbol.menu.label = diffSymbol.menu.label + diffSymbol.children["argument"].menu.label;
                    }

                    return [diffSymbol];
                };

                // FIXME This function definitely needs refactoring to improve the flexibility of menu creation.
                var parseCustomSymbols = function (symbols) {
                    var r = {
                        vars: [],
                        fns: [],
                        operators: [],
                        derivatives: []
                    };

                    var theseSymbols = symbols.slice(0);
                    var i = 0;
                    while (i < theseSymbols.length) {
                        if (theseSymbols[i] === 'trigs') {
                            theseSymbols.splice(i, 1, 'cos()', 'sin()', 'tan()');
                        } else if (theseSymbols[i] === '1/trigs') {
                            theseSymbols.splice(i, 1, 'cosec()', 'sec()', 'cot()');
                        } else if (theseSymbols[i] === 'inv_trigs') {
                            theseSymbols.splice(i, 1, 'arccos()', 'arcsin()', 'arctan()');
                        } else if (theseSymbols[i] === 'inv_1/trigs') {
                            theseSymbols.splice(i, 1, 'arccosec()', 'arcsec()', 'arccot()');
                        } else if (theseSymbols[i] === 'hyp_trigs') {
                            theseSymbols.splice(i, 1, 'cosh()', 'sinh()', 'tanh()', 'cosech()', 'sech()', 'coth()');
                        } else if (theseSymbols[i] === 'inv_hyp_trigs') {
                            theseSymbols.splice(i, 1, 'arccosh()', 'arcsinh()', 'arctanh()', 'arccosech()', 'arcsech()', 'arccoth()');
                        } else if (theseSymbols[i] === 'logs') {
                            theseSymbols.splice(i, 1, 'log()', 'ln()');
                        }
                        i += 1;
                    }
                    theseSymbols = _.uniq(theseSymbols);

                    while (theseSymbols.length > 0) {
                        var s = theseSymbols.shift().trim();

                        var partResults = [];

                        var diffRegex = /^(Delta|delta|d)\s*(?:\^([0-9]+))?\s*([a-zA-Z]+(?:(?:_|\^).+)?)?/;

                        if (s.length === 0) {
                            console.warn("Tried to parse zero-length symbol in list:", theseSymbols);
                            continue;
                        } else if (opsMap.hasOwnProperty(s)) {
                            console.debug("Parsing operator:", s);
                            partResults.push({
                                type: 'Relation',
                                menu: {
                                    label: opsMap[s],
                                    texLabel: true
                                },
                                properties: {
                                    relation: s
                                }
                            });
                        } else if (_.startsWith(s, "Derivative(")) {
                            console.debug("Parsing derivative:", s);
                            r.derivatives = derivativeFunctions([s]);
                        } else if (diffRegex.test(s)) {
                            var parsedDiff = diffRegex.exec(s);
                            var diffType = parsedDiff[1];
                            var diffOrder = parsedDiff[2] || 0;
                            var diffArgument = parsedDiff[3] || null;

                            if (diffType === "d" && diffOrder === 0 && diffArgument == null) {
                                // We parse this as a letter d, plus optional subscript, ignoring order.
                                partResults.push(parseCustomSymbol_Letter(s));
                            } else {
                                console.log("Parsing differential (Delta|delta|d):");
                                partResults = parseCustomSymbol_Differential(parsedDiff);
                            }
                        } else {
                            console.debug("Parsing symbol:", s);
                            // Allow compound (multiplied) symbols separated by a space.
                            // ? Is this being used?
                            var parts = s.split(" ");
                            for (var j in parts) {
                                var p = parts[j];
                                var name = p.replace(/\(\)/g, "");
                                var index = trigMap[name + ""];
                                // If we have a function
                                // (Using lodash because IE 11 does not support endsWith)
                                if (_.endsWith(p, "()")) {
                                    var innerSuperscript = ["sin", "cos", "tan", "arcsin", "arccos", "arctan", "sinh", "cosh", "tanh", "cosec", "sec", "cot", "arccosec", "arcsec", "arccot", "cosech", "sech", "coth", "arccosech", "arcsech", "arccoth", "arcsinh", "arccosh", "arctanh"].indexOf(name) > -1;
                                    var allowSubscript = name === "log";
                                    // which is an inverse trig function
                                    if (name.substring(0, 3) === "arc") {
                                        // finds the index of the function in the symbol library to retrieve the label.
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
                                                        significand: "-1",
                                                    }
                                                }
                                            },
                                            menu: {
                                                label: scope.symbolLibrary.trigFunctions[index].menu.label,
                                                texLabel: true,
                                                fontSize: '15px'
                                            }
                                        });
                                    } else if (name === 'log' || name === 'ln') {
                                        // or if we have log or natural log
                                        partResults.push({
                                            type: "Fn",
                                            properties: {
                                                name: name,
                                                innerSuperscript: innerSuperscript,
                                                allowSubscript: allowSubscript
                                            },
                                            menu: {
                                                label: '\\text{' + name + '}',
                                                texLabel: true,
                                                fontSize: '18px'
                                            }
                                        });
                                    } else if (trigFunctions.indexOf(name) !== -1) {
                                        // otherwise we must have a standard trig function
                                        partResults.push({
                                            type: "Fn",
                                            properties: {
                                                name: name,
                                                innerSuperscript: innerSuperscript,
                                                allowSubscript: allowSubscript
                                            },
                                            menu: {
                                                label: scope.symbolLibrary.trigFunctions[index].menu.label,
                                                texLabel: true,
                                                fontSize: '18px'
                                            }
                                        });
                                    }
                                    else {
                                        console.debug("Did not parse custom function: " + name);

                                    }
                                } else {
                                    // otherwise we must have a letter symbol
                                    var newSymbol = parseCustomSymbol_Letter(p);
                                    partResults.push(newSymbol);
                                }
                            }
                        }
                        // if input is malicious partResults[0] may not exist!
                        if (partResults[0]) {
                            var root = partResults[0];
                            for (var k = 0; k < partResults.length - 1; k++) {
                                partResults[k].children = {
                                    right: partResults[k + 1]
                                };
                                root.menu.label += " " + partResults[k + 1].menu.label;
                            }
                            switch (partResults[0].type) {
                                case "Symbol":
                                case "Differential":
                                    r.vars.push(root);
                                    break;
                                case "Fn":
                                    r.fns.push(root);
                                    break;
                                case "Relation":
                                    r.operators.push(root);
                                    break;
                            }
                        }
                    }

                    return r;
                };

                var replaceSpecialChars = function (s) {
                    for (var k in inverseLetterMap) {
                        // Special characters have special needs (i.e., a space after them).
                        // If the special character is followed by a non-special character, add a space:
                        s = s.replace(new RegExp(k + "(?=[A-Za-z0-9])", "g"), inverseLetterMap[k] + ' ');
                        // Otherwise just replace it.
                        s = s.replace(new RegExp(k, "g"), inverseLetterMap[k]);
                    }
                    return s;
                };

                var uniqueSymbolsSortFn = function (a, b) {
                    // Sort operators:
                    if (a in uniqueOperatorsTotalOrder || b in uniqueOperatorsTotalOrder) {
                        // both a and b are operators
                        if (a in uniqueOperatorsTotalOrder && b in uniqueOperatorsTotalOrder) {
                            return uniqueOperatorsTotalOrder[a] - uniqueOperatorsTotalOrder[b];
                        }
                        // only a is an operator, so place it after b
                        if (a in uniqueOperatorsTotalOrder) {
                            return 1;
                            // only b is an operator, so place it after a
                        } else {
                            return -1;
                        }
                    }
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
                };

                var stringSymbols = function (ss) {
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
                                texLabel: true
                            }
                        });
                    }

                    return symbols;
                };

                var chemicalElements = function (elementArray) {
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

                var theNumbers = function (numberStrings) {
                    var elements = {};
                    for (var i = 0; i < 10; i++) {
                        var numString = i.toString();

                        elements[numberStrings[i]] = {
                            type: "Num",
                            properties: {
                                significand: numString
                            },
                            menu: {
                                label: numString,
                                texLabel: false
                            }
                        }
                    }
                    return elements;
                };

                var trigFunction = function (trigArray) {
                    var count = 0;
                    var result = [];
                    for (var trig_func in trigArray) {
                        var label = "";
                        var properties = {};
                        var children = null;
                        var name = trigArray[trig_func];
                        if (trigArray[trig_func].substring(0, 3) == 'arc') {
                            name = trigArray[trig_func].substring(3);
                            children = {
                                superscript: {
                                    type: "Num",
                                    properties: {
                                        significand: "-1",
                                    }
                                }
                            };
                            // if inverse function and involves cosec (not supported by latex)
                            if (trigArray[trig_func].substring(3, 7) == 'sech') {
                                label = "\\text{" + trigArray[trig_func].substring(3) + "}";
                            } else if (trigArray[trig_func].substring(3, 8) == 'cosec') {
                                label = "\\text{" + trigArray[trig_func].substring(3) + "}";
                            } else {
                                label = "\\" + trigArray[trig_func].substring(3);
                            }
                            label += "^{-1}";
                        } else {
                            // if function isn't inverse but still involves cosec
                            if (trigArray[trig_func].substring(0, 4) == 'sech') {
                                label = "\\text{" + trigArray[trig_func] + "}";
                            } else if (trigArray[trig_func].substring(0, 5) == 'cosec') {
                                label = "\\text{" + trigArray[trig_func] + "}";
                            } else {
                                label = "\\" + trigArray[trig_func];
                            }
                        }
                        result[count] = {
                            type: "Fn",
                            properties: {
                                name: name,
                                innerSuperscript: true,
                                allowSubscript: true,
                            },
                            menu: {
                                label: label,
                                texLabel: true,
                                fontSize: (name.length > 4 && trigArray[trig_func].substring(0, 3) == 'arc') ? '15px' : '18px'
                            }
                        };
                        if (children != null) {
                            result[count].children = children;
                        }
                        count++;
                    }
                    return result;
                };

                var derivativeFunctions = function(availableDerivatives) {
                    // TODO Possibly remove the menu if no derivatives are available
                    var result = [];
                    var userIsPrivileged = document.location.pathname == '/equality' || _.includes(['ADMIN', 'CONTENT_EDITOR', 'EVENT_MANAGER'], scope.user.role);

                    if (userIsPrivileged) {
                        result.push({
                            type: "Differential",
                            properties: {
                                letter: "d"
                            },
                            menu: {
                                label: "\\mathrm{d}^{\\circ}\\circ",
                                texLabel: true
                            }
                        });
                        result.push({
                            type: "Differential",
                            properties: {
                                letter: "∆"
                            },
                            menu: {
                                label: "\\mathrm{\\Delta}^{\\circ}\\circ",
                                texLabel: true
                            }
                        });
                        result.push({
                            type: "Differential",
                            properties: {
                                letter: "δ"
                            },
                            menu: {
                                label: "\\mathrm{\\delta}^{\\circ}\\circ",
                                texLabel: true
                            }
                        });
                        result.push({
                            type: "Derivative",
                            children: {
                                numerator: {
                                    type: "Differential",
                                    properties: {
                                        letter: "d"
                                    }
                                },
                                denominator: {
                                    type: "Differential",
                                    properties: {
                                        letter: "d"
                                    }
                                }
                            },
                            menu: {
                                label: "\\frac{\\mathrm{d}\\ \\cdot}{\\mathrm{d}\\ \\cdots}",
                                texLabel: true,
                                fontSize: "1.5em"
                            }
                        });
                    }

                    for (var j = 0; j < availableDerivatives.length; ++j) {
                        var derivative = availableDerivatives[j];
                        if (derivative.startsWith("Derivative")) {
                            // FIXME This ; is a backward-compatible, certified horrible hack
                            var pieces = derivative.split(";").map(function(s) { return s.replace(/[\(\)\s]/g, "") }).slice(1);
                            var orders = {};
                            // Count how many times one should derive each variable
                            for (var i = 0; i < pieces.length; ++i) {
                                var piece = pieces[i];
                                if (orders.hasOwnProperty(piece)) {
                                    orders[piece] += 1;
                                } else {
                                    orders[piece] = 1;
                                }
                            }
                            var derivative_order = _.sum(_.values(orders));
                            // Build up the object
                            // TODO Support letters other than d. This may be hard with the current syntax!
                            var derivative_obj = {
                                type: "Derivative",
                                children: {
                                    numerator: {
                                        type: "Differential",
                                        properties: { letter: "d" },
                                        children: { }
                                    },
                                    denominator: { }
                                },
                                menu: null
                            };
                            if (derivative_order > 1) {
                                derivative_obj.children.numerator.children.order = { type: "Num", properties: { significand: ""+derivative_order } };
                            }
                            var den_objects = [];
                            var texBottom = "";
                            _.each(_.entries(orders), function(p) {
                                var letter = p[0];
                                var order = p[1];
                                var o = {
                                    type: "Differential",
                                    properties: { letter: "d" }, // TODO Support other types of differentials
                                    children: {
                                        argument: {
                                            type: "Symbol",
                                            properties: { letter: letter }
                                        }
                                    }
                                };
                                texBottom += "d" + letter;
                                if (order > 1) {
                                    o.children.order = {
                                        type: "Num",
                                        properties: { significand: ""+order }
                                    };
                                    texBottom += "^{" + order + "}";
                                }
                                den_objects.push(o);
                            });

                            var tail = den_objects.pop();
                            while (den_objects.length > 0) {
                                var acc = den_objects.pop();
                                acc.children.right = tail;
                                tail = acc;
                            }

                            derivative_obj.children.denominator = tail;
                            var texLabel = "\\frac{\\mathrm{d}" + (derivative_order > 1 ? "^{" + derivative_order+"}" : "") + "}{" + texBottom + "}";
                            derivative_obj.menu = { label: texLabel, texLabel: true, fontSize: "1.5em" };
                            result.push(derivative_obj);
                        } else {
                            // DUH?
                        }
                    }
                    return result;
                };

                scope.symbolLibrary = {

                    latinLetters: stringSymbols(latinLetters),

                    latinLettersUpper: stringSymbols(latinLettersUpper),

                    greekLetters: stringSymbols(greekLetters),

                    greekLettersUpper: stringSymbols(greekLettersUpper),

                    chemicalElements: chemicalElements(elements),

                    theNumbers: theNumbers(['zero','one','two','three','four','five','six','seven','eight','nine']),

                    trigFunctions: trigFunction(trigFunctions),

                    reducedTrigFunctions: trigFunction(trigReduced),

                    hypTrigFunctions: trigFunction(trigFunctionsHyp),

                    trigFunctionsStandard: trigFunction(trigFunctionsStandard),

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
                    }
                    ],

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
                    }
                    ],

                    hiddenOps: [{
                        type: 'Relation',
                        menu: {
                            label: '\\leq',
                            texLabel: true,
                        },
                        properties: {
                            relation: '<='
                        }
                    }, {
                        type: 'Relation',
                        menu: {
                            label: '\\geq',
                            texLabel: true,
                        },
                        properties: {
                            relation: '>='
                        }
                    }, {
                        type: 'Relation',
                        menu: {
                            label: '<',
                            texLabel: true,
                        },
                        properties: {
                            relation: '<'
                        }
                    }, {
                        type: 'Relation',
                        menu: {
                            label: '>',
                            texLabel: true,
                        },
                        properties: {
                            relation: '>'
                        }
                    }
                    ],

                    chemOps: [{
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
                    }, {
                        type: "Fraction",
                        menu: {
                            label: "\\frac{a}{b}",
                            texLabel: true
                        }
                    }, {
                        type: 'Relation',
                        menu: {
                            label: '\\rightarrow',
                            texLabel: true,
                        },
                        properties: {
                            relation: 'rightarrow'
                        }
                    }, {
                        type: "Relation",
                        menu: {
                            label: '\\rightleftharpoons ',
                            texLabel: true,
                        },
                        properties: {
                            relation: 'equilibrium'
                        }
                    }, {
                        type: "Brackets",
                        properties: {
                            type: "round",
                            mode: "chemistry"
                        },
                        menu: {
                            label: "(x)",
                            texLabel: true
                        }
                    }, {
                        type: "Brackets",
                        properties: {
                            type: "square",
                            mode: "chemistry"
                        },
                        menu: {
                            label: "[x]",
                            texLabel: true
                        }
                    }, {
                        type: 'Relation',
                        menu: {
                            label: '\\cdot',
                            texLabel: true,
                        },
                        properties: {
                            relation: '.'
                        }
                    }
                    ],

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
                        type: "BinaryOperation",
                        properties: {
                            operation: "±",
                        },
                        menu: {
                            label: "\\pm",
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
                    }
                    ],

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
                    }
                    ],

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
                    }
                    ],

                    derivatives: derivativeFunctions(derivativesStandard)
                    /* δ ∆ <- let's keep these handy, just in case... */
                };

                scope.particlesTitle = {
                    type: "string",
                    menu: {
                        label: "\\alpha",
                        texLabel: true
                    }
                };

                scope.elementsTitle = {
                    menu: {
                        label: "He",
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

                scope.trigTitle = {
                    type: "string",
                    menu: {
                        label: "\\sin",
                        texLabel: true
                    }
                };

                scope.hypTrigTitle = {
                    type: "string",
                    menu: {
                        label: "\\text{hyp}",
                        texLabel: true,
                        fontSize: '30px',
                    }
                };

                scope.otherFnTitle = {
                    type: "string",
                    menu: {
                        label: "\\log",
                        texLabel: true,
                        fontSize: '33px'
                    }
                };

                scope.derivativesTitle = {
                    type: "string",
                    menu: {
                        label: "\\frac{\\mathrm{d}y}{\\mathrm{d}x}",
                        texLabel: true,
                        fontSize: '33px'
                    }
                };

            }
        };
    }];
});
