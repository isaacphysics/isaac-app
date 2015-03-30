define([], function() {

	return ["$timeout", function($timeout) {

        var toParserSymbol = function(k, s, element) {

            var r = {id: k, type: "type/symbol"};

            switch(s.spec.type) {
                case "string":
                    if (!element.length)
                        return null;

                    r.top = s.y - element.height() / 2;
                    r.left = s.x - element.width() / 2;
                    r.width = element.width();
                    r.height = element.height();
                    r.token = s.spec.token;

                    break;
                case "line":

                    r.top = s.y - s.spec.length / 40;
                    r.left = s.x - s.spec.length / 2;
                    r.width = s.spec.length;
                    r.height = s.spec.length / 20;
                    r.token = ":line";

                    break;
                case "container":

                    r.top = s.y;
                    r.left = s.x;
                    r.width = s.spec.width;
                    r.height = s.spec.height;

                    switch(s.spec.subType) {
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

                scope.$on("spawnSymbol", function($e, symbolSpec, pageX, pageY) {
                	var offset = element.offset();
                	scope.state.symbols[nextSymbolId++] = {
                		x: pageX - offset.left, 
                		y: pageY - offset.top,
                		spec: JSON.parse(JSON.stringify(symbolSpec)),
                	}

                	console.debug("Symbols:", scope.state.symbols);
                });

                scope.state = {
					symbols: { 
						"ssym-0": {
							x: 330,
							y: 242,
							spec: {
								fontSize: 48,
								token: "x",
								type: "string"
							}
						},
						"ssym-1": {
							x: 370,
							y: 206,
							spec: {
								fontSize: 48,
								token: "y",
								type: "string"
							}
						},
						"ssym-2": {
							x: 309.5,
							y: 210,
							spec: {
								width: 157,
								height: 128,
								type: "container",
								subType: "sqrt"
							}
						},
						"ssym-3": {
							x: 285,
							y: 233,
							spec: {
								fontSize: 48,
								token: "3",
								type: "string"
							}
						},				
					},
                };

                var stringSymbolSpecs = function(ss) {
                	var symbolSpecs = [];
                	for(var i in ss) {
                		var s = ss[i];
                		symbolSpecs.push({
                			type: "string",
                			token: s,
                			label: s,
                			fontSize: 48,
                		});
                	}

                	return symbolSpecs;
                }

                scope.symbolLibrary = {

                	latinLetters: stringSymbolSpecs(["a", "b", "c",]),

                	greekLetters: stringSymbolSpecs(["\\alpha", "\\beta", "\\gamma", "\\int", "\\sqrt{x}"]),

                };

                scope.latinLetterTitle = {
                	fontSize: 48,
                	type: "string",
                	label: "abc",
                };

                scope.greekLetterTitle = {
                	fontSize: 48,
                	type: "string",
                	label: "αβγ",
                };

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

                    var rp = $(".result-preview");

                    rp.empty();
                    katex.render(e.data.tex, rp[0]);

                };

                scope.$watch("state.symbols", function() {

                    var parserSymbols = [];

                    for (var s in scope.state.symbols) {
                        var ps = toParserSymbol(s, scope.state.symbols[s], $("#" + s).find(".measure-this"));
                        if (ps) {
                            parserSymbols.push(ps);
                        }
                    }

                	
					self.parser = new Worker("/js/lib/parser.js");
					self.parser.onmessage = parser_message;
					self.parser.postMessage({symbols: parserSymbols});

                }, true);

			},

		};
	}];
});