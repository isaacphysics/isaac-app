"use strict";
define([], function() {

	return ["$timeout", "$rootScope", function($timeout, $rootScope) {

        /*
        equationEditorState = {
            symbols: { 
                "ssym-0": {
                    x: 330,
                    y: 242,
                    fontSize: 48,
                    token: "x",
                    type: "string"
                },
                "ssym-1": {
                    x: 370,
                    y: 206,
                    fontSize: 48,
                    token: "y",
                    type: "string"
                },
                "ssym-2": {
                    x: 309.5,
                    y: 210,
                    width: 157,
                    height: 128,
                    type: "container",
                    subType: "sqrt"
                },
                "ssym-3": {
                    x: 285,
                    y: 233,
                    fontSize: 48,
                    token: "3",
                    editable: {
                        currentNumber: "3",
                        currentExponent: null,
                    },
                    type: "string",
                    fromCalc: true,
                },              
                "ssym-4": {
                    x: 100,
                    y: 200,
                    length: 100,
                    token: ":line",
                    type: "line",
                },              
            },
        }
*/


        var toParserSymbol = function(k, s, element) {

            var r = {id: k, type: "type/symbol"};

            switch(s.type) {
                case "string":
                    if (!element.length)
                        return null;

                    r.top = s.y - element.height() / 2;
                    r.left = s.x - element.width() / 2;
                    r.width = element.width();
                    r.height = element.height();
                    r.token = s.token;

                    break;
                case "line":

                    r.top = s.y - s.length / 40;
                    r.left = s.x - s.length / 2;
                    r.width = s.length;
                    r.height = s.length / 20;
                    r.token = s.token;

                    break;
                case "container":

                    r.top = s.y - s.height / 2;
                    r.left = s.x - s.width / 2;
                    r.width = s.width;
                    r.height = s.height;

                    switch(s.subType) {
                        case "sqrt":
                            r.token = ":sqrt";
                            break;
                        case "brackets":
                            r.token = ":brackets";
                            break;
                        case "abs":
                            r.token = ":abs";
                            break;
                    }

                    break;
            }

            return r;
        }


		var nextSymbolId = 0;

		return {
			scope: true,
			restrict: "A",
			templateUrl: "/partials/equation_editor/equation_editor.html",
			link: function(scope, element, attrs) {

                scope.canvasOffset = { }

                scope.equationEditorElement = element;

                scope.selectedSymbols = [];
                scope.selectionHandleFlags = {
                    showCalc: false,
                    showResize: true,
                    showMove: true,
                };

                scope.$on("triggerCloseMenus", function() {
                	scope.$broadcast("closeMenus");
                });

                scope.$on("triggerResizeMenu", function() {
                	scope.$broadcast("resizeMenu");
                });

                scope.$on("spawnSymbol", function($e, symbol, pageX, pageY) {
                	var offset = element.offset();
                    var width = element.width();
                    var height = element.height();

                    var newSymbol = $.extend({
                        x: pageX - offset.left - width/2 - scope.canvasOffset.marginLeft, 
                        y: pageY - offset.top - height/2 - scope.canvasOffset.marginTop,
                    }, JSON.parse(JSON.stringify(symbol)));

                    // Store the original token so that we can modify it with dots, primes, etc.
                    newSymbol.baseToken = newSymbol.token;

                	scope.state.symbols[nextSymbolId++] = newSymbol;

                    scope.$broadcast("historyCheckpoint");
                	console.debug("Symbols:", scope.state.symbols);
                });

                $rootScope.showEquationEditor = function(initialState, questionDoc) {

                    return new Promise(function(resolve, reject) {

                        $("#equationModal").one("opened.fndtn.reveal", function() {
                            element.find(".top-menu").css("bottom", scope.equationEditorElement.height());
                        });
                        
                        $("#equationModal").foundation("reveal", "open");
                        scope.state = initialState || { symbols: {}, };
                        scope.questionDoc = questionDoc;

                        nextHistoryEntry = JSON.parse(JSON.stringify(scope.state.symbols));
                        scope.history = [];
                        scope.future = [];

                        var sumX = 0;
                        var sumY = 0;
                        var count = 0;
                        for (var sid in scope.state.symbols) {
                            nextSymbolId = Math.max(nextSymbolId, parseInt(sid))+1;
                            sumX += scope.state.symbols[sid].x;
                            sumY += scope.state.symbols[sid].y;
                            count++;
                        }

                        if (count > 0) {
                            scope.canvasOffset = {
                                marginLeft: -sumX / count,
                                marginTop: -sumY / count,
                            }
                        } else {
                            scope.canvasOffset = {
                                marginLeft: 0,
                                marginTop: 0,
                            }
                        }

                        console.debug("Set canvas offset:", scope.canvasOffset);
                        $("#equationModal").one("closed.fndtn.reveal", function() {
                            resolve(scope.state);
                        })

                    });
                }

                var stringSymbols = function(ss) {
                	var symbols = [];
                	for(var i in ss) {
                		var s = ss[i];
                		symbols.push({
                			type: "string",
                			token: s,
                			label: s,
                			fontSize: 48,
                            texLabel: true,
                            enableMods: true,
                		});
                	}

                	return symbols;
                }

                scope.symbolLibrary = {

                    latinLetters: stringSymbols(["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]),

                    latinLettersUpper: stringSymbols(["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]),

                    greekLetters: stringSymbols(["\\alpha","\\beta","\\gamma","\\delta","\\epsilon","\\zeta","\\eta","\\theta","\\iota","\\kappa","\\lambda","\\mu","\\nu","\\xi","\\omicron","\\pi","\\rho","\\sigma","\\tau","\\upsilon","\\phi","\\chi","\\psi","\\omega"]),
                    
                    greekLettersUpper: stringSymbols(["\\Gamma","\\Delta","\\Theta","\\Lambda","\\Xi","\\Pi","\\Sigma","\\Upsilon","\\Phi","\\Psi","\\Omega"]),

                    operators: [{
                        type: "string",
                        label: "=",
                        token: "=",
                        fontSize: 48,
                        texLabel: true,
                    },{
                        type: "string",
                        label: "+",
                        token: "+",
                        fontSize: 48,
                        texLabel: true,
                    },{
                        type: "line",
                        label: "-",
                        token: "-",
                        length: 40,
                        texLabel: true,
                    },{
                        type: "string",
                        label: "\\times",
                        token: "\\times",
                        fontSize: 48,
                        texLabel: true,
                    },{
                        type: "line",
                        label: "\\frac{a}{b}",
                        token: ":frac",
                        length: 40,
                        texLabel: true,
                    },{
                        type: "string",
                        label: "\\pm",
                        token: "\\pm",
                        fontSize: 48,
                        texLabel: true,
                    },{
                        type: "container",
                        subType: "sqrt",
                        width: 148,
                        height: 60,
                        label: "\\sqrt{x}",
                        texLabel: true,
                    },{
                        type: "container",
                        subType: "brackets",
                        width: 148,
                        height: 60,
                        label: "(x)",
                        texLabel: true,
                    },{
                        type: "container",
                        subType: "abs",
                        width: 148,
                        height: 60,
                        label: "|x|",
                        texLabel: true,
                    },{
                        type: "string",
                        label: "!",
                        token: "!",
                        fontSize: 48,
                        texLabel: true,
                    }],

                    functions: [{
                        type: "string",
                        label: "\\sin",
                        token: "\\sin",
                        fontSize: 48,
                        texLabel: true,
                    },{
                        type: "string",
                        label: "\\cos",
                        token: "\\cos",
                        fontSize: 48,
                        texLabel: true,
                    },{
                        type: "string",
                        label: "\\tan",
                        token: "\\tan",
                        fontSize: 48,
                        texLabel: true,
                    },{
                        type: "string",
                        label: "\\int",
                        token: "\\int",
                        fontSize: 48,
                        texLabel: true,
                    },{
                        type: "string",
                        label: "\\mathrm{d}",
                        token: "\\mathrm{d}",
                        fontSize: 48,
                        texLabel: true,
                    }]
                };

                scope.latinLetterTitle = {
                    fontSize: 48,
                    type: "string",
                    label: "abc",
                };

                scope.latinLetterUpperTitle = {
                    fontSize: 48,
                    type: "string",
                    label: "ABC",
                };

                scope.greekLetterTitle = {
                    fontSize: 48,
                    type: "string",
                    label: "\\alpha\\beta",
                    texLabel: true,
                };

                scope.greekLetterUpperTitle = {
                    fontSize: 48,
                    type: "string",
                    label: "\\Gamma\\Sigma",
                    texLabel: true,
                };

                scope.operatorMenuTitle = {
                    fontSize: 48,
                    type: "string",
                    label: "\\sqrt{x}",
                }

                var parser_message = function(e) {
                    e.currentTarget.terminate();
                    console.debug("Parser message:", e);
                    console.groupEnd();
                    var rp = $(".result-preview>span");

                    rp.empty();
                    delete scope.state.result;
                    if (e.data.tex) {
                        katex.render(e.data.tex, rp[0]);
                        scope.state.result = e.data;
                    }

                    var w =  e.data.tex ? rp.outerWidth() : 0;
                    $(".result-preview").stop(true);
                    $(".result-preview").animate({width: w}, 200);
                };

                var parseTimeout = null;

                var requestParse = function() {
                    var parse = function() {
                        var parserSymbols = [];

                        for (var s in scope.state.symbols) {
                            var ps = toParserSymbol(s, scope.state.symbols[s], $("#" + s).find(".measure-this"));
                            if (ps) {
                                parserSymbols.push(ps);
                            }
                        }
                        
                        self.parser = new Worker("/js/lib/equation_parser.js");
                        self.parser.onmessage = parser_message;
                        console.groupCollapsed("Parse");
                        self.parser.postMessage({symbols: parserSymbols});

                        updateSelectionRender();
                    }

                    if (parseTimeout) {
                        clearTimeout(parseTimeout);
                    }

                    parseTimeout = setTimeout(parse, 500);
                }

                scope.$watch("state.symbols", function(newSymbols, oldSymbols) {
                    
                    if (JSON.stringify(newSymbols) == JSON.stringify(oldSymbols))
                        return;

                    $(".result-preview").animate({width: 0}, 200);

                    requestParse();

                    updateSelectionRender();

                }, true);

                var nextHistoryEntry;

                scope.$on("historyCheckpoint", function() {
                    scope.future = [];
                    scope.history.push(nextHistoryEntry);
                    nextHistoryEntry = JSON.parse(JSON.stringify(scope.state.symbols));
                });

                scope.undo = function() {
                    if (scope.history.length > 0) {
                        scope.future.unshift(JSON.parse(JSON.stringify(scope.state.symbols)));
                        scope.state.symbols = scope.history.pop();
                        nextHistoryEntry = JSON.parse(JSON.stringify(scope.state.symbols));
                    }
                }

                scope.redo = function() {
                    if (scope.future.length > 0) {
                        scope.history.push(JSON.parse(JSON.stringify(scope.state.symbols)))
                        scope.state.symbols = scope.future.shift();
                        nextHistoryEntry = JSON.parse(JSON.stringify(scope.state.symbols));
                    }
                }

                scope.submit = function() {
                    $("#equationModal").foundation("reveal", "close");
                }

                element.on("keydown", function(e) {
                    console.log("KeyDown", e.which);

                    switch(e.which) {
                        case 46: // DELETE
                            scope.trash();
                            scope.$apply();
                        break;
                    }
                });

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
                            height: e.height(),
                        }

                        maxX = Math.max(maxX, localPos.left + localPos.width);
                        maxY = Math.max(maxY, localPos.top + localPos.height);
                    }

                    selectionHandle.css({
                        left: maxX,
                        top: maxY,
                    });

                    scope.selectionHandleFlags.showCalc = scope.selectedSymbols.length == 1 && scope.state.symbols[scope.selectedSymbols[0]].fromCalc;
                    scope.selectionHandleFlags.showResize = scope.selectedSymbols.length == 1;
                    scope.selectionHandleFlags.enableSymbolModMenu = scope.selectedSymbols.length == 1 && scope.state.symbols[scope.selectedSymbols[0]].enableMods;
                    //scope.selectionHandleFlags.symbolModMenuOpen = false
                }

                scope.$watchCollection("selectedSymbols", updateSelectionRender);

                var mousemove = function(e) {
                    drag(e.pageX, e.pageY, e);

                    e.stopPropagation();
                    e.preventDefault();
                }

                var mouseup = function(e) {

                    drop(e.pageX, e.pageY, e);

                    e.stopPropagation();
                    e.preventDefault();
                }


                scope.dragging = false;
                var dragLastPageX, dragLastPageY;
                var dragTotalDx = 0, dragTotalDy = 0;

                var grab = function(pageX, pageY, e) {

                    dragLastPageX = pageX;
                    dragLastPageY = pageY;

                    dragTotalDx = 0;
                    dragTotalDy = 0;

                    $("body").on("mouseup", mouseup);
                    $("body").on("mousemove", mousemove);
                }

                var drag = function drag(pageX, pageY, e) {
                    scope.dragging = true;

                    var dx = pageX - dragLastPageX;
                    var dy = pageY - dragLastPageY;

                    dragLastPageX = pageX;
                    dragLastPageY = pageY;

                    dragTotalDx += dx;
                    dragTotalDy += dy;

                    if (scope.dragMode == "move") {

                        for (var i in scope.selectedSymbols) {
                            var sid = scope.selectedSymbols[i];
                            var s = scope.state.symbols[sid];
                            s.x += dx;
                            s.y += dy;
                        }

                        var tOff = element.find(".trash-button").offset();
                        var tWidth = element.find(".trash-button").width();
                        var tHeight = element.find(".trash-button").height();
                        scope.trashActive = (pageX > tOff.left && pageX < tOff.left + tWidth && pageY > tOff.top && pageY < tOff.top + tHeight);

                    } else if (scope.dragMode == "resize") {

                        for (var i in scope.selectedSymbols) {
                            var sid = scope.selectedSymbols[i];
                            var s = scope.state.symbols[sid];

                            switch (s.type) {
                                case "string":
                                    s.fontSize += dy*2*0.67 // TODO: Work out why I need this factor of 0.67...
                                    s.fontSize = Math.max(10, s.fontSize);
                                    break;
                                case "container":
                                    s.width += dx;
                                    s.height += dy;
                                    s.x += dx/2;
                                    s.y += dy/2;

                                    s.width = Math.max(10, s.width);
                                    s.height = Math.max(10, s.height);
                                    break;
                                case "line":
                                    s.length += dx;
                                    s.length = Math.max(s.length, 10);
                                    break;
                                default:
                                    console.warn("Resizing unknown symbol type:", s.type);
                                    break;
                            }
                        }
                    } else if (scope.dragMode == "selectionBox") {
                        var off = element.offset();

                        var originX = pageX - dragTotalDx - off.left;
                        var originY = pageY - dragTotalDy - off.top;

                        var width = dragTotalDx;
                        var height = dragTotalDy;

                        if (width < 0) {
                            width = -width;
                            originX -= width;
                        }

                        if (height < 0) {
                            height = -height;
                            originY -= height;
                        }

                        element.find(".selection-box").css({
                            left: originX,
                            top: originY,
                            width: width,
                            height: height,
                        });
                    }

                    // Only call digest, not apply. This avoids a complete recursive update from $rootScope. Probably.
                    scope.$digest();

                }

                var drop = function(pageX, pageY, e) {

                    $("body").off("mouseup", mouseup);
                    $("body").off("mousemove", mousemove);

                    if ((dragTotalDx != 0 || dragTotalDy != 0) && (scope.dragMode == "move" || scope.dragMode == "resize") && !scope.trashActive) {
                        // We have dragged
                        scope.$emit("historyCheckpoint");
                    }

                    if (scope.dragMode == "selectionBox") {

                        var off = element.find(".selection-box").offset();
                        var eOff = element.offset();

                        var w = element.width();
                        var h = element.height();
                        var minX = off.left - eOff.left - w/2 - scope.canvasOffset.marginLeft;
                        var maxX = minX + element.find(".selection-box").width();

                        var minY = off.top - eOff.top - h/2 - scope.canvasOffset.marginTop;
                        var maxY = minY + element.find(".selection-box").height();

                        scope.selectedSymbols.length = 0;
                        scope.selectionHandleFlags.symbolModMenuOpen = false

                        for (var sid in scope.state.symbols) {
                            var s = scope.state.symbols[sid];
                            if (s.x > minX && s.x < maxX && s.y > minY && s.y < maxY) {
                                scope.selectedSymbols.push(sid);
                            }
                        }
                    }

                    if (scope.trashActive) {
                        scope.trash();
                    }

                    scope.trashActive = false;
                    scope.dragging = false;
                    scope.dragMode = null;
                    scope.$apply();
                }

                scope.$on("selection_grab", function(_, symbolId, mode, e) {
                    scope.dragMode = mode;

                    if (symbolId && mode == "move" && scope.selectedSymbols.indexOf(symbolId) == -1) {
                        if (e.ctrlKey) {
                            if (scope.selectedSymbols.indexOf(symbolId) > -1) {
                                scope.selectedSymbols.splice(scope.selectedSymbols.indexOf(symbolId),1);
                            } else {
                                scope.selectedSymbols.push(symbolId);
                            }

                        } else {
                            scope.selectedSymbols.length = 0;
                            scope.selectedSymbols.push(symbolId);
                        }
                        scope.selectionHandleFlags.symbolModMenuOpen = false

                    }

                    if (e.touches) {
                        grab(e.touches[0].pageX, e.touches[0].pageY, e);
                    } else {
                        grab(e.pageX, e.pageY, e);
                    }

                    scope.$broadcast("closeMenus");

                    scope.$digest();

                    e.stopPropagation();
                    e.preventDefault();
                });

                scope.$on("selection_drag", function(_, pageX, pageY, e) {
                    drag(pageX, pageY, e);
                });

                scope.$on("selection_drop", function(_, pageX, pageY, e) {
                    drop(pageX, pageY, e);
                });

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
                });

                var rebuildSymbolToken = function(s) {
                    s.token = s.baseToken;

                    if(s.bold) {
                        s.token = "\\mathbf{" + s.token + "}";
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

                            var hasPrime = s.token.indexOf("'") > -1;
                            s.token = s.token.replace("'","");
                            if (s.token.indexOf("\\dot") > -1) {
                                s.token = s.token.replace("\\dot{", "\\ddot{");
                            } else if (s.token.indexOf("\\ddot") > -1) {
                                s.token = s.token.replace("\\ddot{", "");
                                s.token = s.token.replace("}", ""); // Yes, I know this will only replace one. That's what I want.
                            } else {
                                s.token = "\\dot{" + s.token + "}";
                            }
                            if (hasPrime){
                                s.token += "'";
                            }
                            break;
                        case "prime":

                            s.prime = s.prime || 0;
                            s.prime = (s.prime + 1) % 3;
                            rebuildSymbolToken(s);
                            break;
                            if (s.token.indexOf("'") > -1) {
                                s.token = s.token.replace("'", "");
                            } else {
                                s.token += "'";
                            }
                            break;
                        case "bold":
                            s.bold = !s.bold;
                            rebuildSymbolToken(s);
                            break;
                            if (s.token.indexOf("\\mathbf") > -1) {
                                s.token = s.token.replace("\\mathbf{", "");
                                s.token = s.token.replace("}", ""); // Yes, I know this will only replace one. That's what I want.
                            } else {
                                s.token = "\\mathbf{" + s.token + "}";
                            }
                            break;
                    }
                    scope.$apply();

                    e.stopPropagation();
                    e.preventDefault();
                })

                scope.editorClick = function(e) {
                    scope.$broadcast("closeMenus");
                    scope.selectedSymbols.length = 0;
                    scope.selectionHandleFlags.symbolModMenuOpen = false

                    scope.dragMode = "selectionBox";
                    $(".selection-box").css({
                        left: -10,
                        top: -10,
                        width: 0,
                        height: 0,
                    });


                    grab(e.pageX, e.pageY, e);

                };

                scope.$on("menuOpened", function() {
                    scope.selectedSymbols.length = 0;
                    scope.selectionHandleFlags.symbolModMenuOpen = false
                });

                scope.trash = function() {
                    if (scope.selectedSymbols.length > 0) {
                        for (var i in scope.selectedSymbols){
                            var sid = scope.selectedSymbols[i];
                            delete scope.state.symbols[sid];
                        }
                        scope.selectedSymbols.length = 0;
                        scope.selectionHandleFlags.symbolModMenuOpen = false
                        scope.$emit("historyCheckpoint");
                    }
                }


			},

		};
	}];
});