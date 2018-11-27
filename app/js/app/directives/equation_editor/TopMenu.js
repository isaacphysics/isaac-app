define(["katex", "/partials/equation_editor/top_menu.html"], function(katex, templateUrl) {

    return ["$timeout", function(_$timeout) {

        let allMenus = [];

        return {
            priority: 10,
            scope: true,
            restrict: "A",
            transclude: true,
            templateUrl: templateUrl,
            link: function(scope, element, attrs) {
                scope.name = "TOPMENU"



                scope.allSubMenus = [];

                element.find(".top-menu").css("bottom", scope.equationEditorElement.height());

                setTimeout(function() {
                    katex.render(attrs.topMenu, element.find(".handle")[0]);
                });

                let el = element.find(".top-menu");

                allMenus.push(el[0]);

                scope.menuPos = "m" + allMenus.length;

                let closing = false;
                let closeMenus = function() {
                    if (el.hasClass("active-menu") && !closing) {
                        console.debug("CLOSE ALL");
                        closing = true;
                        $(allMenus).stop(true).animate({
                            "bottom": scope.equationEditorElement.height()
                        }, {
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

                let toggleThisMenu = function() {
                    if (el.hasClass("active-menu")) {
                        closeMenus();
                    } else {
                        $(allMenus).removeClass("foreground");
                        $(allMenus).removeClass("active-menu");
                        el.addClass("foreground");
                        el.addClass("active-menu");
                        let activeMenuHeight = el.height();
                        $(allMenus).stop(true).animate({
                            "bottom": scope.equationEditorElement.height() - activeMenuHeight
                        }, 200);
                        scope.$emit("menuOpened");
                        scope.$apply();
                    }
                };

                let resizeMenu = function() {
                    if (el.hasClass("active-menu")) {
                        let activeMenuHeight = el.height();
                        $(allMenus).stop(true).animate({
                            "bottom": scope.equationEditorElement.height() - activeMenuHeight
                        }, 200);
                    }
                };

                scope.clickHandle = function(event) {
                    toggleThisMenu();
                    event.stopPropagation();
                    event.preventDefault();
                };

                scope.clickContent = function(event) {
                    event.stopPropagation();
                    event.preventDefault();
                };

                element.on("touchstarted mousedown", ".handle-menu-touch-content", scope.clickContent);
                element.on("touchstarted mousedown", ".handle-menu-touch", scope.clickHandle);

                scope.$on("closeMenus", closeMenus);
                scope.$on("resizeMenu", resizeMenu);

                // if (allMenus.length == 2) {
                //    $timeout(toggleThisMenu, 200);
                //}

                element.on("keydown", function(event) {
                    event.stopPropagation();
                });

                if (attrs.topMenu == "123") {
                    // Only do this for number entry menu.
                    scope.$on("editNumber", function(_event, _next) {
                        toggleThisMenu();
                    })
                }

                scope.$on("$destroy", function() {
                    allMenus.splice(allMenus.indexOf(el[0]), 1);
                })
            },
        };
    }];
});
