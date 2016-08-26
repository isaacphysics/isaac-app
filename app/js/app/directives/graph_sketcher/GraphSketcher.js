
"use strict";
define(function(require) {
    return ["$timeout", "$rootScope", "api", function($timeout, $rootScope, api) {
        // we require instances of bezier, func and sampler to enable access to external methods.
        var b = require('lib/graph_sketcher/bezier.js');
        var f = require('lib/graph_sketcher/func.js');
        var s = require('lib/graph_sketcher/sampler.js');

        return {
            scope: true,
            restrict: "A",
            templateUrl: "/partials/graph_sketcher/graph_sketcher.html",
            link: function(scope, element, attrs) {

                element.on("touchstart touchmove", "canvas", function(e) {
                    e.preventDefault();
                });

                scope.title = "Sketcher";
                scope.canvasOffset = {};
                scope.draggingNewSymbol = false;
                scope.equationEditorElement = element;

                var colorSelect = element.find(".color-select")[0];

                scope.submit = function() {
                    $("#graphModal").foundation("reveal", "close");
                };

                scope.logOnClose = function(event) {
                    // This ought to catch people who navigate away without closing the editor!
                    if (scope.log != null) {
                        scope.log.actions.push({
                            event: "NAVIGATE_AWAY",
                            timestamp: Date.now()
                        });
                        api.logger.log(scope.log);
                    }
                };

                scope.newEditorState = function(s) {

                    scope.state = s;

                    // console.log("New state:", s);

                    var rp = $(".result-preview>span");

                    rp.empty();

                    // this renders the result in the preview box in the bottom right corner of the eqn editor

                    scope.$emit("historyCheckpoint");
                }

                scope.sketch = function(p) {

                    // canvas coefficients
                    var canvasHeight = window.innerHeight;
                    var canvasWidth = window.innerWidth;

                    var GRID_WIDTH = 60,
                        CURVE_STRKWEIGHT = 2,
                        PADDING = 0.025 * canvasWidth,
                        DOT_LINE_STEP = 5,
                        MOUSE_DETECT_RADIUS = 10;

                    var CURVE_COLORS = [[93,165,218], [250,164,58], [96,189,104], [241,124,176], [241,88,84], [178,118,178]],
                        KNOT_COLOR = [77,77,77],
                        DOT_LINE_COLOR = [123],
                        MOVE_LINE_COLOR = [135],
                        MOVE_SYMBOL_COLOR = [151],
                        KNOT_DETECT_COLOR = [0];

                    // action recorder
                    var action = undefined,
                        isMouseDragged,
                        releasePt,
                        drawMode,
                        key = undefined;
                        
                    var freeSymbols = [],
                        curves = [];

                    // for drawing curve
                    var drawnPts = [],
                        drawnColorIdx,
                        lineStart,
                        lineEnd;

                    var prevMousePt;

                    // for moving and stretching curve
                    var movedCurveIdx,
                        stretchMode;

                    // for moving symbols
                    var movedSymbol,
                        bindedKnot,
                        symbolType;

                    var clickedKnot = null,
                        clickedCurveIdx;

                    // for redo and undo
                    var checkPoint,
                        checkPointsUndo = [],
                        checkPointsRedo = [];

                    function initiateFreeSymbols() {
                        freeSymbols = [];
                        freeSymbols.push(f.createSymbol('A'));
                        freeSymbols.push(f.createSymbol('B'));
                        freeSymbols.push(f.createSymbol('C'));
                        freeSymbols.push(f.createSymbol('D'));
                        freeSymbols.push(f.createSymbol('E'));
                        
                        refreshFreeSymbols();
                    }

                    function refreshFreeSymbols() {
                        var start = 15,
                            separation = 30;

                        for (var i = 0; i < freeSymbols.length; i++) {
                            var symbol = freeSymbols[i];
                            symbol.x = start + i * separation;
                            symbol.y = start;
                        }
                    }

                    // run in the beginning by p5 library
                    function setup() {

                        p.createCanvas(canvasWidth, canvasHeight);
                        p.noLoop();
                        p.cursor(p.ARROW);


                        initiateFreeSymbols();
                        reDraw();

                        // drawButton();
                    }

                    function reDraw() {
                        drawBackground();
                        drawCurves(curves);
                        // refreshFreeSymbols();
                        drawSymbols(freeSymbols);
                        
                        drawKnot3(clickedKnot);
                        drawStretchBox(clickedCurveIdx);
                    }

                    function drawBackground() {

                        function drawHorizontalAxis() {
                            p.push();

                            p.strokeWeight(CURVE_STRKWEIGHT);
                            p.strokeJoin(p.ROUND);
                            p.stroke(0);
                            p.noFill();

                            var leftMargin = PADDING;
                            var rightMargin = canvasWidth - PADDING;

                            p.beginShape();
                            p.vertex(leftMargin, canvasHeight/2);
                            p.vertex(rightMargin, canvasHeight / 2);
                            p.vertex(rightMargin - 10, canvasHeight / 2 - 5);
                            p.vertex(rightMargin, canvasHeight / 2);
                            p.vertex(rightMargin - 10, canvasHeight / 2 + 5);
                            p.endShape();

                            p.pop();
                        }

                        function drawVerticalAxis() {
                            p.push();

                            p.strokeWeight(CURVE_STRKWEIGHT);
                            p.strokeJoin(p.ROUND);
                            p.stroke(0);
                            p.noFill();

                            var upMargin = PADDING;
                            var bottomMargin = canvasHeight - PADDING;

                            p.beginShape();
                            p.vertex(canvasWidth/2, bottomMargin);
                            p.vertex(canvasWidth/2, upMargin);
                            p.vertex(canvasWidth/2 - 5, upMargin + 10);
                            p.vertex(canvasWidth/2, upMargin);
                            p.vertex(canvasWidth/2 + 5, upMargin + 10);
                            p.endShape();

                            p.pop();
                        }

                        function drawGrid() {
                            p.push();

                            p.noFill();
                            p.strokeWeight(CURVE_STRKWEIGHT);
                            p.strokeJoin(p.ROUND);
                            p.stroke(240);

                            p.push();
                            p.translate(0, canvasHeight / 2);
                            var num = canvasHeight / (GRID_WIDTH * 2);
                            for (var i = 0; i < num; i++) {
                                p.line(0, -i*GRID_WIDTH, canvasWidth, -i*GRID_WIDTH);
                                p.line(0, i*GRID_WIDTH, canvasWidth, i*GRID_WIDTH);
                            }
                            p.pop();

                            p.push();
                            p.translate(canvasWidth / 2, 0);
                            var num = canvasWidth / (GRID_WIDTH * 2);
                            for (var i = 0; i < num; i++) {
                                p.line(-i*GRID_WIDTH, 0, -i*GRID_WIDTH, canvasHeight);
                                p.line(i*GRID_WIDTH, 0, i*GRID_WIDTH, canvasHeight);
                            }
                            p.pop();

                            p.pop();
                        }

                        function drawLabel() {
                            p.push();

                            p.textSize(16);
                            p.stroke(0);
                            p.strokeWeight(0.5);
                            p.fill(0);

                            p.text("O", canvasWidth/2 - 15, canvasHeight/2 + 15);
                            p.text("x", canvasWidth - PADDING, canvasHeight/2 + 15);
                            p.text("y", canvasWidth/2 + 5, PADDING);

                            p.pop();
                        }

                        // function drawScale() {
                        //  var len = 3;

                        //  push();
                        //  p.strokeWeight(1);
                        //  p.stroke(0);
                        //  textSize(12);

                        //  push();
                        //  translate(0, canvasHeight / 2);
                        //  var num = canvasHeight / (GRID_WIDTH * 2);
                        //  for (var i = 1; i < num; i++) {
                        //      line(canvasWidth/2 -len, -i*GRID_WIDTH, canvasWidth/2 + len, -i*GRID_WIDTH);
                        //      line(canvasWidth/2 - len, i*GRID_WIDTH, canvasWidth/2 + len, i*GRID_WIDTH);
                        //      text(i, canvasWidth/2 + 5, -i * GRID_WIDTH + 5);
                        //      text(-i, canvasWidth/2 + 5, i * GRID_WIDTH + 5);
                        //  }
                        //  pop();

                        //  push();
                        //  translate(canvasWidth / 2, 0);
                        //  var num = canvasWidth / (GRID_WIDTH * 2);
                        //  for (var i = 1; i < num; i++) {
                        //      line(-i*GRID_WIDTH, canvasHeight/2 - len, -i*GRID_WIDTH, canvasHeight / 2 + len);
                        //      line(i*GRID_WIDTH, canvasHeight/2 - len, i*GRID_WIDTH, canvasHeight /2 + len);
                        //      text(-i, -i * GRID_WIDTH - 5, canvasHeight / 2 + 15);
                        //      text(i, i * GRID_WIDTH - 5, canvasHeight / 2 + 15);
                        //  }
                        //  pop();

                        //  pop();
                        // }



                        // p5.clear, p5.background
                        p.clear();
                        p.background(255);

                        drawGrid();
                        drawHorizontalAxis();
                        drawVerticalAxis();
                        drawLabel();
                    }

                    // given a set of points, draw the corresponding curve.
                    function drawCurve(curve, color) {
                        if (color == undefined) {
                            color = CURVE_COLORS[curve.colorIdx];
                        }

                        p.push();
                        p.stroke(color);
                        p.strokeWeight(CURVE_STRKWEIGHT);

                        var pts = curve.pts;
                        for (var i = 1; i < pts.length; i++) {
                            p.line(pts[i-1].x, pts[i-1].y, pts[i].x, pts[i].y);
                        }

                        p.pop();

                        // draw x intercepts, y intercepts and turning points
                        drawKnots(curve['interX']);
                        drawKnots(curve['interY']);
                        drawKnots2(curve['maxima']);
                        drawKnots2(curve['minima']);
                    }

                    function drawCurves(curves, color) {
                        for (var i = 0; i < curves.length; i++) {
                            drawCurve(curves[i], color);
                        }
                    }


                    // given a set of points, draw the corresponding points (knots).
                    function drawKnot(knot, color) {
                        if (color == undefined) {
                            color = KNOT_COLOR;
                        }

                        if (knot.symbol != undefined) {
                            drawSymbol(knot.symbol);
                        } else {
                            p.push();
                            p.noFill();
                            p.stroke(color);
                            p.strokeWeight(1.5);
                            p.line(knot.x - 3, knot.y - 3, knot.x + 3, knot.y + 3);
                            p.line(knot.x + 3, knot.y - 3, knot.x - 3, knot.y + 3);
                            p.pop();
                        }
                    }

                    function drawKnots(knots, color) {
                        for (var i = 0; i < knots.length; i++) {
                            drawKnot(knots[i], color);
                        }
                    }

                    function drawKnot2(knot) {
                        drawKnot(knot);

                        if (knot.xSymbol != undefined) {
                            drawVerticalDotLine(knot.x, knot.y, canvasHeight/2);
                            drawSymbol(knot.xSymbol);
                        }

                        if (knot.ySymbol != undefined) {
                            drawHorizontalDotLine(knot.y, knot.x, canvasWidth/2);
                            drawSymbol(knot.ySymbol);
                        }
                    }

                    function drawKnots2(knots) {
                        for (var i = 0; i < knots.length; i++) {
                            drawKnot2(knots[i]);
                        }
                    }

                    function drawKnot3(knot) {
                        if (knot == null) {
                            return;
                        }

                        drawVerticalDotLine(knot.x, knot.y, canvasHeight/2);
                        drawHorizontalDotLine(knot.y, knot.x, canvasWidth/2);

                        if (knot.xSymbol != undefined) {
                            drawSymbol(knot.xSymbol);
                        } else {
                            drawKnot(f.createPoint(knot.x, canvasHeight/2));
                        }

                        if (knot.ySymbol != undefined) {
                            drawSymbol(knot.ySymbol);
                        } else {
                            drawKnot(f.createPoint(canvasWidth/2, knot.y));
                        }
                    }

                    function drawKnotDetect(knot) {
                        p.push();
                        p.noFill();
                        p.stroke(KNOT_DETECT_COLOR);
                        p.strokeWeight(2);
                        p.line(knot.x - 5, knot.y - 5, knot.x + 5, knot.y + 5);
                        p.line(knot.x + 5, knot.y - 5, knot.x - 5, knot.y + 5);
                        p.pop();
                    }

                    // draw symbols, e.g. "A", "B".
                    function drawSymbol(symbol, color) {
                        if (color == undefined) {
                            color = KNOT_COLOR;
                        }

                        p.push();

                        p.stroke(color);
                        p.strokeWeight(1.5);
                        p.noFill();
                        p.line(symbol.x - 3, symbol.y - 3, symbol.x + 3, symbol.y + 3);
                        p.line(symbol.x + 3, symbol.y - 3, symbol.x - 3, symbol.y + 3);

                        p.stroke(0);
                        p.strokeWeight(0.5);
                        p.fill(0);
                        p.textSize(16);
                        p.text(symbol.text, symbol.x - 5, symbol.y + 20);

                        p.pop();
                    }

                    function drawSymbols(symbols, color) {
                        for (var i = 0; i < symbols.length; i++) {
                            drawSymbol(symbols[i], color);
                        }
                    }

                    function drawVerticalDotLine(x, begin, end) {
                        if (x < 0 || x > canvasWidth) {
                            return;
                        }

                        if (begin > end) {
                            var tmp = begin;
                            begin = end;
                            end = tmp;
                        }

                        p.push();
                        p.stroke(DOT_LINE_COLOR);
                        p.strokeWeight(CURVE_STRKWEIGHT);

                        var step = DOT_LINE_STEP;
                        var toDraw = true;
                        var y = begin;
                        while (y + step < end) {
                            if (toDraw) {
                                p.line(x, y, x, y+step);
                            }
                            y += step;
                            toDraw = !toDraw;
                        }
                        if (toDraw) {
                            p.line(x, y, x, end);
                        }

                        p.pop();
                    }

                    function drawHorizontalDotLine(y, begin, end) {
                        if (y < 0 || y > canvasHeight) {
                            return;
                        }

                        if (begin > end) {
                            var tmp = begin;
                            begin = end;
                            end = tmp;
                        }

                        p.push();
                        p.stroke(DOT_LINE_COLOR);
                        p.strokeWeight(CURVE_STRKWEIGHT);

                        var step = DOT_LINE_STEP;
                        var toDraw = true;
                        var x = begin;
                        while (x + step < end) {
                            if (toDraw) {
                                p.line(x, y, x+step, y);
                            }
                            x += step;
                            toDraw = !toDraw;
                        }
                        if (toDraw) {
                            p.line(x, y, end, y);
                        }

                        p.pop();
                    }


                    function drawStretchBox(idx) {
                        if (idx == undefined) {
                            return;
                        }

                        var curve = curves[idx];

                        var pts = curve.pts;

                        var minX = curve.minX;
                        var maxX = curve.maxX;
                        var minY = curve.minY;
                        var maxY = curve.maxY;

                        p.push();
                        p.stroke(DOT_LINE_COLOR);
                        p.strokeWeight(0.5);
                        p.line(minX, minY, maxX, minY);
                        p.line(maxX, minY, maxX, maxY);
                        p.line(maxX, maxY, minX, maxY);
                        p.line(minX, maxY, minX, minY);

                        p.fill(255);
                        p.rect(minX - 4, minY - 4, 8, 8);
                        p.rect(maxX - 4, minY - 4, 8, 8);
                        p.rect(minX - 4, maxY - 4, 8, 8);
                        p.rect(maxX - 4, maxY - 4, 8, 8);
                        p.triangle((minX + maxX)/2 - 5, minY - 2, (minX + maxX)/2 + 5, minY - 2, (minX + maxX)/2, minY - 7);
                        p.triangle((minX + maxX)/2 - 5, maxY + 2, (minX + maxX)/2 + 5, maxY + 2, (minX + maxX)/2, maxY + 7);
                        p.triangle(minX - 2, (minY + maxY) / 2 - 5, minX - 2, (minY + maxY) / 2 + 5, minX - 7, (minY + maxY) / 2);
                        p.triangle(maxX + 2, (minY + maxY) / 2 - 5, maxX + 2, (minY + maxY) / 2 + 5, maxX + 7, (minY + maxY) / 2); 
                        p.pop();
                    }


                    function findInterceptX(pts) {
                        if (pts.length == 0) return [];

                        var intercepts = [];

                        if (pts[0].y == canvasHeight/2) intercepts.push(pts[0]);
                        for (var i = 1; i < pts.length; i++) {
                            if (pts[i].y == canvasHeight/2) {
                                intercepts.push(f.createPoint(pts[i].x, pts[i].y));
                                continue;
                            }

                            if ((pts[i-1].y - canvasHeight/2) * (pts[i].y - canvasHeight/2) < 0) {
                                var dx = pts[i].x - pts[i-1].x;
                                var dy = pts[i].y - pts[i-1].y;
                                var grad = dy/dx;
                                var esti = pts[i-1].x + (1 / grad) * (canvasHeight/2 - pts[i-1].y);
                                intercepts.push(f.createPoint(esti, canvasHeight/2));
                            }
                        }

                        return intercepts;
                    }

                    function findInterceptY(pts) {
                        if (pts.length == 0) return [];

                        var intercepts = [];

                        if (pts[0].x == canvasWidth/2) intercepts.push(pts[0]);
                        for (var i = 1; i < pts.length; i++) {
                            if (pts[i].x == canvasWidth/2) {
                                intercepts.push(f.createPoint(pts[i].x, pts[i].y));
                                continue;
                            }

                            if ((pts[i-1].x - canvasWidth/2) * (pts[i].x - canvasWidth/2) < 0) {
                                var dx = pts[i].x - pts[i-1].x;
                                var dy = pts[i].y - pts[i-1].y;
                                var grad = dy/dx;
                                var esti = pts[i-1].y + grad * (canvasWidth/2 - pts[i-1].x);
                                intercepts.push(f.createPoint(canvasWidth/2, esti));
                            }
                        }

                        return intercepts;
                    }

                    function findTurnPts(pts, mode) {
                        if (pts.length == 0) {
                          return [];
                        }

                        var grad = [];
                        for (var i = 0; i < pts.length - 1; i++) {
                            var dx = pts[i+1].x - pts[i].x;
                            var dy = pts[i+1].y - pts[i].y;
                            grad.push(dy/dx);
                        }

                        var turnPts = [];

                        for (var i = 1; i < grad.length; i++) {
                            if (grad[i-1] != NaN && grad[i] != NaN) {
                                if (grad[i] * grad[i-1] < 0 && (pts[i].x - pts[i-1].x) * (pts[i+1].x - pts[i].x) > 0) {

                                    var limit = 0.3;

                                    var l = i - 2;
                                    while (l >= 0 && Math.abs(grad[l]) < limit && Math.abs(grad[l]) > Math.abs(grad[l+1]) && grad[l] * grad[l+1] >= 0) {
                                        l--;
                                    }
                                    if (!(Math.abs(grad[l]) >= limit)) {
                                        continue;
                                    }

                                    var r = i + 1;
                                    while (r < grad.length && Math.abs(grad[r]) < limit && Math.abs(grad[r]) > Math.abs(grad[r-1]) && grad[r] * grad[r-1] >= 0) {
                                        r++;
                                    }
                                    if (!(Math.abs(grad[r]) >= limit)) {
                                        continue;
                                    }

                                    var acc1 = grad[l];
                                    var acc2 = grad[r];

                                    if (mode == 'maxima') {
                                        if ((pts[i].x > pts[i-1].x && acc1 < 0 && acc2 > 0) || (pts[i].x < pts[i-1].x && acc1 > 0 && acc2 < 0)) {
                                            turnPts.push(f.createPoint(pts[i].x, pts[i].y));
                                        } 
                                    } else {
                                        if ((pts[i].x > pts[i-1].x && acc1 > 0 && acc2 < 0) || (pts[i].x < pts[i-1].x && acc1 < 0 && acc2 > 0)) {
                                            turnPts.push(f.createPoint(pts[i].x, pts[i].y));
                                        } 
                                    }


                                }
                            }
                        }

                        return turnPts;
                    }


                    function getMousePt(e) {
                        var x = e.clientX - 5;
                        var y = e.clientY - 5;
                        return (f.createPoint(x, y));
                    }

                    function isOverSymbol(pt, symbol) {
                        if (symbol == undefined) {
                            return false;
                        }
                        var left = symbol.x - 5;
                        var right = symbol.x + 5;
                        var top = symbol.y - 5;
                        var bottom = symbol.y + 20 + 5;
                        return (pt.x > left && pt.x < right && pt.y > top && pt.y < bottom);
                    }

                    function isOverButton(pt, button) {
                        if (button.position() == undefined) {
                            return false;
                        }

                        var left = button.position().left;
                        var top = button.position().top;
                        var width = button.width();
                        var height = button.height();
                        return (pt.x > left && pt.x < left + width && pt.y > top && pt.y < top + height);
                    }


                    function isActive(pt) {

                        if (!(pt.x > 0 && pt.x < canvasWidth && pt.y > 0 && pt.y < canvasHeight)) {
                            return false;
                        }

                        var buttons = [];
                        buttons.push(element.find(".redo"));
                        buttons.push(element.find(".undo"));
                        buttons.push(element.find(".trash-button"));
                        buttons.push(element.find(".submit"));
                        for (var i = 0; i < buttons.length; i++) {
                            if (isOverButton(pt, buttons[i])) {
                                return false;
                            }
                        }

                        return true;
                    }

                    // given a curve, translate the curve
                    function transCurve(curve, dx, dy) {
                        var pts = curve.pts;

                        curve.minX += dx;
                        curve.maxX += dx;
                        curve.minY += dy;
                        curve.maxY += dy;

                        for (var i = 0; i < pts.length; i++) {
                            pts[i].x += dx;
                            pts[i].y += dy;
                        }

                        function moveTurnPts(knots) {
                            for (var i = 0; i < knots.length; i++) {
                                var knot = knots[i];

                                knot.x += dx;
                                knot.y += dy;

                                if (knot.symbol != undefined) {
                                    knot.symbol.x += dx;
                                    knot.symbol.y += dy;
                                }

                                if (knot.xSymbol != undefined) {
                                    knot.xSymbol.x = knot.x;
                                }

                                if (knot.ySymbol != undefined) {
                                    knot.ySymbol.y = knot.y;
                                }
                            }
                        }

                        var maxima = curve.maxima;
                        moveTurnPts(maxima);

                        var minima = curve.minima;
                        moveTurnPts(minima);


                        function moveInter(inter, newInter) {
                            for (var i = 0; i < inter.length; i++) {
                                if (inter[i].symbol != undefined) {
                                    var symbol = inter[i].symbol;

                                    var found = false,
                                        min = 50,
                                        knot;
                                    for (var j = 0; j < newInter.length; j++) {
                                        if (f.getDist(inter[i], newInter[j]) < min) {
                                            min = f.getDist(inter[i], newInter[j]);
                                            knot = newInter[j];
                                            found = true;
                                        }
                                    }

                                    if (found) {
                                        symbol.x = knot.x;
                                        symbol.y = knot.y;
                                        knot.symbol = symbol;
                                    } else {
                                        freeSymbols.push(symbol);
                                    }
                                }
                            }
                            return newInter;
                        }

                        var interX = curve.interX,
                            newInterX = findInterceptX(pts);
                        curve.interX = moveInter(interX, newInterX);


                        var interY = curve.interY,
                            newInterY = findInterceptY(pts);
                        curve.interY = moveInter(interY, newInterY);

                        return;
                    }

                    function stretchCurve(c, orx, ory, nrx, nry, baseX, baseY) {

                        function stretch(pt) {
                            var nx = (pt.x - baseX) / orx;
                            var ny = (pt.y - baseY) / ory;
                            pt.x = nx * nrx + baseX;
                            pt.y = ny * nry + baseY;
                        }

                        var pts = c.pts;
                        for (var j = 0; j < pts.length; j++) {
                            stretch(pts[j]);
                        }

                        function loop1(knots) {
                            for (var j = 0; j < knots.length; j++) {
                                var knot = knots[j];

                                stretch(knot);

                                if (knot.symbol != undefined) {
                                    stretch(knot.symbol);
                                }

                                if (knot.xSymbol != undefined) {
                                    stretch(knot.xSymbol);
                                }

                                if (knot.ySymbol != undefined) {
                                    stretch(knot.ySymbol);
                                }
                            }
                        }


                        var maxima = c.maxima;
                        loop1(maxima);

                        var minima = c.minima;
                        loop1(minima);

                        function loop2(inter, newInter) {
                            for (var i = 0; i < inter.length; i++) {
                                if (inter[i].symbol != undefined) {
                                    var symbol = inter[i].symbol;

                                    var found = false,
                                        min = 50,
                                        knot;
                                    for (var j = 0; j < newInter.length; j++) {
                                        if (f.getDist(inter[i], newInter[j]) < min) {
                                            min = f.getDist(inter[i], newInter[j]);
                                            knot = newInter[j];
                                            found = true;
                                        }
                                    }

                                    if (found) {
                                        symbol.x = knot.x;
                                        symbol.y = knot.y;
                                        knot.symbol = symbol;
                                    } else {
                                        freeSymbols.push(symbol);
                                    }
                                }
                            }
                            return newInter;
                        }

                        var interX = c.interX,
                            newInterX = findInterceptX(pts);
                        c.interX = loop2(interX, newInterX);


                        var interY = c.interY,
                            newInterY = findInterceptY(pts);
                        c.interY = loop2(interY, newInterY);
                    }


                    function mouseMoved(e) {
                        var current = getMousePt(e);

                        // this funciton does not react if the mouse is over buttons or outside the canvas.
                        if (!isActive(current)) {
                            return;
                        }

                        var found = false;

                        if (!found) {
                            function loop(knots) {
                                if (found) {
                                    return;
                                }

                                for (var i = 0; i < knots.length; i++) {
                                    if (f.getDist(current, knots[i]) < MOUSE_DETECT_RADIUS) {
                                        p.cursor(p.HAND);
                                        drawKnotDetect(knots[i]);
                                        found = true;
                                        return;
                                    }
                                }
                            }

                            for (var i = 0; i < curves.length; i++) {
                                var maxima = curves[i]['maxima'];
                                loop(maxima);

                                var minima = curves[i]['minima'];
                                loop(minima);

                                if (found) {
                                    break;
                                }
                            }
                        }

                        if (!found) {
                            for (var i = 0; i < freeSymbols.length; i++) {
                                if (isOverSymbol(current, freeSymbols[i])) {
                                    p.cursor(p.MOVE);
                                    found = true;
                                    break;
                                }
                            }
                        }

                        if (!found) {
                            function loop1(knots) {
                                if (found) {
                                    return;
                                }

                                for (var j = 0; j < knots.length; j++) {
                                    var knot = knots[j];
                                    if (knot.symbol != undefined && isOverSymbol(current, knot.symbol)) {
                                        p.cursor(p.MOVE);
                                        found = true;
                                        return;
                                    }
                                }
                            }

                            function loop2(knots) {
                                if (found) {
                                    return;
                                }

                                loop1(knots);

                                for (var j = 0; j < knots.length; j++) {
                                    var knot = knots[j];
                                    if (knot.xSymbol != undefined && isOverSymbol(current, knot.xSymbol)) {
                                        p.cursor(p.MOVE);
                                        found = true;
                                        return;
                                    }
                                    if (knot.ySymbol != undefined && isOverSymbol(current, knot.ySymbol)) {
                                        p.cursor(p.MOVE);
                                        found = true;
                                        return;
                                    }

                                }
                            }


                            for (var i = 0; i < curves.length; i++) {
                                var interX = curves[i]['interX'];
                                loop1(interX);

                                var interY = curves[i]['interY'];
                                loop1(interY);

                                var maxima = curves[i]['maxima'];
                                loop2(maxima);

                                var minima = curves[i]['minima'];
                                loop2(minima);

                                if (found) {
                                    break;
                                }
                            }
                        }

                        if (!found) {
                            // for (var i = 0; i < curves.length; i++) {
                            //     var pts = curves[i].pts;
                            //     for (var j = 0; j < pts.length; j++) {
                            //         if (f.getDist(pts[j], current) < MOUSE_DETECT_RADIUS) {
                            //             found = true;
                            //             p.cursor(p.MOVE);
                            //             break;
                            //         }
                            //     }

                            //     if (found) {
                            //         break;
                            //     }
                            // }

                            if (clickedCurveIdx != undefined) {
                                function detect(x, y) {
                                    return (Math.abs(current.x - x) < 5 && Math.abs(current.y - y) < 5);
                                }

                                var c = curves[clickedCurveIdx];
                                if (current.x >= c.minX && current.x <= c.maxX && current.y >= c.minY && current.y <= c.maxY) {
                                    found = true;
                                    p.cursor(p.MOVE);
                                } else if (detect(c.minX, c.minY) || detect(c.maxX, c.minY) || detect(c.minX, c.maxY) || detect(c.maxX, c.maxY)) {
                                    found = true;
                                    p.cursor(p.MOVE);
                                } else if (detect((c.minX + c.maxX)/2, c.minY - 3) || detect((c.minX + c.maxX)/2, c.maxY + 3) 
                                    || detect(c.minX - 3, (c.minY + c.maxY)/2) || detect(c.maxX + 3, (c.minY + c.maxY)/2)) {
                                    found = true;
                                    p.cursor(p.MOVE);
                                }
                            }
                        }

                        if (!found) {
                            p.cursor(p.CROSS);
                            reDraw();
                        }
                    }


                    function mousePressed(e) {

                        isMouseDragged = false;
                        action = undefined;

                        movedSymbol = undefined;
                        bindedKnot = undefined;
                        symbolType = undefined;

                        drawnPts = [];
                        drawnColorIdx = undefined;

                        movedCurveIdx = undefined;
                        prevMousePt = undefined;

                        releasePt = undefined;


                        var current = getMousePt(e);
                        releasePt = current;

                        // this funciton does not react if the mouse is over buttons or outside the canvas.
                        if (!isActive(current)) {
                            return;
                        }


                        // record down current status, may be used later for undo.
                        checkPoint = {};
                        checkPoint.freeSymbolsJSON = JSON.stringify(freeSymbols);
                        checkPoint.curvesJSON = JSON.stringify(curves);


                        // check if it is to move a symbol
                        for (var i = 0; i < freeSymbols.length; i++) {
                            if (isOverSymbol(current, freeSymbols[i])) {
                                movedSymbol = freeSymbols[i];
                                freeSymbols.splice(i, 1);
                                prevMousePt = current;
                                action = "MOVE_SYMBOL";

                                // clickedCurveIdx = undefined;

                                return;
                            }
                        }

                        var found = false;
                        function detach1(knots) {
                            if (found) {
                                return;
                            }
                            for (var j = 0; j < knots.length; j++) {
                                var knot = knots[j];
                                if (knot.symbol != undefined && isOverSymbol(current, knot.symbol)) {
                                    movedSymbol = knot.symbol;
                                    knot.symbol = undefined;
                                    bindedKnot = knot;
                                    symbolType = 'symbol';
                                    found = true;
                                    break;
                                }
                            }
                        }

                        function detach2(knots) {
                            if (found) {
                                return;
                            }
                            detach1(knots);
                            for (var j = 0; j < knots.length; j++) {
                                var knot = knots[j];
                                if (knot.xSymbol != undefined && isOverSymbol(current, knot.xSymbol)) {
                                    movedSymbol = knot.xSymbol;
                                    knot.xSymbol = undefined;
                                    bindedKnot = knot;
                                    symbolType = 'xSymbol';
                                    found = true;
                                }
                                if (knot.ySymbol != undefined && isOverSymbol(current, knot.ySymbol)) {
                                    movedSymbol = knot.ySymbol;
                                    knot.ySymbol = undefined;
                                    bindedKnot = knot;
                                    symbolType = 'ySymbol';
                                    found = true;
                                }
                                if (found) {
                                    break;
                                }
                            }
                        }

                        for (var i = 0; i < curves.length; i++) {
                            var interX = curves[i]['interX'];
                            detach1(interX);

                            var interY = curves[i]['interY'];
                            detach1(interY);

                            var maxima = curves[i]['maxima'];
                            detach2(maxima);

                            var minima = curves[i]['minima'];
                            detach2(minima);

                            if (found) {
                                break;
                            }
                        }

                        if (found) {
                            action = "MOVE_SYMBOL";
                            prevMousePt = current;
                                
                            // clickedCurveIdx = undefined;

                            return;
                        }


                        // // check if it is moving curve.
                        // for (var i = 0; i < curves.length; i++) {
                        //     var pts = curves[i].pts;
                        //     for (var j = 0; j < pts.length; j++) {
                        //         if (f.getDist(pts[j], current) < MOUSE_DETECT_RADIUS) {
                        //             movedCurveIdx = i;
                        //             action = "MOVE_CURVE";
                        //             clickedKnot = null;
                        //             prevMousePt = current;
                        //             return;
                        //         }
                        //     }
                        // }

                        // check if stretching curve 
                        if (clickedCurveIdx != undefined) {
                            var c = curves[clickedCurveIdx];

                            function detect(x, y) {
                                return (Math.abs(current.x - x) < 5 && Math.abs(current.y - y) < 5);
                            }

                            if (detect(c.minX, c.minY) || detect(c.maxX, c.minY) || detect(c.minX, c.maxY) || detect(c.maxX, c.maxY)
                                    || detect((c.minX + c.maxX)/2, c.minY - 3) || detect((c.minX + c.maxX)/2, c.maxY + 3) 
                                    || detect(c.minX - 3, (c.minY + c.maxY)/2) || detect(c.maxX + 3, (c.minY + c.maxY)/2)) {

                                if (detect(c.minX, c.minY)) {
                                    stretchMode = 0;
                                } else if (detect(c.maxX, c.minY)) {
                                    stretchMode = 1;
                                } else if (detect(c.maxX, c.maxY)) {
                                    stretchMode = 2;
                                } else if (detect(c.minX, c.maxY)) {
                                    stretchMode = 3;
                                } else if (detect((c.minX + c.maxX)/2, c.minY - 3)) {
                                    stretchMode = 4;
                                } else if (detect((c.minX + c.maxX)/2, c.maxY + 3)) {
                                    stretchMode = 5;
                                } else if (detect(c.minX - 3, (c.minY + c.maxY)/2)) {
                                    stretchMode = 6;
                                } else {
                                    stretchMode = 7;
                                }


                                action = "STRETCH_CURVE";
                                clickedKnot = null;
                                prevMousePt = current;
                                return;
                            }
                        }


                        // check if it is moving curve
                        if (clickedCurveIdx != undefined) {
                            var c = curves[clickedCurveIdx];
                            if (current.x >= c.minX && current.x <= c.maxX && current.y >= c.minY && current.y <= c.maxY) {
                                movedCurveIdx = clickedCurveIdx;
                                action = "MOVE_CURVE";
                                clickedKnot = null;
                                prevMousePt = current;
                                return;   
                            }
                        }


                        // if it is drawing curve
                        if (curves.length < CURVE_COLORS.length) {
                            action = "DRAW_CURVE";


                            if (clickedCurveIdx != undefined || clickedKnot != null) {
                                clickedCurveIdx = undefined;
                                clickedKnot = null;
                                reDraw();
                            }


                            if (key === "Shift") {
                                lineStart = current;
                                drawMode = "line";
                            } else {
                                drawMode = "curve";
                            }

                            // var alreadyUsedColors = [];
                            // for (var i = 0; i < curves.length; i++) {
                            //     alreadyUsedColors.push(curves[i].colorIdx);
                            // }
                            // for (var i = 0; i < CURVE_COLORS.length; i++) {
                            //     if (alreadyUsedColors.indexOf(i) == -1) {
                            //         drawnColorIdx = i;
                            //         return;
                            //     }
                            // }

                            // get drawnColor
                            switch (colorSelect.value) {
                                case "Blue": {
                                    drawnColorIdx = 0;
                                    break;
                                }
                                case "Orange": {
                                    drawnColorIdx = 1;
                                    break;
                                }
                                case "Green": {
                                    drawnColorIdx = 2;
                                    break;
                                }
                            }

                            return;

                        } else {
                            alert("Too much lines being drawn.");
                            checkPointsUndo.pop();
                        }

                    }


                    function mouseDragged(e) {
                        isMouseDragged = true;
                        var current = getMousePt(e);
                        releasePt = current;

                        if (action == "MOVE_CURVE") {
                            p.cursor(p.MOVE);

                            scope.trashActive = isOverButton(current, element.find(".trash-button"));
                            scope.$apply();

                            var dx = current.x - prevMousePt.x;
                            var dy = current.y - prevMousePt.y;
                            prevMousePt = current;
                            transCurve(curves[movedCurveIdx], dx, dy);

                            reDraw();
                            drawCurve(curves[movedCurveIdx], MOVE_LINE_COLOR);

                        } else if (action == "STRETCH_CURVE") {
                            p.cursor(p.MOVE);

                            var dx = current.x - prevMousePt.x;
                            var dy = current.y - prevMousePt.y;
                            prevMousePt = current;

                            var c = curves[clickedCurveIdx];

                            // calculate old x,y range
                            var orx = c.maxX - c.minX;
                            var ory = c.maxY - c.minY;


                            // update the position of stretched vertex
                            switch (stretchMode) {
                                case 0: {
                                    if (orx < 30 && dx > 0  || ory < 30 && dy > 0) {
                                        return;
                                    }
                                    c.minX += dx;
                                    c.minY += dy;
                                    break;
                                }
                                case 1: {
                                    if (orx < 30 && dx < 0 || ory < 30 && dy > 0) {
                                        return;
                                    }
                                    c.maxX += dx;
                                    c.minY += dy;
                                    break;
                                }
                                case 2: {
                                    if (orx < 30 && dx < 0 || ory < 30 && dy < 0) {
                                        return;
                                    }
                                    c.maxX += dx;
                                    c.maxY += dy;
                                    break;
                                }
                                case 3: {
                                    if (orx < 30 && dy > 0 || ory < 30 && dy < 0) {
                                        return;
                                    }
                                    c.minX += dx;
                                    c.maxY += dy;
                                    break;
                                }
                                case 4: {
                                    if (ory < 30 && dy > 0) {
                                        return;
                                    }
                                    c.minY += dy;
                                    break;
                                }
                                case 5: {
                                    if (ory < 30 && dy < 0) {
                                        return;
                                    }
                                    c.maxY += dy;
                                    break;
                                }
                                case 6: {
                                    if (orx < 30 && dx > 0) {
                                        return;
                                    }
                                    c.minX += dx;
                                    break;
                                }
                                case 7: {
                                    if (orx < 30 && dx < 0) {
                                        return;
                                    }
                                    c.maxX += dx;
                                    break;
                                }
                            }

                            // calculate the new range
                            var nrx = c.maxX - c.minX;
                            var nry = c.maxY - c.minY;

                            // stretch the curve
                            switch (stretchMode) {
                                case 0: {
                                    stretchCurve(c, orx, ory, nrx, nry, c.maxX, c.maxY);
                                    break;
                                }
                                case 1: {
                                    stretchCurve(c, orx, ory, nrx, nry, c.minX, c.maxY);
                                    break;
                                }
                                case 2: {
                                    stretchCurve(c, orx, ory, nrx, nry, c.minX, c.minY);
                                    break;
                                }
                                case 3: {
                                    stretchCurve(c, orx, ory, nrx, nry, c.maxX, c.minY);
                                    break;
                                }
                                case 4: {
                                    stretchCurve(c, orx, ory, orx, nry, (c.minX + c.maxX)/2, c.maxY);
                                    break;
                                }
                                case 5: {
                                    stretchCurve(c, orx, ory, orx, nry, (c.minX + c.maxX)/2, c.minY);
                                    break;
                                }
                                case 6: {
                                    stretchCurve(c, orx, ory, nrx, ory, c.maxX, (c.minY + c.maxY)/2);
                                    break;
                                }
                                case 7: {
                                    stretchCurve(c, orx, ory, nrx, ory, c.minX, (c.minY + c.maxY)/2);
                                    break;
                                }
                            }
                            
                            reDraw();

                        } else if (action == "MOVE_SYMBOL") {
                            p.cursor(p.MOVE);

                            var dx = current.x - prevMousePt.x;
                            var dy = current.y - prevMousePt.y;
                            prevMousePt = current;

                            movedSymbol.x += dx;
                            movedSymbol.y += dy;

                            reDraw();
                            drawSymbol(movedSymbol, MOVE_SYMBOL_COLOR);

                            function detect(knots) {
                                for (var j = 0; j < knots.length; j++) {
                                    if (knots[j].symbol == undefined && f.getDist(movedSymbol, knots[j]) < MOUSE_DETECT_RADIUS) {
                                        drawKnotDetect(knots[j], KNOT_DETECT_COLOR);
                                        return;
                                    }
                                }
                            }

                            for (var i = 0; i < curves.length; i++) {
                                var interX = curves[i]['interX'];
                                detect(interX);

                                var interY = curves[i]['interY'];
                                detect(interY);

                                var maxima = curves[i]['maxima'];
                                detect(maxima);

                                var minima = curves[i]['minima'];
                                detect(minima);
                            }


                            if (clickedKnot != null) {
                                var knot = clickedKnot;
                                if (knot.xSymbol == undefined && f.getDist(movedSymbol, f.createPoint(knot.x, canvasHeight/2)) < MOUSE_DETECT_RADIUS) {
                                    drawKnotDetect(f.createPoint(knot.x, canvasHeight/2), KNOT_DETECT_COLOR);
                                    return;
                                }
                                if (knot.ySymbol == undefined && f.getDist(movedSymbol, f.createPoint(canvasWidth/2, knot.y)) < MOUSE_DETECT_RADIUS) {
                                    drawKnotDetect(f.createPoint(canvasWidth/2, knot.y), KNOT_DETECT_COLOR);
                                    return;
                                }
                            }


                        } else if (action == "DRAW_CURVE") {
                            p.cursor(p.CROSS);

                            if (drawMode == "curve") {
                                p.push();
                                p.stroke(CURVE_COLORS[drawnColorIdx]);
                                p.strokeWeight(CURVE_STRKWEIGHT);
                                if (drawnPts.length > 0) {
                                    var prev = drawnPts[drawnPts.length - 1];
                                    p.line(prev.x, prev.y, current.x, current.y);
                                }
                                p.pop();

                                drawnPts.push(current);
                            } else {
                                reDraw();

                                p.push();
                                p.stroke(CURVE_COLORS[drawnColorIdx]);
                                p.strokeWeight(CURVE_STRKWEIGHT);
                                p.line(lineStart.x, lineStart.y, current.x, current.y);
                                p.pop();

                                lineEnd = current;
                            }
                            
                        }
                    }

                    function mouseReleased(e) {
                        var current = releasePt;

                        // if it is just a click, handle click in the following if block
                        if (!isMouseDragged) {

                            // clean up the mess of MOVE_SYMBOL and MOVE_CURVE
                            if (action  == "MOVE_SYMBOL") {
                                if (bindedKnot == undefined) {
                                    freeSymbols.push(movedSymbol);
                                } else {
                                    bindedKnot[symbolType] = movedSymbol;
                                }
                                reDraw();

                            } else if (action == "MOVE_CURVE" || action == "STRETCH_CURVE") {
                                reDraw();
                            }

                            // click do not respond in inactive area (eg buttons)
                            if (!isActive(current)) {
                                return;
                            }

                            // if to show dot line
                            for (var i = 0; i < curves.length; i++) {
                                var maxima = curves[i].maxima;
                                for (var j = 0; j < maxima.length; j++) {
                                    var knot = maxima[j];
                                    if (f.getDist(current, knot) < MOUSE_DETECT_RADIUS) {
                                        if (knot == clickedKnot) {
                                            clickedKnot = null;
                                        } else {
                                            clickedKnot = knot;
                                        }
                                        reDraw();
                                        return;
                                    }
                                }

                                var minima = curves[i].minima;
                                for (var j = 0; j < minima.length; j++) {
                                    var knot = minima[j];
                                    if (f.getDist(current, knot) < MOUSE_DETECT_RADIUS) {
                                        if (knot == clickedKnot) {
                                            clickedKnot = null;
                                        } else {
                                            clickedKnot = knot;
                                        }
                                        reDraw();
                                        return;
                                    }
                                }
                            }

                            // check if show stretch box
                            for (var i = 0; i < curves.length; i++) {
                                var pts = curves[i].pts;
                                for (var j = 0; j < pts.length; j++) {
                                    if (f.getDist(pts[j], current) < MOUSE_DETECT_RADIUS) {
                                        clickedCurveIdx = i;
                                        reDraw();
                                        return;
                                    }
                                }
                            }


                            if (clickedKnot != null || clickedCurveIdx != undefined) {
                                clickedKnot = null;
                                clickedCurveIdx = undefined;
                                reDraw();
                            }

                            return;
                        }

                        if (action == "MOVE_CURVE") {

                            checkPointsUndo.push(checkPoint);
                            checkPointsRedo = [];

                            // for deletion
                            if (scope.trashActive) {
                                var curve = (curves.splice(movedCurveIdx, 1))[0];

                                function freeAllSymbols(knots) {
                                    for (var i = 0; i < knots.length; i++) {
                                        var knot = knots[i];
                                        if (knot.symbol != undefined) {
                                            freeSymbols.push(knot.symbol);
                                        }
                                        if (knot.xSymbol != undefined) {
                                            freeSymbols.push(knot.xSymbol);
                                        }
                                        if (knot.ySymbol != undefined) {
                                            freeSymbols.push(knot.ySymbol);
                                        }
                                    }
                                }

                                var interX = curve.interX;
                                freeAllSymbols(interX);

                                var interY = curve.interY;
                                freeAllSymbols(interY);

                                var maxima = curve.maxima;
                                freeAllSymbols(maxima);

                                var minima = curve.minima;
                                freeAllSymbols(minima);

                                clickedCurveIdx = undefined;
                            }

                            scope.trashActive = false;
                            scope.$apply();
                            reDraw();

                        } else if (action == "STRETCH_CURVE") {
                            checkPointsUndo.push(checkPoint);
                            checkPointsRedo = [];

                            var c = curves[clickedCurveIdx];

                            // if (c.maxX < c.minX) {
                            //     var tmp = c.maxX;
                            //     c.maxX = c.minX;
                            //     c.minX = tmp;
                            // }

                            // if (c.maxY < c.minY) {
                            //     var tmp = c.maxY;
                            //     c.maxY = c.minY;
                            //     c.minX = tmp;
                            // }
                        } else if (action == "MOVE_SYMBOL") {
                            checkPointsUndo.push(checkPoint);
                            checkPointsRedo = [];
                            scope.$apply();

                            var found = false;

                            function attach(knots) {
                                if (found) {
                                    return;
                                }
                                for (var j = 0; j < knots.length; j++) {
                                    var knot = knots[j];
                                    if (knot.symbol == undefined && f.getDist(movedSymbol, knot) < MOUSE_DETECT_RADIUS) {
                                        movedSymbol.x = knot.x;
                                        movedSymbol.y = knot.y;
                                        knot.symbol = movedSymbol;
                                        found = true;
                                    }
                                }
                            }

                            for (var i = 0; i < curves.length; i++) {
                                var interX = curves[i]['interX'];
                                attach(interX);

                                var interY = curves[i]['interY'];
                                attach(interY);

                                var maxima = curves[i]['maxima'];
                                attach(maxima);

                                var minima = curves[i]['minima'];
                                attach(minima);

                                if (found) {
                                    break;
                                }
                            }

                            if (!found && clickedKnot != null) {
                                var knot = clickedKnot;
                                if (knot.xSymbol == undefined && f.getDist(movedSymbol, f.createPoint(knot.x, canvasHeight/2)) < MOUSE_DETECT_RADIUS) {
                                    movedSymbol.x = knot.x;
                                    movedSymbol.y = canvasHeight/2;
                                    knot.xSymbol = movedSymbol;
                                    found = true;
                                } else if (knot.ySymbol == undefined && f.getDist(movedSymbol, f.createPoint(canvasWidth/2, knot.y)) < MOUSE_DETECT_RADIUS) {
                                    movedSymbol.x = canvasWidth/2;
                                    movedSymbol.y = knot.y;
                                    knot.ySymbol = movedSymbol;
                                    found = true;
                                }
                            }

                            if (!found) {
                                freeSymbols.push(movedSymbol);
                            }

                            reDraw();

                        } else if (action == "DRAW_CURVE") {

                            var curve;

                            if (drawMode == "curve") {
                                 // neglect if curve drawn is too short
                                if (s.sample(drawnPts).length < 3) {
                                    return;
                                }

                                checkPointsUndo.push(checkPoint);
                                checkPointsRedo = [];
                                scope.$apply();

                                // adjustment of start and end to attach to the axis automatically.
                                if (Math.abs(drawnPts[0].y - canvasHeight/2) < 3) {
                                    drawnPts[0].y = canvasHeight/2;
                                }
                                if (Math.abs(drawnPts[0].x - canvasWidth/2) < 3) {
                                    drawnPts[0].x = canvasWidth/2;
                                }
                                if (Math.abs(drawnPts[drawnPts.length - 1].y - canvasHeight/2) < 3) {
                                    drawnPts[drawnPts.length - 1].y = canvasHeight/2;
                                }
                                if (Math.abs(drawnPts[drawnPts.length - 1].x - canvasWidth/2) < 3) {
                                    drawnPts[drawnPts.length - 1].x = canvasWidth/2;
                                }

                                // sampler.sample, bezier.genericBezier
                                var pts = b.genericBezier(s.sample(drawnPts));
                                curve = {};
                                curve.pts = pts;

                                var minX = pts[0].x;
                                var maxX = pts[0].x;
                                var minY = pts[0].y;
                                var maxY = pts[0].y;
                                for (var i = 1; i < pts.length; i++) {
                                    minX = Math.min(pts[i].x, minX);
                                    maxX = Math.max(pts[i].x, maxX);
                                    minY = Math.min(pts[i].y, minY);
                                    maxY = Math.max(pts[i].y, maxY);
                                }
                                curve.minX = minX;
                                curve.maxX = maxX;
                                curve.minY = minY;
                                curve.maxY = maxY;

                                curve.interX = findInterceptX(pts);
                                curve.interY = findInterceptY(pts);
                                curve.maxima = findTurnPts(pts, 'maxima');
                                curve.minima = findTurnPts(pts, 'minima');
                                curve.colorIdx = drawnColorIdx;

                            } else {
                                checkPointsUndo.push(checkPoint);
                                checkPointsRedo = [];
                                scope.$apply();


                                var n = 100;
                                var rx = lineEnd.x - lineStart.x;
                                var ry = lineEnd.y - lineStart.y;
                                var sx = rx / n;
                                var sy = ry / n;
                                var pts = [];
                                for (var i = 0; i <= n; i++) {
                                    var x = lineStart.x + i * sx;
                                    var y = lineStart.y + i * sy;
                                    pts.push(f.createPoint(x, y));
                                }

                                curve = {};
                                curve.pts = pts;

                                curve.minX = Math.min(lineStart.x, lineEnd.x);
                                curve.maxX = Math.max(lineStart.x, lineEnd.x);
                                curve.minY = Math.min(lineStart.y, lineEnd.y);
                                curve.maxY = Math.max(lineStart.y, lineEnd.y);

                                curve.interX = findInterceptX(pts);
                                curve.interY = findInterceptY(pts);
                                curve.maxima = [];
                                curve.minima = [];
                                curve.colorIdx = drawnColorIdx;
                            }

                            function loop(knots) {
                                for (var i = 0; i < knots.length; i++) {
                                    var knot = knots[i];
                                    for (var j = 0; j < freeSymbols.length; j++) {
                                        var sym = freeSymbols[j];
                                        if (f.getDist(knot, sym) < 20) {
                                            sym.x = knot.x;
                                            sym.y = knot.y;
                                            knot.symbol = sym;
                                            freeSymbols.splice(j, 1);
                                        }
                                    }
                                }
                            }

                            loop(curve.maxima);
                            loop(curve.minima);
                            loop(curve.interX);
                            loop(curve.interY);

                            curves.push(curve);
                            reDraw();
                        }

                        return;
                    }

                    // function mouseClicked(e) {
                    //     if (isMouseDragged) {
                    //         return;
                    //     }

                    //     if (action  == "MOVE_SYMBOL") {
                    //         if (bindedKnot == undefined) {
                    //             freeSymbols.push(movedSymbol);
                    //         } else {
                    //             bindedKnot[symbolType] = movedSymbol;
                    //         }
                    //         reDraw();
                    //     } else if (action == "MOVE_CURVE") {
                    //         reDraw();
                    //     }

                    //     var current = getMousePt(e);

                    //     if (!isActive(current)) {
                    //         return;
                    //     }

                    //     for (var i = 0; i < curves.length; i++) {
                    //         var maxima = curves[i].maxima;
                    //         for (var j = 0; j < maxima.length; j++) {
                    //             var knot = maxima[j];
                    //             if (f.getDist(current, knot) < MOUSE_DETECT_RADIUS) {
                    //                 if (knot == clickedKnot) {
                    //                     clickedKnot = null;
                    //                 } else {
                    //                     clickedKnot = knot;
                    //                 }
                    //                 reDraw();
                    //                 return;
                    //             }
                    //         }

                    //         var minima = curves[i].minima;
                    //         for (var j = 0; j < minima.length; j++) {
                    //             var knot = minima[j];
                    //             if (f.getDist(current, knot) < MOUSE_DETECT_RADIUS) {
                    //                 if (knot == clickedKnot) {
                    //                     clickedKnot = null;
                    //                 } else {
                    //                     clickedKnot = knot;
                    //                 }
                    //                 reDraw();
                    //                 return;
                    //             }
                    //         }
                    //     }

                    //     if (clickedKnot != null) {
                    //         clickedKnot = null;
                    //         reDraw();
                    //     }

                    // }

                    function clone(obj) {
                        var json = JSON.stringify(obj);
                        return JSON.parse(json);
                    }

                    var encodeData = function(trunc) {

                        if (trunc == undefined) {
                            trunc = true;
                        }

                        if (canvasWidth > 5000 || canvasWidth <= 0) {
                            alert("Invalid canvasWidth.");
                            return;
                        }

                        if (canvasHeight > 5000 || canvasHeight <= 0) {
                            alert("Invalid canvasHeight.");
                            return;
                        }

                        var data = {};
                        data.canvasWidth = canvasWidth;
                        data.canvasHeight = canvasHeight;

                        var clonedCurves = clone(curves);

                        // sort segments according to their left most points.
                        function compare(curve1, curve2) {
                            function findMinX(pts) {
                                if (pts.length == 0) return 0;
                                var min = canvasWidth;
                                for (var i = 0; i < pts.length; i++)
                                    min = Math.min(min, pts[i].x);
                                return min;
                            }

                            var min1 = findMinX(curve1.pts);
                            var min2 = findMinX(curve2.pts);
                            if (min1 < min2) return -1
                            else if (min1 == min2) return 0
                            else return 1;
                        }
                        clonedCurves.sort(compare);

                        function normalise(pt) {
                            var x = (pt.x - canvasWidth/2) / canvasWidth;
                            var y = (canvasHeight/2 - pt.y) / canvasHeight;
                            if (trunc) {
                                pt.x = Math.trunc(x * 10000) / 10000;
                                pt.y = Math.trunc(y * 10000) / 10000;
                            } else {
                                pt.x = x;
                                pt.y = y;
                            }
                            
                        }

                        function normalise1(knots) {
                            for (var j = 0; j < knots.length; j++) {
                                var knot = knots[j];
                                normalise(knot);
                                if (knot.symbol != undefined) {
                                    normalise(knot.symbol);
                                }
                            }
                        }

                        function normalise2(knots) {
                            normalise1(knots);
                            for (var j = 0; j < knots.length; j++) {
                                var knot = knots[j];
                                if (knot.xSymbol != undefined) {
                                    normalise(knot.xSymbol);
                                }
                                if (knot.ySymbol != undefined) {
                                    normalise(knot.ySymbol);
                                }
                            }
                        }


                        for (var i = 0; i < clonedCurves.length; i++) {
                            var pts = clonedCurves[i].pts;
                            for (var j = 0; j < pts.length; j++) {
                                normalise(pts[j]);
                            }

                            var tmp;

                            tmp = (clonedCurves[i].minX - canvasWidth/2) / canvasWidth;
                            clonedCurves[i].minX = Math.trunc(tmp * 10000) / 10000;

                            tmp = (clonedCurves[i].maxX - canvasWidth/2) / canvasWidth;
                            clonedCurves[i].maxX = Math.trunc(tmp * 10000) / 10000;

                            tmp = (canvasHeight/2 - clonedCurves[i].minY) / canvasHeight;
                            clonedCurves[i].minY = Math.trunc(tmp * 10000) / 10000;

                            tmp = (canvasHeight/2 - clonedCurves[i].maxY) / canvasHeight;
                            clonedCurves[i].maxY = Math.trunc(tmp * 10000) / 10000;


                            var interX = clonedCurves[i].interX;
                            normalise1(interX);

                            var interY = clonedCurves[i].interY;
                            normalise1(interY);

                            var maxima = clonedCurves[i].maxima;
                            normalise2(maxima);

                            var minima = clonedCurves[i].minima;
                            normalise2(minima);
                        }



                        data.curves = clonedCurves;

                        var clonedFreeSymbols = clone(freeSymbols);
                        for (var i = 0; i < clonedFreeSymbols.length; i++) {
                            var symbol = clonedFreeSymbols[i];
                            normalise(symbol);
                        }
                        data.freeSymbols = clonedFreeSymbols;

                        return data;
                    }

                    function decodeData(rawData) {

                        var data = clone(rawData);

                        function denormalise(pt) {
                                pt.x = pt.x * canvasWidth + canvasWidth/2;
                                pt.y = canvasHeight/2 - pt.y * canvasHeight;
                            }

                        function denormalise1(knots) {
                            for (var j = 0; j < knots.length; j++) {
                                var knot = knots[j];
                                denormalise(knot);
                                if (knot.symbol != undefined) {
                                    denormalise(knot.symbol);
                                }
                            }
                        }

                        function denormalise2(knots) {
                            denormalise1(knots);
                            for (var j = 0; j < knots.length; j++) {
                                var knot = knots[j];
                                if (knot.xSymbol != undefined) {
                                    denormalise(knot.xSymbol);
                                }
                                if (knot.ySymbol != undefined) {
                                    denormalise(knot.ySymbol);
                                }
                            }
                        }


                        curves = data.curves;
                        for (var i = 0; i < curves.length; i++) {

                            var pts = curves[i].pts;
                            for (var j = 0; j < pts.length; j++) {
                                denormalise(pts[j]);
                            }

                            curves[i].minX = curves[i].minX * canvasWidth + canvasWidth/2;
                            curves[i].maxX = curves[i].maxX * canvasWidth + canvasWidth/2;
                            curves[i].minY = canvasHeight/2 - curves[i].minY * canvasHeight;
                            curves[i].maxY = canvasHeight/2 - curves[i].maxY * canvasHeight;

                            var interX = curves[i].interX;
                            denormalise1(interX);

                            var interY = curves[i].interY;
                            denormalise1(interY);

                            var maxima = curves[i].maxima;
                            denormalise2(maxima);

                            var minima = curves[i].minima;
                            denormalise2(minima);
                        }

                        freeSymbols = data.freeSymbols;
                        for (var j = 0; j < freeSymbols.length; j++) {
                            denormalise(freeSymbols[j]);
                        }

                        reDraw();
                    }

                    function undo() {
                        if (checkPointsUndo.length == 0) {
                            return;
                        }

                        var checkPointRedo = {};
                        checkPointRedo.freeSymbolsJSON = JSON.stringify(freeSymbols);
                        checkPointRedo.curvesJSON = JSON.stringify(curves);
                        checkPointsRedo.push(checkPointRedo);

                        var checkPointUndo = checkPointsUndo.pop();
                        freeSymbols = JSON.parse(checkPointUndo.freeSymbolsJSON);
                        curves = JSON.parse(checkPointUndo.curvesJSON);
                        
                        clickedKnot = null;
                        clickedCurveIdx = undefined;

                        reDraw();
                    }

                    function redo() {
                        event.stopPropagation();
                        if (checkPointsRedo.length == 0) {
                            return;
                        }

                        var checkPointUndo = {};
                        checkPointUndo.freeSymbolsJSON = JSON.stringify(freeSymbols);
                        checkPointUndo.curvesJSON = JSON.stringify(curves);
                        checkPointsUndo.push(checkPointUndo);

                        var checkPointRedo = checkPointsRedo.pop();
                        freeSymbols = JSON.parse(checkPointRedo.freeSymbolsJSON);
                        curves = JSON.parse(checkPointRedo.curvesJSON);
                        
                        clickedKnot = null;
                        clickedCurveIdx = undefined;

                        reDraw();
                    }

                    function isUndoable() {
                        return (checkPointsUndo.length > 0);
                    }

                    function isRedoable() {
                        return (checkPointsRedo.length > 0);
                    }

                    function clean() {
                        // if the graph is clean originall, no change occur.
                        // if (curves.length === 0) {
                        //     return;
                        // }

                        checkPoint = {};
                        checkPoint.freeSymbolsJSON = JSON.stringify(freeSymbols);
                        checkPoint.curvesJSON = JSON.stringify(curves);
                        checkPointsUndo.push(checkPoint);
                        checkPointsRedo = [];

                        curves = [];
                        clickedKnot = null;
                        clickedCurveIdx = undefined;

                        initiateFreeSymbols();
                        reDraw();
                    }

                    function keyPressed(e) {
                        key = e.key;
                    }

                    function keyReleased(e) {
                        key = undefined;
                    }

                    function touchStarted(e) {
                        mousePressed(e.touches[0]);
                    }

                    function touchMoved(e) {
                        mouseDragged(e.touches[0]);
                    }

                    function touchEnded(e) {
                        mouseReleased(e);
                    }

                    function windowResized() {
                        var data = encodeData(false);
                        canvasWidth = window.innerWidth;
                        canvasHeight = window.innerHeight;
                        p.resizeCanvas(window.innerWidth, window.innerHeight);
                        decodeData(data);
                        reDraw();
                    }


                    // export the following functions to p5, so they can be assessed via the object produced.
                    p.setup = setup;
                    p.mousePressed = mousePressed;
                    p.mouseDragged = mouseDragged;
                    p.mouseReleased = mouseReleased;
                    p.mouseMoved = mouseMoved;

                    p.touchStarted = touchStarted;
                    p.touchMoved = touchMoved;
                    p.touchEnded = touchEnded;

                    p.keyPressed = keyPressed;
                    p.keyReleased = keyReleased;

                    p.windowResized = windowResized;

                    p.encodeData = encodeData;
                    p.decodeData = decodeData;
                    p.undo = undo;
                    p.redo = redo;
                    p.isUndoable = isUndoable;
                    p.isRedoable = isRedoable;
                    p.clean = clean;
                }

                $rootScope.showGraphSketcher = function(initialState, questionDoc, editorMode) {

                    return new Promise(function(resolve, reject) {

                        $(".result-preview>span").empty();
                        $(".result-preview").width(0);

                        var eqnModal = $('#graphModal');
                        eqnModal.one("opened.fndtn.reveal", function() {
                            element.find(".top-menu").css("bottom", scope.equationEditorElement.height());
                        });

                        eqnModal.foundation("reveal", "open");
                        scope.state = initialState;
                        scope.questionDoc = questionDoc;
                        
                        
                        // scope.log = {
                        //     type: "EQN_EDITOR_LOG",
                        //     questionId: scope.questionDoc ? scope.questionDoc.id : null,
                        //     screenSize: {
                        //         width: window.innerWidth,
                        //         height: window.innerHeight
                        //     },
                        //     actions: [{
                        //         event: "OPEN",
                        //         timestamp: Date.now()
                        //     }]
                        // };

                        // Log just before the page closes if tab/browser closed:
                        // window.addEventListener("beforeunload", scope.logOnClose);
                        // // Log the editor being closed and submit log event to server:
                        // eqnModal.one("close", function(e) {
                        //     scope.log.finalState = [];
                        //     sketch.symbols.forEach(function(e) {
                        //         scope.log.finalState.push(e.subtreeObject(true, true));
                        //     });
                        //     scope.log.actions.push({
                        //         event: "CLOSE",
                        //         timestamp: Date.now()
                        //     });
                        //     if (scope.segueEnvironment == "DEV") {
                        //         console.log("\nLOG: ~" + (JSON.stringify(scope.log).length / 1000).toFixed(2) + "kb\n\n", JSON.stringify(scope.log));
                        //     }
                        //     window.removeEventListener("beforeunload", scope.logOnClose);
                        //     api.logger.log(scope.log);
                        //     scope.log = null;
                        // });
                        //
                        // scope.history = [JSON.parse(JSON.stringify(scope.state))];
                        // scope.historyPtr = 0;
                        //element.find("canvas").remove();

                        scope.future = [];

                        // generate p5 instance
                        scope.p = new p5(scope.sketch, document.getElementById("graphSketcher"));

                        // reload previous answer if there is one
                        // console.debug("within graphSketcher scope.state: ", scope.state);
                        if (scope.state.curves != undefined && scope.state.freeSymbols != undefined) {
                            scope.p.decodeData(scope.state);
                        }



                        eqnModal.one("closed.fndtn.reveal", function() {
                            // update local state
                            scope.newEditorState(scope.p.encodeData());

                            // remove p5 object
                            scope.p.remove();

                            // update ctrl.selectedFormula (in scope of GraphSketcherQuestion.js)
                            resolve(scope.state);
                        });

                    });
                };


                scope.centre = function() {
                    sketch.centre();
                }


            }
        };
    }];
});
