"use strict";

define(["/partials/equation_editor/symbol_menu.html"], function(templateUrl) {

	return [function() {

		return {
			priority: 0,
            scope: {
				symbols: "=",
            },
			restrict: "A",
			templateUrl: templateUrl,
			link: function(scope, element, attrs) {
				scope.name="SYMBOLMENU";

				let lst = element.find("ul");
				let bufferedLeft = 0;

				let absorbSymbolDrag = function($e, symbol, pageX, pageY, deltaX, deltaY, mousePageX, mousePageY) {
					scope.$emit('absorbSymbolDrag');
					bufferedLeft += deltaX;

					let newLeft = bufferedLeft;

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

					if (pageY > element.position().top + element.height() && $(window).height() <= 768) {
						scope.$emit("triggerCloseMenus");
					}

					scope.$emit("newSymbolDrag", symbol, pageX, pageY, mousePageX, mousePageY);
				};

				let abortSymbolDrag = function(_, symbol, pageX, pageY, mousePageX, mousePageY, offCanvas) {
					bufferedLeft = parseFloat(lst.css("left"));
					
						scope.$emit('abortSymbolDrag');
                    // If we've dropped outside the menu, spawn this symbol.
                    if (pageY > element.offset().top + element.height() && !offCanvas) {
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
