define(["katex", "/partials/equation_editor/number_entry.html"], function(katex, templateUrl) {

    return ["$timeout", function(_$timeout) {

        return {
            scope: {
                symbols: "=",
            },
            restrict: "A",
            templateUrl: templateUrl,
            link: function(scope, element, _attrs) {
                scope.name = "NUMBER ENTRY"

                scope.currentNumber = "";
                scope.currentExponent = null;
                scope.negate = false;
                scope.currentSymbol = null;

                scope.clearOnClose = false;


                scope.buttonClick = function(btn) {
                    if (btn == "^") {
                        scope.currentExponent = "";
                    } else if (btn == "-") {
                      scope.negate = !scope.negate;
                      if(scope.currentNumber[0] != '-') {
                        scope.currentNumber = "-" + scope.currentNumber;
                      }
                      else {
                        scope.currentNumber = scope.currentNumber.substring(1);
                      }
                    } else {
                        if (scope.currentExponent != null) {
                            scope.currentExponent += btn;
                        } else {
                            scope.currentNumber += btn;
                        }
                    }
                }

                scope.$on("numberClicked", function(_event, num) {
                    if(num == undefined) {
                        return;
                    }
                    if (num == "^") {
                        scope.currentExponent = "";
                    } else if (num == "-") {
                        scope.negate = !scope.negate;
                        if(scope.currentNumber[0] != '-') {
                          scope.currentNumber = "-" + scope.currentNumber;
                        }
                        else {
                          scope.currentNumber = scope.currentNumber.substring(1);
                        }

                    } else {
                        scope.currentNumber += num;
                    }
                });


                scope.clearInput = function() {
                    scope.currentExponent = null;
                    scope.currentNumber = "";
                    scope.negate = false;
                }

                let updateSymbol = function() {

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

                    if (scope.currentNumber == "" || isNaN(parseFloat(scope.currentSymbol.menu.label))) {
                        scope.negate = false;
                        scope.currentSymbol = null;
                        return;
                    }

                    scope.currentSymbol.editable = {
                        currentNumber: scope.currentNumber,
                        negate: scope.negate,
                    };
                    scope.currentSymbol.properties.significand = scope.currentNumber;
                };

                scope.$watch("currentNumber", updateSymbol);
                scope.$watch("one", updateSymbol);
                scope.$watch("negate", updateSymbol);
                scope.$on("clicked", function(_event, clicked) {
                    scope.clicked = clicked;
                });
                scope.$on("symbolDrag", function(_$e, symbol, pageX, pageY, _deltaX, _deltaY, mousePageX, mousePageY) {
                    // This overcomes issues with deciding if number button is clicked or dragged.
                    // If the number is moved below the top green menu bar, then we associate this with a drag movement and
                    // draw the number on the canvas.
                    if (pageY > element.height()) {
                        scope.clearOnClose = false;
                        scope.$emit("newSymbolDrag", symbol, pageX, pageY, mousePageX, mousePageY);
                        // scope.$emit("triggerCloseMenus");
                    }

                    if (pageY > element.position().top + element.height() && $(window).height() <= 768) {
                        scope.$emit("triggerCloseMenus");
                    }
                })

                scope.$on("symbolDrop", function(_$e, symbolSpec, _mousePageX, _mousePageY, _pageY) {
                    if (!scope.clicked) {
                        scope.$emit("spawnSymbol");
                        // If property "editable" of current object isn't null, we must have generated it using the editor
                        // and thus dragging and dropping this object should trigger the emptying of the editor.
                        if (symbolSpec["editable"] != null) {
                            scope.clearInput();
                        }
                    }
                });

                scope.$on("editNumber", function(_event, s) {
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

                element.find("[katex]").each(function(_i, e) {
                    katex.render($(e).html(), e);
                })
            },
        };
    }];
});
