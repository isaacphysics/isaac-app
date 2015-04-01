define([], function() {

	return ["$timeout", function($timeout) {

		return {
            scope: true,
			restrict: "A",
			templateUrl: "/partials/equation_editor/sub_menu.html",
			link: function(scope, element, attrs) {
                scope.name+="SUBMENU"

                var items = element.siblings("[sub-menu-item]");

                scope.menus = [];
                items.each(function(i,e) {
                	scope.menus.push(scope.$eval($(e).attr("menu-title")));
                });

                scope.selectMenu = function(e, idx) {
                	scope.activeIdx = idx;
					element.siblings("[sub-menu-item]").hide();
					$(element.siblings("[sub-menu-item]")[idx]).show();

					scope.$emit("triggerResizeMenu");
                }

                scope.activeIdx = 0;
			},
		};
	}];
});