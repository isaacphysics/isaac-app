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

                setTimeout(function() {
                    katex.render(attrs.topMenu,element.find(".handle")[0]);
                });

                var el = element.find(".top-menu");

								allMenus.push(el[0]);

                scope.menuPos = "m" + allMenus.length;

                var closing = false;
                var closeMenus = function() {
                    if (el.hasClass("active-menu") && !closing) {
                        console.debug("CLOSE ALL")

                        closing = true;
                        $(allMenus).stop(true).animate({"bottom": scope.equationEditorElement.height()}, {
                            duration: 200,
                            progress: function() {
                                scope.$root.$broadcast("menuMoved");
                            },
                            complete: function() {
                                el.removeClass("active-menu");
                                closing = false;
                            }
                        });
                    }
                };

                var toggleThisMenu = function() {
                    if (el.hasClass("active-menu")) {
                        closeMenus();
                    } else {
                        $(allMenus).removeClass("foreground");
                        $(allMenus).removeClass("active-menu");
                        el.addClass("foreground");
                        el.addClass("active-menu");
                        var activeMenuHeight = el.height();
                        $(allMenus).stop(true).animate({"bottom": scope.equationEditorElement.height() - activeMenuHeight}, 200);
                        scope.$emit("menuOpened");
												scope.$apply();
                    }
                };

                var resizeMenu = function() {
                    if (el.hasClass("active-menu")) {
                        var activeMenuHeight = el.height();
                        $(allMenus).stop(true).animate({"bottom": scope.equationEditorElement.height() - activeMenuHeight}, 200);
                    }
                };

                scope.clickHandle = function(e) {

                    toggleThisMenu();

                    e.stopPropagation();
                    e.preventDefault();
                };

                scope.clickContent = function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                };

                element.on("touchstarted mousedown", ".handle-menu-touch-content", scope.clickContent);
                element.on("touchstarted mousedown", ".handle-menu-touch", scope.clickHandle);

                scope.$on("closeMenus", closeMenus);
                scope.$on("resizeMenu", resizeMenu);

               // if (allMenus.length == 2) {
                //    $timeout(toggleThisMenu, 200);
                //}

                element.on("keydown", function(e) {
                    e.stopPropagation();
                });

                if (attrs.topMenu == "123") {
                    // Only do this for number entry menu.
                    scope.$on("editNumber", function(_,s) {
                        toggleThisMenu();
                    })
                }

                scope.$on("$destroy", function() {
                    allMenus.splice(allMenus.indexOf(el[0]),1);
                })
			},
		};
	}];
});
