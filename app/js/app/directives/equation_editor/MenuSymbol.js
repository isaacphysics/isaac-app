
define(["/partials/equation_editor/menu_symbol.html"], function(templateUrl) {

    return [function() {

        return {
            scope: {
                symbol: "=",
                mousePressed: "=",
            },
            restrict: "A",
            templateUrl: templateUrl,
            link: function(scope, element, attrs) {
                scope.name = "MENUSYMBOL"

                scope.$watch("symbol.menu.label", function(newLabel) {
                    if (newLabel && scope.symbol.menu.texLabel)
                        katex.render(scope.symbol.menu.label, element.find(".symbol-label")[0]);
                });

                scope.dragging = false;

                let editor = $(".equation-editor");

                let grabLocalX, grabLocalY;

                let lastPageX = 0;
                let lastPageY = 0;
                let grab = function(pageX, pageY, e) {

                    scope.dragging = true;

                    element.addClass("dragging");
                    scope.$apply();

                    let offset = element.offset();
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



                let drag = function(pageX, pageY) {
                    let pageScroll = editor.offset().top;

                    pageX = pageX || lastPageX;
                    pageY = pageY || lastPageY;

                    if ("lockVertical" in attrs)
                        pageY = lastPageY;

                    let requiredPageLeft = pageX - grabLocalX;
                    let requiredPageTop = pageY - grabLocalY;

                    let offset = element.offset();

                    let pX = pageX - offset.top;
                    let pY = pageY - offset.left;

                    // Tell our parents that we've moved.

                    scope.$emit("symbolDrag", scope.symbol, requiredPageLeft, requiredPageTop - pageScroll, pageX - lastPageX, pageY - pageScroll - lastPageY, pageX, pageY - pageScroll);
                    lastPageX = pageX;
                    lastPageY = pageY;

                    // Parent may have moved. Recompute our position based on (potentially) new origin.
                    element.css("left", 0);
                    element.css("top", 0);
                    let originOffset = element.offset();

                    element.css("left", requiredPageLeft - originOffset.left);
                    element.css("top", requiredPageTop - originOffset.top);

                }

                let drop = function(pageX, pageY, e) {

                    let token = element.find(".symbol-token");
                    let tokenOffset = token.offset();

                    element.css("left", 0);
                    element.css("top", 0);

                    // fixes bug involving being able to drag symbols outside of the visible canvas,
                    let width = $(window).width();
                    let height = $(window).height();
                    let offCanvas = (e.clientX*100/width < 5 || e.clientY*100/height < 10) ? true : false;

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

                let mousedown = function(e) {
                    grab(e.pageX, e.pageY, e);
                    e.stopPropagation();
                    e.preventDefault();
                }

                let mouseup = function(e) {
                  if(scope.firstX == e.pageX && scope.firstY == e.pageY) {
                    let clicked = true;
                    scope.$emit("clicked", clicked);
                    let num = attrs.value;
                    scope.$emit("numberClicked", num);
                  }
                      drop(e.pageX, e.pageY, e);
                      clicked = false;
                      scope.$emit("clicked", clicked);
                      e.stopPropagation();
                      e.preventDefault();
                }

                let mousemove = function(e) {
                    drag(e.pageX, e.pageY);

                    e.stopPropagation();
                    e.preventDefault();
                }

                let touchstart = function(e) {
                    let ts = e.originalEvent.touches;
                    console.log(ts);
                    scope.mobileX = ts[0].pageX;
                    scope.mobileY = ts[0].pageY;
                    grab(ts[0].pageX, ts[0].pageY, e);

                    e.stopPropagation();
                    e.preventDefault();
                }

                let touchend = function(e) {
                  let ts = e.originalEvent.changedTouches;
                    console.debug(scope.mobileX + " " + ts[0].pageX);

                    console.log(ts, e.originalEvent);


                    if (scope.mobileX == ts[0].pageX && scope.mobileY == ts[0].pageY) {
                        let clicked = true;
                        scope.$emit("clicked", clicked);
                        console.debug("Registered as click");
                        let num = attrs.value;
                        scope.$emit("numberClicked", num);
                    }

                    drop(ts[0].pageX, ts[0].pageY, e);
                    clicked = false;
                    scope.$emit("clicked", clicked);
                    e.stopPropagation();
                    e.preventDefault();
                }

                let touchmove = function(e) {
                    let ts = e.originalEvent.touches;
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
