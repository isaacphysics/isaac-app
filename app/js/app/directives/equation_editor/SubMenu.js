define(["/partials/equation_editor/sub_menu.html"], function(templateUrl) {

	return ["$timeout", function(_$timeout) {

		return {
            scope: true,
			restrict: "A",
			templateUrl: templateUrl,
			link: function(scope, element, _attrs) {
                scope.name+="SUBMENU"

                setTimeout(function() {
                    // Do this init asynchronously so that the sub-menu-items are definitely in the DOM.
                    let items = element.siblings("[sub-menu-item]");

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
                });


                let lst = element.find("ul");
                let bufferedLeft = 0;
                let absorbSymbolDrag = function(_$e, _pageX, _pageY, deltaX, _deltaY) {

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
                }

                let abortSymbolDrag = function($e, symbol, _pageX, _pageY) {
                    bufferedLeft = parseFloat(lst.css("left"));
                    scope.selectMenu($e, scope.menus.indexOf(symbol));
                }

                scope.$on("symbolDrag", absorbSymbolDrag)
                scope.$on("symbolDrop", abortSymbolDrag)

			},
		};
	}];
});