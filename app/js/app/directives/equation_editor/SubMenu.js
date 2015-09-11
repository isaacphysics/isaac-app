define([], function() {

	return ["$timeout", function($timeout) {

		return {
            scope: true,
			restrict: "A",
			templateUrl: "/partials/equation_editor/sub_menu.html",
			link: function(scope, element, attrs) {
                scope.name+="SUBMENU"

                var items = element.siblings("[sub-menu-item]");

                scope.selectMenu = function(e, idx) {
                	scope.activeIdx = idx;
					element.siblings("[sub-menu-item]").hide();
					$(element.siblings("[sub-menu-item]")[idx]).show();

					scope.$emit("triggerResizeMenu");
                }

                scope.menus = [];
                items.each(function(i,e) {
                    scope.menus.push(JSON.parse(JSON.stringify(scope.$eval($(e).attr("menu-title")))));
                });

                scope.activeIdx = 0;

                var lst = element.find("ul");
                var bufferedLeft = 0;
                var absorbSymbolDrag = function($e, pageX, pageY, deltaX, deltaY) {

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
                }

                var abortSymbolDrag = function($e, symbol, pageX, pageY) {
                    bufferedLeft = parseFloat(lst.css("left"));
                    scope.selectMenu($e, scope.menus.indexOf(symbol));
                }

                scope.$on("symbolDrag", absorbSymbolDrag)
                scope.$on("symbolDrop", abortSymbolDrag)

			},
		};
	}];
});