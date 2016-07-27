define([], function() {

    return [function() {

        return {
            scope: {
                symbol: "=",
                mousePressed: "=",
            },
            restrict: "A",
            templateUrl: "/partials/equation_editor/menu_symbol.html",
            link: function(scope, element, attrs) {
                scope.name = "MENUSYMBOL"

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

                    scope.firstX = pageX;
                    scope.firstY = pageY;

                    $("body").on("mouseup", mouseup);
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

                    // fixes bug involving being able to drag symbols outside of the visible canvas,
                    var width = $(window).width();
                    var height = $(window).height();
                    var offCanvas = (e.clientX*100/width < 5 || e.clientY*100/height < 10) ? true : false;

                    // This ensures new symbols can be selected.
                    scope.$emit("symbolDrop", scope.symbol, pageX, pageY, pageX, pageY, offCanvas);

                    // This drags the hexagons around.
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
                  console.debug(scope.firstX + " " + e.pageX);
                  if(scope.firstX == e.pageX && scope.firstY == e.pageY) {
                    var clicked = true;
                    scope.$emit("clicked", clicked);
                    console.debug("Registered as click");
                    var num = attrs.value;
                    scope.$emit("numberClicked", num);
                  }
                      drop(e.pageX, e.pageY, e);
                      clicked = false;
                      scope.$emit("clicked", clicked);
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
                    console.log(ts);
                    scope.mobileX = ts[0].pageX;
                    scope.mobileY = ts[0].pageY;
                    grab(ts[0].pageX, ts[0].pageY, e);

                    e.stopPropagation();
                    e.preventDefault();
                }

                var touchend = function(e) {
                  var ts = e.originalEvent.changedTouches;
                    console.debug(scope.mobileX + " " + ts[0].pageX);

                    console.log(ts, e.originalEvent);


                    if (scope.mobileX == ts[0].pageX && scope.mobileY == ts[0].pageY) {
                        var clicked = true;
                        scope.$emit("clicked", clicked);
                        console.debug("Registered as click");
                        var num = attrs.value;
                        scope.$emit("numberClicked", num);
                    }

                    drop(ts[0].pageX, ts[0].pageY, e);
                    clicked = false;
                    scope.$emit("clicked", clicked);
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
