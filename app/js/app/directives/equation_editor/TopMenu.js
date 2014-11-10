define([], function() {

	return [function() {

        var allMenus = [];

		return {
            scope: true,
			restrict: "A",
            transclude: true,
			templateUrl: "/partials/equation_editor/top_menu.html",
			link: function(scope, element, attrs) {

                element.find(".top-menu").css("bottom", scope.equationEditorElement.height());

                scope.menuName = attrs.topMenu;

                var el = element.find(".top-menu");

                allMenus.push(el[0]);
                scope.menuPos = "m" + allMenus.length;

                var closeMenus = function() {
                    $(allMenus).animate({"bottom": scope.equationEditorElement.height()}, 200, function() {
                        el.removeClass("foreground");
                    });
                }

                scope.clickHandle = function(e) {
                    if (el.hasClass("foreground")) {
                        closeMenus();
                    } else {
                        $(allMenus).removeClass("foreground");
                        el.addClass("foreground");
                        var activeMenuHeight = el.height();
                        $(allMenus).animate({"bottom": scope.equationEditorElement.height() - activeMenuHeight}, 200);
                    }
                    e.stopPropagation();
                    e.preventDefault();
                };

                scope.$on("closeMenus", closeMenus);

			},
		};
	}];
});