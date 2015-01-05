define([], function() {

	return ["$timeout", function($timeout) {

        var allMenus = [];

		return {
            priority: 10,
            scope: true,
			restrict: "A",
            transclude: true,
			templateUrl: "/partials/equation_editor/top_menu.html",
			link: function(scope, element, attrs) {
                scope.name="TOPMENU"

                scope.allSubMenus = [];

                element.find(".top-menu").css("bottom", scope.equationEditorElement.height());

                scope.menuName = attrs.topMenu;

                var el = element.find(".top-menu");

                allMenus.push(el[0]);
                scope.menuPos = "m" + allMenus.length;

                var closing = false;
                var closeMenus = function() {
                    if (el.hasClass("foreground") && !closing) {
                        console.debug("CLOSE ALL")

                        closing = true;
                        $(allMenus).stop(true).animate({"bottom": scope.equationEditorElement.height()}, 200, function() {
                            el.removeClass("foreground");
                            closing = false;
                        });
                    }
                }

                var toggleThisMenu = function() {
                    if (el.hasClass("foreground")) {
                        closeMenus();
                    } else {
                        $(allMenus).removeClass("foreground");
                        el.addClass("foreground");
                        var activeMenuHeight = el.height();
                        $(allMenus).stop(true).animate({"bottom": scope.equationEditorElement.height() - activeMenuHeight}, 200);
                    }
                }

                var resizeMenu = function() {
                    if (el.hasClass("foreground")) {
                        var activeMenuHeight = el.height();
                        $(allMenus).stop(true).animate({"bottom": scope.equationEditorElement.height() - activeMenuHeight}, 200);
                    }
                }

                scope.clickHandle = function(e) {

                    toggleThisMenu();

                    e.stopPropagation();
                    e.preventDefault();
                };

                scope.clickContent = function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                }

                scope.$on("closeMenus", closeMenus);
                scope.$on("resizeMenu", resizeMenu);

                if (allMenus.length == 2) {
                    $timeout(toggleThisMenu, 200);
                }

			},
		};
	}];
});