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

                scope.editorClick = function() {
                    scope.$broadcast("closeMenus");
                    scope.selectedSymbols.length = 0;
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
						type: "string"
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

                scope.$on("symbol_click", function($e, s, e) {
                	if (!e.ctrlKey) {
	                	scope.selectedSymbols.length = 0;
	                	scope.selectedSymbols.push(s);
	                } else {
	                	if (scope.selectedSymbols.indexOf(s) > -1) {
	                		scope.selectedSymbols.splice(scope.selectedSymbols.indexOf(s),1);
	                	} else {
	                		scope.selectedSymbols.push(s);
	                	}
	                }

	                e.preventDefault();
	                e.stopPropagation();
                })

                var parser_message = function(e) {
                    console.debug("Parser message:", e);
                    console.groupEnd();
                    var rp = $(".result-preview>span");

                    rp.empty();
                    katex.render(e.data.tex, rp[0]);
                    var w =  e.data.tex ? rp.outerWidth() : 0;
                    $(".result-preview").stop(true);
                    $(".result-preview").animate({width: w}, 200);
                };

                scope.$watch("symbols", function(newSymbols, oldSymbols) {
                    $(".result-preview").animate({width: 0}, 200);


                    // Update asynchronously, as we need the DOM elements to exist for the new symbol.
                    setTimeout(function() {
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

                    });

                }, true);

                scope.history = [];
                scope.future = [];
                var nextHistoryEntry = JSON.parse(JSON.stringify(scope.symbols));

                scope.$on("historyCheckpoint", function() {
                    scope.future = [];
                    scope.history.push(nextHistoryEntry);
                    nextHistoryEntry = JSON.parse(JSON.stringify(scope.symbols));
                    console.log("CHECKPOINT", scope.history);
                });

                scope.undo = function() {
                    if (scope.history.length > 0) {
                        scope.future.unshift(JSON.parse(JSON.stringify(scope.symbols)));
                        scope.symbols = scope.history.pop();
                        nextHistoryEntry = JSON.parse(JSON.stringify(scope.symbols));
                    }
                    console.log("UNDO", scope.history);
                }

                scope.redo = function() {
                    if (scope.future.length > 0) {
                        scope.history.push(JSON.parse(JSON.stringify(scope.symbols)))
                        scope.symbols = scope.future.shift();
                        nextHistoryEntry = JSON.parse(JSON.stringify(scope.symbols));
                    }
                }

			},

		};
	}];
});