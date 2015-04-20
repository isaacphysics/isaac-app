define([], function() {

	return ["$timeout", function($timeout) {

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
                    r.token = ":line";

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
                	scope.symbols[nextSymbolId++] = $.extend({
                		x: pageX - offset.left, 
                		y: pageY - offset.top,
                    }, JSON.parse(JSON.stringify(symbol)));

                    scope.$broadcast("historyCheckpoint");
                	console.debug("Symbols:", scope.symbols);
                });


                scope.symbols = { 
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
                };

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
                		});
                	}

                	return symbols;
                }

                scope.symbolLibrary = {

                	latinLetters: stringSymbols(["a", "b", "c",]),

                	greekLetters: stringSymbols(["\\alpha", "\\beta", "\\gamma"]),

                    operators: [{
                        type: "container",
                        subType: "sqrt",
                        width: 148,
                        height: 148,
                        label: "\\sqrt{x}",
                        texLabel: true,
                    }]
                };

                scope.blurgh ={
                    fontSize: 38,
                    type: "string",
                    label: "B",
                }

                scope.latinLetterTitle = {
                	fontSize: 48,
                	type: "string",
                	label: "abc",
                };

                scope.greekLetterTitle = {
                	fontSize: 48,
                	type: "string",
                	label: "\\alpha\\beta",
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
                    if (e.data.tex) {
                        katex.render(e.data.tex, rp[0]);
                    }

                    var w =  e.data.tex ? rp.outerWidth() : 0;
                    $(".result-preview").stop(true);
                    $(".result-preview").animate({width: w}, 200);
                };

                var parseTimeout = null;

                var requestParse = function() {
                    var parse = function() {
                        var parserSymbols = [];

                        for (var s in scope.symbols) {
                            var ps = toParserSymbol(s, scope.symbols[s], $("#" + s).find(".measure-this"));
                            if (ps) {
                                parserSymbols.push(ps);
                            }
                        }
                        
                        self.parser = new Worker("/js/lib/parser.js");
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

                scope.$watch("symbols", function(newSymbols, oldSymbols) {
                    $(".result-preview").animate({width: 0}, 200);

                    requestParse();

                    updateSelectionRender();

                }, true);

                scope.history = [];
                scope.future = [];
                var nextHistoryEntry = JSON.parse(JSON.stringify(scope.symbols));

                scope.$on("historyCheckpoint", function() {
                    scope.future = [];
                    scope.history.push(nextHistoryEntry);
                    nextHistoryEntry = JSON.parse(JSON.stringify(scope.symbols));
                });

                scope.undo = function() {
                    if (scope.history.length > 0) {
                        scope.future.unshift(JSON.parse(JSON.stringify(scope.symbols)));
                        scope.symbols = scope.history.pop();
                        nextHistoryEntry = JSON.parse(JSON.stringify(scope.symbols));
                    }
                }

                scope.redo = function() {
                    if (scope.future.length > 0) {
                        scope.history.push(JSON.parse(JSON.stringify(scope.symbols)))
                        scope.symbols = scope.future.shift();
                        nextHistoryEntry = JSON.parse(JSON.stringify(scope.symbols));
                    }
                }

                element.on("keydown", function(e) {
                    console.log("KeyDown", e.which);

                    switch(e.which) {
                        case 46: // DELETE
                            for (var i in scope.selectedSymbols) {
                                delete scope.symbols[scope.selectedSymbols[i]];
                            }
                            scope.selectedSymbols.length = 0;
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

                    scope.selectionHandleFlags.showCalc = scope.selectedSymbols.length == 1 && scope.symbols[scope.selectedSymbols[0]].fromCalc;
                    scope.selectionHandleFlags.showResize = scope.selectedSymbols.length == 1;

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
                            var s = scope.symbols[sid];
                            s.x += dx;
                            s.y += dy;
                        }
                    } else if (scope.dragMode == "resize") {

                        for (var i in scope.selectedSymbols) {
                            var sid = scope.selectedSymbols[i];
                            var s = scope.symbols[sid];

                            switch (s.type) {
                                case "string":
                                    s.fontSize += dy*2*0.67 // TODO: Work out why I need this factor of 0.67...
                                    break;
                                case "container":
                                    s.width += dx;
                                    s.height += dy;
                                    s.x += dx/2;
                                    s.y += dy/2;
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

                    if ((dragTotalDx != 0 || dragTotalDy != 0) && (scope.dragMode == "move" || scope.dragMode == "resize")) {
                        // We have dragged
                        scope.$emit("historyCheckpoint");
                    }

                    if (scope.dragMode == "selectionBox") {

                        var off = element.find(".selection-box").offset();
                        var eOff = element.offset();

                        var minX = off.left - eOff.left;
                        var maxX = minX + element.find(".selection-box").width();

                        var minY = off.top - eOff.top;
                        var maxY = minY + element.find(".selection-box").height();

                        scope.selectedSymbols.length = 0;
                        for (var sid in scope.symbols) {
                            var s = scope.symbols[sid];
                            if (s.x > minX && s.x < maxX && s.y > minY && s.y < maxY) {
                                scope.selectedSymbols.push(sid);
                            }
                        }
                    }

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
                    }

                    grab(e.pageX, e.pageY, e);

                    scope.$broadcast("closeMenus");

                    scope.$digest();

                    e.stopPropagation();
                    e.preventDefault();
                });

                scope.$on("selection_calc", function(_, e) {

                    // If we got here, there should be precisely one symbol selected.

                    if (scope.selectedSymbols.length != 1) {
                        console.error(new Error("Can only edit single numbers"));
                        debugger;
                    }

                    scope.$broadcast("editNumber", scope.symbols[scope.selectedSymbols[0]]);

                    scope.$digest();

                    e.stopPropagation();
                    e.preventDefault();
                });

                scope.editorClick = function(e) {
                    scope.$broadcast("closeMenus");
                    scope.selectedSymbols.length = 0;

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
                })


			},

		};
	}];
});