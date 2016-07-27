define([], function() {

    return ["$timeout", function($timeout) {

        return {
            scope: {
                symbols: "=",
            },
            restrict: "A",
            templateUrl: "/partials/equation_editor/number_entry.html",
            link: function(scope, element, attrs) {
                scope.name = "NUMBER ENTRY"

                scope.currentNumber = "";
                scope.currentExponent = null;
                scope.negate = false;
                scope.currentSymbol = null;

                scope.clearOnClose = false;


                scope.buttonClick = function(btn) {
                	if (btn == "^") {
                		scope.currentExponent = "";
                	} else if (btn == "-" && scope.currentNumber.length > 0) {
                        scope.negate = !scope.negate;
                    } else {
                		if (scope.currentExponent != null) {
                			scope.currentExponent += btn;
                		} else {
		                	scope.currentNumber += btn;
                		}
                	}
                }
                
                scope.$on("numberClicked", function(_, num) {
                  console.debug("NumberEntry: " + num);
                  if (num == "^") {
                      scope.currentExponent = "";
                  } else if (num == "-" && scope.currentNumber.length > 0) {
                      scope.negate = !scope.negate;
                  } else {
                      if (scope.currentExponent != null) {
                          scope.currentExponent += num;
                      } else {
                          scope.currentNumber += num;
                      }
                  }
                });


                scope.clearInput = function() {
                    scope.currentExponent = null;
                    scope.currentNumber = "";
                    scope.negate = false;
                }

                var updateInputPadding = function() {
                    $timeout(function() {
                        $(element).find("input").css("padding-right", $(element).find(".input-exponent").width() + 20);
                    });
                };

                var updateSymbol = function() {

                    if (scope.editSymbol) {
                        scope.currentSymbol = scope.editSymbol;
                        scope.currentSymbol.label = scope.currentNumber;
                        //scope.hexNumber = true;
                    } else {
                        //scope.hexNumber = false;
                        scope.currentSymbol = {
                            type: "Num",
                            properties: {
                                significand: scope.currentNumber,
                            },
                            menu: {
                                label: scope.currentNumber,
                                texLabel: true,
                            }
                        }
                    }

                    var expNum = parseFloat(scope.currentExponent);

                    if (scope.currentNumber == "" || isNaN(parseFloat(scope.currentSymbol.menu.label))) {
                        scope.negate = false;
                        scope.currentSymbol = null;
                        return;
                    }

                    var currentNumberAlreadyNegated = scope.currentNumber.indexOf("-") == 0;

                    if (currentNumberAlreadyNegated && !scope.negate) {
                        scope.currentNumber = scope.currentNumber.substring(1);
                    } else if (!currentNumberAlreadyNegated && scope.negate) {
                        scope.currentNumber = "-" + scope.currentNumber;
                        scope.currentSymbol.menu.labelClass = "tiny";
                    }
                    if (scope.currentSymbol.menu.label && scope.currentExponent != null && scope.currentExponent.length > 0) {
                        if (!isNaN(expNum)) {
                            scope.currentSymbol.menu.label += "\n\\times 10^{" + expNum + "}";
                            scope.currentSymbol.menu.labelClass = "tiny";
                        }
                    }
                    scope.currentSymbol.editable = {
                        currentNumber: scope.currentNumber,
                        currentExponent: scope.currentExponent,
                        negate: scope.negate,
                    };
                    scope.currentSymbol.properties.significand = scope.currentNumber;
                    scope.currentSymbol.properties.exponent = scope.currentExponent;
                };

                scope.$watch("currentNumber", updateSymbol);
                scope.$watch("one", updateSymbol);
                scope.$watch("currentExponent", updateSymbol);
                scope.$watch("negate", updateSymbol);
                scope.$watch("currentExponent", updateInputPadding);
                scope.$on("clicked", function(_, clicked) {
                  scope.clicked = clicked;
                });
                scope.$on("symbolDrag", function($e, symbol, pageX, pageY, deltaX, deltaY, mousePageX, mousePageY) {
                    // This overcomes issues with deciding if number button is clicked or dragged.
                    // If the number is moved below the top green menu bar, then we associate this with a drag movement and
                    // draw the number on the canvas.
                    if (pageY > element.height()) {
                        scope.clearOnClose = false;
                        scope.$emit("newSymbolDrag", symbol, pageX, pageY, mousePageX, mousePageY);
                    }
                })

                scope.$on("symbolDrop", function($e, symbolSpec, mousePageX, mousePageY, pageY) {
                    console.debug(scope.clicked);
                    if (!scope.clicked) {
                        scope.$emit("spawnSymbol");
                        // If property "editable" of current object isn't null, we must have generated it using the editor
                        // and thus dragging and dropping this object should trigger the emptying of the editor.
                        if (symbolSpec["editable"] != null) {
                            scope.clearInput();
                        }
                    }
                });

                scope.$on("editNumber", function(_, s) {
                    scope.editSymbol = s;
                    scope.currentNumber = s.editable.currentNumber;
                    scope.currentExponent = s.editable.currentExponent;
                    scope.negate = s.editable.negate;
                })

                scope.dismiss = function() {
                    scope.$emit("triggerCloseMenus");
                }

                scope.$on("closeMenus", function() {
                    if (scope.clearOnClose) {
                        delete scope.editSymbol;
                        scope.clearInput();
                    }
                })

                element.find("[katex]").each(function(i, e) {
                    katex.render($(e).html(), e);
                })
            },
        };
    }];
});
