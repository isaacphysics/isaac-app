define([], function() {

	return [function() {

		return {
			priority: 0,
            scope: {
            	symbols: "=",
            },
			restrict: "A",
			templateUrl: "/partials/equation_editor/number_menu.html",
			link: function(scope, element, attrs) {
				scope.name="SYMBOLMENU";
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
                };
				var lst = element.find("ul");
				var bufferedLeft = 0;
				var absorbSymbolDrag = function($e, symbol, pageX, pageY, deltaX, deltaY, mousePageX, mousePageY) {

					bufferedLeft += deltaX;

					newLeft = bufferedLeft;

					if (newLeft > 0) {
						newLeft = 0;
					}
					else if (newLeft < element.width() - lst.outerWidth()) {
						if (element.width() < lst.outerWidth()) {
							newLeft = element.width() - lst.outerWidth();
						} else {
							newLeft = 0;
						}
					}

					lst.css("left", newLeft);

					if (pageY > element.offset().top + element.height() && $(window).height() <= 640) {
						scope.$emit("triggerCloseMenus");
					}

					scope.$emit("newSymbolDrag", symbol, pageX, pageY, mousePageX, mousePageY);
				};

				var abortSymbolDrag = function($e, symbol, pageX, pageY, mousePageX, mousePageY) {
					bufferedLeft = parseFloat(lst.css("left"));

                    // If we've dropped outside the menu, spawn this symbol.
                    if (pageY > element.offset().top + element.height()) {
                        scope.$emit("spawnSymbol");
                    } else {
                    	scope.$emit("newSymbolAbortDrag");
                    }
				};

				abortSymbolDrag();

				scope.$on("symbolDrag", absorbSymbolDrag);
				scope.$on("symbolDrop", abortSymbolDrag);
			}
		};
	}];
});