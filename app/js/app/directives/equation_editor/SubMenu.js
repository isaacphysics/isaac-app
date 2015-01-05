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
                	scope.menus.push($(e).attr("sub-menu-item"));
                });

                scope.selectMenu = function(e, idx) {

					element.siblings("[sub-menu-item]").hide();
					$(element.siblings("[sub-menu-item]")[idx]).show();

					scope.$emit("triggerResizeMenu");
                }

			},
		};
	}];
});