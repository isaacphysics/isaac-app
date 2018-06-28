
define(["/partials/equation_editor/menu_symbol.html"], function(templateUrl) {

    return [function() {

        return {
            scope: {
                symbol: "=",
            },
            restrict: "A",
            templateUrl: templateUrl,
            link: function(scope, element, attrs) {
                scope.name="MENUSYMBOL"

                scope.$watch("symbol.menu.label", function(newLabel) {
                    if (newLabel && scope.symbol.menu.texLabel)
                        katex.render(scope.symbol.menu.label, element.find(".symbol-label")[0]);
                });

                scope.dragging = false;

                var editor = $(".equation-editor");

                var grabLocalX, grabLocalY;

                var lastPageX = 0;
                var lastPageY = 0;
                var grab = function(pageX, pageY, e) {
                    scope.dragging = true;
                    element.addClass("dragging");
                    scope.$apply();

                    var offset = element.offset();
                    grabLocalX = pageX - offset.left;
                    grabLocalY = pageY - offset.top;

                    lastPageX = pageX;
                    lastPageY = pageY;

                    $("body").on("mouseup", mouseup)
                    $("body").on("mousemove", mousemove);
                    $("body").on("touchend", touchend);
                    $("body").on("touchmove", touchmove);
                }

                var drag = function(pageX, pageY) {
                    var pageScroll = editor.offset().top;

                    pageX = pageX || lastPageX;
                    pageY = pageY || lastPageY;

                    if ("lockVertical" in attrs)
                        pageY = lastPageY;

                    var requiredPageLeft = pageX - grabLocalX;
                    var requiredPageTop = pageY - grabLocalY;

                    var offset = element.offset();

                    var pX = pageX - offset.top;
                    var pY = pageY - offset.left;

                    // Tell our parents that we've moved.
                    scope.$emit("symbolDrag", scope.symbol, requiredPageLeft, requiredPageTop - pageScroll, pageX - lastPageX, pageY - pageScroll - lastPageY, pageX, pageY - pageScroll);
                    lastPageX = pageX;
                    lastPageY = pageY;

                    // Parent may have moved. Recompute our position based on (potentially) new origin.
                    element.css("left", 0);
                    element.css("top", 0);
                    var originOffset = element.offset();

                    element.css("left", requiredPageLeft - originOffset.left);
                    element.css("top", requiredPageTop - originOffset.top);

                }

                var drop = function(pageX, pageY, e) {

                    var token = element.find(".symbol-token");
                    var tokenOffset = token.offset();

                    element.css("left", 0);
                    element.css("top", 0);
                    
                    scope.$emit("symbolDrop", scope.symbol, pageX, pageY, pageX, pageY);
                    $("body").off("mouseup", mouseup);
                    $("body").off("mousemove", mousemove);
                    $("body").off("touchend", touchend);
                    $("body").off("touchmove", touchmove);

                    scope.dragging = false;
                    element.removeClass("dragging");
                    scope.$apply();
                }

                var mousedown = function(e) {
                    grab(e.pageX, e.pageY, e);

                    e.stopPropagation();
                    e.preventDefault();
                }

                var mouseup = function(e) {
                    drop(e.pageX, e.pageY, e);

                    e.stopPropagation();
                    e.preventDefault();
                }

                var mousemove = function(e) {
                    drag(e.pageX, e.pageY);

                    e.stopPropagation();
                    e.preventDefault();
                }

                var touchstart = function(e) {
                    var ts = e.originalEvent.touches;
                    grab(ts[0].pageX, ts[0].pageY, e);

                    e.stopPropagation();
                    e.preventDefault();
                }

                var touchend = function(e) {
                    var ts = e.originalEvent.changedTouches;
                    drop(ts[0].pageX, ts[0].pageY, e);

                    e.stopPropagation();
                    e.preventDefault();
                }

                var touchmove = function(e) {
                    var ts = e.originalEvent.touches;
                    drag(ts[0].pageX, ts[0].pageY, e);

                    e.stopPropagation();
                    e.preventDefault();
                }

                element.on("mousedown", mousedown);
                element.on("touchstart", touchstart);

                scope.$on("menuMoved", function() {
                    if (scope.dragging)
                        drag();
                })
            },
        };
    }];
});