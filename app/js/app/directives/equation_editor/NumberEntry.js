define([], function() {

    return ["$timeout", function($timeout) {

        return {
            scope: true,
            restrict: "A",
            templateUrl: "/partials/equation_editor/number_entry.html",
            link: function(scope, element, attrs) {
                scope.name="NUMBER ENTRY"

                scope.currentNumber = "";
                scope.currentExponent = null;
                scope.negate = false;
                scope.currentSymbol = null;

                scope.clearOnClose = true;

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
                    } else {
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

                    scope.currentSymbol.fromCalc = true;
                    scope.currentSymbol.editable = {
                        currentNumber: scope.currentNumber,
                        currentExponent: scope.currentExponent,
                        negate: scope.negate,
                    };
                    scope.currentSymbol.properties.significand = scope.currentNumber;
                    scope.currentSymbol.properties.exponent = scope.currentExponent;
                };

                scope.$watch("currentNumber", updateSymbol);
                scope.$watch("currentExponent", updateSymbol);
                scope.$watch("negate", updateSymbol);
                scope.$watch("currentExponent", updateInputPadding);

                scope.$on("symbolDrag", function($e, symbol, pageX, pageY, deltaX, deltaY, mousePageX, mousePageY) {
                    if (pageY > element.offset().top + element.height()) {
                        scope.clearOnClose = false;
                        //scope.$emit("triggerCloseMenus");
                        scope.clearOnClose = true;
                    }

                    scope.$emit("newSymbolDrag", symbol, pageX, pageY, mousePageX, mousePageY);
                })

                scope.$on("symbolDrop", function($e, symbolSpec, pageX, pageY) {
                    if (pageY > element.offset().top + element.height()) {
                        scope.$emit("spawnSymbol");
                    }

                    scope.$emit("newSymbolAbortDrag");
                    scope.clearInput();
                });

                scope.$on("editNumber", function(_,s) {
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

                element.find("[katex]").each(function(i,e) {
                    katex.render($(e).html(), e);
                })
            },
        };
    }];
});