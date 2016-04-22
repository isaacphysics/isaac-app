"use strict";
define(function(require) {

    var MySketch = require("inequality").MySketch;

	return ["$timeout", "$rootScope", "api", function($timeout, $rootScope, api) {

		return {
			scope: true,
			restrict: "A",
			templateUrl: "/partials/equation_editor/equation_editor.html",
			link: function(scope, element, attrs) {

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

                    var tOff = element.find(".trash-button").offset();
                    var tWidth = element.find(".trash-button").width();
                    var tHeight = element.find(".trash-button").height();
                    scope.trashActive = (mousePageX > tOff.left && mousePageX < tOff.left + tWidth && mousePageY > tOff.top && mousePageY < tOff.top + tHeight);

                    sketch.updatePotentialSymbol(symbol, pageX, pageY);
                    scope.$digest();

                });

                scope.$on("newSymbolAbortDrag", function() {
                    if (scope.draggingNewSymbol) {
                        scope.draggingNewSymbol = false;
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
                        sketch.updatePotentialSymbol(null);
                        return;
                    }

                    // TODO: Improve with different widget types
                    sketch.commitPotentialSymbol();

                    scope.$broadcast("historyCheckpoint");

                	console.log("scope.state: ", scope.state);
                });

                $rootScope.showEquationEditor = function(initialState, questionDoc) {

                    return new Promise(function(resolve, reject) {
                        var eqnModal = $('#equationModal');
                        eqnModal.one("opened.fndtn.reveal", function() {
                            element.find(".top-menu").css("bottom", scope.equationEditorElement.height());
                        });
                        
                        eqnModal.foundation("reveal", "open");
                        scope.state = initialState || { symbols: {} };
                        scope.questionDoc = questionDoc;

                        nextHistoryEntry = JSON.parse(JSON.stringify(scope.state.symbols));
                        scope.history = [];
                        scope.future = [];
                        
                        // TODO: Redisplay old equations in the centre
                        var p = new p5( function(p) {
                            sketch = new MySketch(p, scope, element.width(), element.height());
                            if(!_.isEmpty(scope.state.symbols)) {
                                sketch.parseSubtreeObject(scope.state.symbols);
                            }
                            return sketch;
                        }, element.find(".equation-editor")[0]);

                        eqnModal.one("closed.fndtn.reveal", function() {
                            resolve(scope.state);
                        })

                    });
                };
                
                scope.newExpressionCallback = function(e) {
                    var rp = $(".result-preview>span");

                    rp.empty();
                    delete scope.state.result;
                    if (e) {
                        katex.render(e, rp[0]);
                    }

                    var w =  e ? rp.outerWidth() : 0;
                    var resultPreview = $(".result-preview");
                    resultPreview.stop(true);
                    resultPreview.animate({width: w}, 200);
                };

                var stringSymbols = function(ss) {
                	var symbols = [];
                	for(var i in ss) {
                		var s = ss[i];
                		symbols.push({
                			type: "symbol",
                			token: s,
                			label: s,
                            letter: s,
                			fontSize: 48,
                            texLabel: true,
                            enableMods: true
                		});
                	}

                	return symbols;
                };

                scope.symbolLibrary = {

                    latinLetters: stringSymbols(["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]),

                    latinLettersUpper: stringSymbols(["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]),

                    greekLetters: stringSymbols(["\\alpha","\\beta","\\gamma","\\delta","\\epsilon","\\zeta","\\eta","\\theta","\\iota","\\kappa","\\lambda","\\mu","\\nu","\\xi","\\omicron","\\pi","\\rho","\\sigma","\\tau","\\upsilon","\\phi","\\chi","\\psi","\\omega"]),
                    
                    greekLettersUpper: stringSymbols(["\\Gamma","\\Delta","\\Theta","\\Lambda","\\Xi","\\Pi","\\Sigma","\\Upsilon","\\Phi","\\Psi","\\Omega"]),

                    reducedVars: stringSymbols(["a", "F", "m", "v", "u", "r", "t", "G", "M"]),

                    reducedOps: [{
                        type: "binaryOp",
                        label: "+",
                        token: "+",
                        fontSize: 48,
                        texLabel: true
                    }, {
                        type: "binaryOp",
                        label: "-",
                        token: "−",
                        length: 40,
                        texLabel: true
                    }, {
                        type: "fraction",
                        label: "\\frac{a}{b}",
                        token: ":frac",
                        length: 100,
                        texLabel: true
                    }, {
                        type: "brackets",
                        subType: "brackets",
                        width: 220,
                        height: 70,
                        label: "(x)",
                        texLabel: true
                    }, {
                        type: "sqrt",
                        subType: "sqrt",
                        width: 148,
                        height: 60,
                        label: "\\sqrt{x}",
                        texLabel: true
                    }],

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

                    trig: [{
                        type: "string",
                        label: "\\sin",
                        token: "\\sin",
                        func: true,
                        fontSize: 48,
                        texLabel: true
                    },{
                        type: "string",
                        label: "\\cos",
                        token: "\\cos",
                        func: true,
                        fontSize: 48,
                        texLabel: true
                    },{
                        type: "string",
                        label: "\\tan",
                        token: "\\tan",
                        func: true,
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

                    functions: []
                };

                scope.latinLetterTitle = {
                    fontSize: 48,
                    type: "string",
                    label: "abc"
                };

                scope.latinLetterUpperTitle = {
                    fontSize: 48,
                    type: "string",
                    label: "ABC"
                };

                scope.greekLetterTitle = {
                    fontSize: 48,
                    type: "string",
                    label: "\\alpha\\beta",
                    texLabel: true
                };

                scope.greekLetterUpperTitle = {
                    fontSize: 48,
                    type: "string",
                    label: "\\Gamma\\Sigma",
                    texLabel: true
                };

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

                scope.trigTitle = {
                    fontSize: 48,
                    type: "string",
                    label: "\\sin",
                    texLabel: true
                };

                scope.calculusTitle = {
                    fontSize: 48,
                    type: "string",
                    label: "\\int",
                    texLabel: true
                };

                var nextHistoryEntry;

                scope.$on("historyCheckpoint", function() {
                    scope.future = [];
                    scope.history.push(nextHistoryEntry);
                    //TODO: Serialise current state for history
                    //nextHistoryEntry = JSON.parse(JSON.stringify(scope.state.symbols));
                    // nextHistoryEntry = JSON.parse(JSON.stringify(scope.sketch.getSubtreeObjects()));
                    console.log("historyCheckpoint:", scope.state);
                });

                scope.undo = function() {
                    if (scope.history.length > 0) {
                        // TODO: Add current state to scope.future
                        //scope.future.unshift(JSON.parse(JSON.stringify(scope.state.symbols)));
                        
                        // TODO: Set current state to top of scope.history
                        //scope.state.symbols = scope.history.pop();
                        
                        // TODO: Add current state (new one) to history
                        //nextHistoryEntry = JSON.parse(JSON.stringify(scope.state.symbols));
                    }
                };

                scope.redo = function() {
                    if (scope.future.length > 0) {
                        // TODO: Add current state to history
                        //scope.history.push(JSON.parse(JSON.stringify(scope.state.symbols)));
                        
                        // TODO: Set current state to end of scope.future
                        //scope.state.symbols = scope.future.shift();
                        
                        // TODO: Add current state (new one) to history
                        //nextHistoryEntry = JSON.parse(JSON.stringify(scope.state.symbols));
                    }
                };

                scope.submit = function() {
                    // scope.state.result = { "tex":"e^{i\\pi}+1=0" };
                    scope.state.result = { "tex": scope.state.inequalityResult };
                    $("#equationModal").foundation("reveal", "close");
                    api.logger.log({
                        type : "CLOSE_EQUATION_EDITOR"
                    });
                };

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