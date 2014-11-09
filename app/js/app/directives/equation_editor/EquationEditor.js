define([], function() {

	return ["$timeout", function($timeout) {

		return {
			restrict: "A",
			templateUrl: "/partials/equation_editor/equation_editor.html",
			link: function(scope, element, attrs) {

                element.find(".top-menu").css("bottom", element.height());

                scope.clickHandle = function(which) {

                    if (scope.menuActive == which) {
                        scope.menuActive = null;
                        element.find(".top-menu").animate({"bottom": element.height()}, 200);

                    } else {
                        scope.menuActive = which;
                        element.find(".top-menu.active").removeClass("active");
                        scope[which].addClass("active");
                        var activeMenuHeight = scope[which].height();
                        element.find(".top-menu").animate({"bottom": element.height() - activeMenuHeight}, 200);

                    }
                };


 
			},

		};
	}];
});