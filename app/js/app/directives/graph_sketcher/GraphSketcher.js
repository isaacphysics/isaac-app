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

                scope.submit = function() {
                    $("#equationModal").foundation("reveal", "close");

                    // needed??
                    scope.testResult = scope.p.encodeData();
                    
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

                            var GRID_WIDTH = 50,
                                CURVE_STRKWEIGHT = 2,
                                PADDING = 0.025 * canvasWidth,
                                DOT_LINE_STEP = 5,
                                MOUSE_DETECT_RADIUS = 10;
                                
                            var CURVE_COLORS = [[93,165,218], [250,164,58], [96,189,104], [241,124,176], [241,88,84], [178,118,178]],
                                KNOT_COLOR = [77,77,77],
                                DOT_LINE_COLOR = [123],
                                MOVE_LINE_COLOR = [135],
                                MOVE_SYMBOL_COLOR = [151],
                                KNOT_DETECT_COLOR = [151];

                            // action recorder
                            var action = undefined,
                                isMouseDragged;

                            var freeSymbols = [],
                                curves = [];

                            // for drawing curve
                            var drawnPts = [],
                                drawnColorIdx;

                            // for moving curve
                            var prevMousePt,
                                movedCurveIdx;

                            // for moving symbols
                            var movedSymbol,
                                bindedKnot,
                                symbolType;

                            var clickedKnot = null;

                            // for redo and undo
                            var checkPoint,
                                checkPointsUndo = [],
                                checkPointsRedo = [];

                            var junkPt = f.createPoint(canvasWidth - 50, 50);

                            function initiateFreeSymbols() {
                                freeSymbols = [];
                                freeSymbols.push(f.createSymbol('A'));
                                freeSymbols.push(f.createSymbol('B'));
                                freeSymbols.push(f.createSymbol('C'));
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
                                // p5.createCanvas
                                p.createCanvas(canvasWidth, canvasHeight);
                                p.noLoop();
                                p.cursor(p.CROSS);

                                initiateFreeSymbols();
                                reDraw();
                                drawButton();
                            }

                            function reDraw() {
                                drawBackground();
                                drawCurves(curves);
                                refreshFreeSymbols();
                                drawSymbols(freeSymbols);
                                drawKnot3(clickedKnot);
                            }

                            function drawBackground() {

                                function drawHorizontalAxis() {
                                    // p5.p.strokeWeight, p5.p.strokeJoin, p5.ROUND, p5.p.stroke, p5.noFill, p5.p.beginShape, p5.p.vertex, p5.p.endShape, p5.push, p5.pop
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
                                    p.stroke(215);

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
                                p.textSize(14);
                                p.text(symbol.text, symbol.x - 4, symbol.y + 20);
                                
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

                            function drawJunkArea(color) {
                                p.push();
                                p.stroke(color)
                                p.strokeWeight(10);
                                p.line(junkPt.x - 15, junkPt.y - 15, junkPt.x + 15, junkPt.y + 15);
                                p.line(junkPt.x + 15, junkPt.y - 15, junkPt.x - 15, junkPt.y + 15); 
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
                                if (pts.length == 0) return [];

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

                                            var l = i-1;
                                            while (l >= 0 && f.getDist(pts[l], pts[i]) < 15) l--;
                                            if (l < 0) continue;
                                            var dy = pts[i].y - pts[l].y;
                                            var dx = pts[i].x - pts[l].x;
                                            var grad1 = dy/dx;

                                            var r = i+1;
                                            while (r < pts.length && f.getDist(pts[r], pts[i]) < 15) r++;
                                            if (r >= pts.length) continue;
                                            var dy = pts[r].y - pts[i].y;
                                            var dx = pts[r].x - pts[i].x;
                                            var grad2 = dy/dx;

                                            if (Math.abs(grad1) > 0.03 && Math.abs(grad2) > 0.03) {
                                                if (mode == 'maxima') {
                                                    if ((pts[i].x > pts[i-1].x && grad1 < 0 && grad2 > 0) || (pts[i].x < pts[i-1].x && grad1 > 0 && grad2 < 0)) {
                                                        turnPts.push(f.createPoint(pts[i].x, pts[i].y));
                                                    } 
                                                } else {
                                                    if ((pts[i].x > pts[i-1].x && grad1 > 0 && grad2 < 0) || (pts[i].x < pts[i-1].x && grad1 < 0 && grad2 > 0)) {
                                                        turnPts.push(f.createPoint(pts[i].x, pts[i].y));
                                                    } 
                                                }   
                                            } 
                                        }
                                    }
                                }

                                return turnPts;
                            }


                            // given a curve, translate the curve
                            function transCurve(curve, dx, dy) {
                                var pts = curve.pts;
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



                            function mousePressed(e) {
                                var current = f.createPoint(e.clientX, e.clientY);

                                isMouseDragged = false;
                                action = undefined;

                                movedSymbol = undefined;
                                bindedKnot = undefined;
                                symbolType = undefined;

                                drawnPts = [];
                                drawnColorIdx = undefined;

                                movedCurveIdx = undefined;
                                prevMousePt = undefined;


                                // does not react if mouse is outside canvas
                                if (current.x < 0 || current.x > canvasWidth || current.y < 0 || current.y > canvasHeight) {
                                    return;
                                }
                                

                                // record down current status, may be used later for undo.
                                checkPoint = {};
                                checkPoint.freeSymbolsJSON = JSON.stringify(freeSymbols);
                                checkPoint.curvesJSON = JSON.stringify(curves);


                                // check if it is to move a symbol
                                for (var i = 0; i < freeSymbols.length; i++) {
                                    if (f.getDist(current, freeSymbols[i]) < MOUSE_DETECT_RADIUS) {
                                        movedSymbol = freeSymbols[i];
                                        freeSymbols.splice(i, 1);
                                        action = "MOVE_SYMBOL";
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
                                        if (knot.symbol != undefined && f.getDist(current, knot) < MOUSE_DETECT_RADIUS) {
                                            movedSymbol = knot.symbol;
                                            knot.symbol = undefined;
                                            bindedKnot = knot;
                                            symbolType = 'symbol';
                                            found = true;
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
                                        if (knot.xSymbol != undefined && f.getDist(current, knot.xSymbol) < MOUSE_DETECT_RADIUS) {
                                            movedSymbol = knot.xSymbol;
                                            knot.xSymbol = undefined;
                                            bindedKnot = knot;
                                            symbolType = 'xSymbol';
                                            found = true;
                                        }
                                        if (knot.ySymbol != undefined && f.getDist(current, knot.ySymbol) < MOUSE_DETECT_RADIUS) {
                                            movedSymbol = knot.ySymbol;
                                            knot.ySymbol = undefined;
                                            bindedKnot = knot;
                                            symbolType = 'ySymbol';
                                            found = true;
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
                                    return;
                                }


                                // check if it is moving curve.
                                for (var i = 0; i < curves.length; i++) {
                                    var pts = curves[i].pts;
                                    for (var j = 0; j < pts.length; j++) {
                                        if (f.getDist(pts[j], current) < MOUSE_DETECT_RADIUS) {
                                            movedCurveIdx = i;
                                            action = "MOVE_CURVE";
                                            clickedKnot = null;
                                            prevMousePt = current;
                                            return;
                                        }
                                    }
                                }


                                // if it is drawing curve
                                if (curves.length < CURVE_COLORS.length) {
                                    action = "DRAW_CURVE";

                                    var alreadyUsedColors = [];
                                    for (var i = 0; i < curves.length; i++) {
                                        alreadyUsedColors.push(curves[i].colorIdx);
                                    }
                                    for (var i = 0; i < CURVE_COLORS.length; i++) {
                                        if (alreadyUsedColors.indexOf(i) == -1) {
                                            drawnColorIdx = i;
                                            return;
                                        }
                                    }

                                } else {
                                    alert("Too much lines being drawn.");
                                    checkPointsUndo.pop();
                                }
                                
                            }

                            function mouseDragged(e) {
                               


                                isMouseDragged = true;
                                var current = f.createPoint(e.clientX, e.clientY);

                                if (action == "MOVE_CURVE") {
                                    var dx = current.x - prevMousePt.x;
                                    var dy = current.y - prevMousePt.y;
                                    transCurve(curves[movedCurveIdx], dx, dy);
                                    prevMousePt = current;

                                    reDraw();
                                    drawCurve(curves[movedCurveIdx], MOVE_LINE_COLOR);
                                    drawJunkArea(KNOT_COLOR);

                                    if (f.getDist(current, junkPt) < 15) {
                                        drawJunkArea(KNOT_DETECT_COLOR);
                                    }

                                } else if (action == "MOVE_SYMBOL") {
                                    movedSymbol.x = current.x;
                                    movedSymbol.y = current.y;

                                    reDraw();
                                    drawSymbol(movedSymbol, MOVE_SYMBOL_COLOR);

                                    function detect(knots) {
                                        for (var j = 0; j < knots.length; j++) {
                                            if (knots[j].symbol == undefined && f.getDist(current, knots[j]) < MOUSE_DETECT_RADIUS) {
                                                drawKnot(knots[j], KNOT_DETECT_COLOR);
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
                                        if (knot.xSymbol == undefined && f.getDist(current, f.createPoint(knot.x, canvasHeight/2)) < MOUSE_DETECT_RADIUS) {
                                            drawKnot(f.createPoint(knot.x, canvasHeight/2), KNOT_DETECT_COLOR);
                                            return;
                                        }
                                        if (knot.ySymbol == undefined && f.getDist(current, f.createPoint(canvasWidth/2, knot.y)) < MOUSE_DETECT_RADIUS) {
                                            drawKnot(f.createPoint(canvasWidth/2, knot.y), KNOT_DETECT_COLOR);
                                            return;
                                        }
                                    }
                                    

                                } else if (action == "DRAW_CURVE") {
                                    p.push();
                                    p.stroke(CURVE_COLORS[drawnColorIdx]);
                                    p.strokeWeight(CURVE_STRKWEIGHT);
                                    if (drawnPts.length > 0) {
                                        var prev = drawnPts[drawnPts.length - 1];
                                        p.line(prev.x, prev.y, current.x, current.y);
                                    }
                                    p.pop();

                                    drawnPts.push(current); 
                                }
                            }

                            function mouseReleased(e) {
                                

                                var current = f.createPoint(e.clientX, e.clientY);


                                // if it is just a click
                                if (!isMouseDragged) {
                                    return;
                                }

                                if (action == "MOVE_CURVE") {
                                    checkPointsUndo.push(checkPoint);
                                    checkPointsRedo = [];

                                    // for deletion
                                    if (f.getDist(current, junkPt) < 15) {
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
                                    }
                                    
                                    reDraw();
                                } else if (action == "MOVE_SYMBOL") {   
                                    checkPointsUndo.push(checkPoint);
                                    checkPointsRedo = [];

                                    var found = false;

                                    function attach(knots) {
                                        if (found) {
                                            return;
                                        }
                                        for (var j = 0; j < knots.length; j++) {
                                            var knot = knots[j];
                                            if (knot.symbol == undefined && f.getDist(current, knot) < MOUSE_DETECT_RADIUS) {
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

                                    if (clickedKnot != null && !found) {
                                        var knot = clickedKnot;
                                        if (knot.xSymbol == undefined && f.getDist(current, f.createPoint(knot.x, canvasHeight/2)) < MOUSE_DETECT_RADIUS) {
                                            movedSymbol.x = knot.x;
                                            movedSymbol.y = canvasHeight/2;
                                            knot.xSymbol = movedSymbol;
                                            found = true;
                                        } else if (knot.ySymbol == undefined && f.getDist(current, f.createPoint(canvasWidth/2, knot.y)) < MOUSE_DETECT_RADIUS) {
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
                                    // neglect if curve drawn is too short
                                    if (s.sample(drawnPts).length < 3) {
                                        
                                        return;
                                    }


                                    checkPointsUndo.push(checkPoint);
                                    checkPointsRedo = [];

                                    if (Math.abs(drawnPts[0].y - canvasHeight/2) < 5) {
                                        drawnPts[0].y = canvasHeight/2;
                                    }
                                    if (Math.abs(drawnPts[0].x - canvasWidth/2) < 5) {
                                        drawnPts[0].x = canvasWidth/2;
                                    }
                                    if (Math.abs(drawnPts[drawnPts.length - 1].y - canvasHeight/2) < 5) {
                                        drawnPts[drawnPts.length - 1].y = canvasHeight/2;
                                    }
                                    if (Math.abs(drawnPts[drawnPts.length - 1].x - canvasWidth/2) < 5) {
                                        drawnPts[drawnPts.length - 1].x = canvasWidth/2;
                                    }

                                    // sampler.sample, bezier.genericBezier

                                    var pts = b.genericBezier(s.sample(drawnPts));
                                    var curve = {};
                                    curve.pts = pts;
                                    curve.interX = findInterceptX(pts);
                                    curve.interY = findInterceptY(pts);
                                    curve.maxima = findTurnPts(pts, 'maxima');
                                    curve.minima = findTurnPts(pts, 'minima');
                                    curve.colorIdx = drawnColorIdx;
                                    curves.push(curve);

                                    
                                    reDraw();
                                }

                                return;
                            }

                            function mouseClicked(e) {
                                
                                // this is buggy, wrong place to put this code.
                                scope.newEditorState(encodeData());


                                if (isMouseDragged) {
                                    return;
                                }

                                if (action  == "MOVE_SYMBOL") {
                                    if (bindedKnot == undefined) {
                                        freeSymbols.push(movedSymbol);
                                    } else {
                                        bindedKnot[symbolType] = movedSymbol;
                                    }
                                    reDraw();
                                } else if (action == "MOVE_CURVE") {
                                    reDraw();
                                }

                                var current = f.createPoint(e.clientX, e.clientY);

                                if (current.x < 0 || current.x > canvasWidth || current.y < 0 || current.y > canvasHeight) {
                                    return;
                                }

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

                                if (clickedKnot != null) {
                                    clickedKnot = null;
                                    reDraw();
                                }

                            }

                            function clone(obj) {
                                var json = JSON.stringify(obj);
                                return JSON.parse(json);
                            }

                            var encodeData = function() {

                                if (canvasWidth > 5000 || canvasWidth <= 0) {
                                    alert("Invalid canvasWidth.");
                                    return;
                                }

                                if (canvasHeight > 5000 || canvasHeight <= 0) {
                                    alert("Invalid canvasHeight.");
                                    return;
                                }

                                var data = {};
                                data.descriptor = "";
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
                                    pt.x = (pt.x - canvasWidth/2) / canvasWidth;
                                    pt.y = (canvasHeight/2 - pt.y) / canvasHeight;
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

                            function decodeData(data) {

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

                                
                                var curves = data.curves;
                                for (var i = 0; i < curves.length; i++) {

                                    var pts = curves[i].pts;
                                    for (var j = 0; j < pts.length; j++) {
                                        denormalise(pts[j]);
                                    }

                                    var interX = curves[i].interX;
                                    denormalise1(interX);

                                    var interY = curves[i].interY;
                                    denormalise1(interY);

                                    var maxima = curves[i].maxima;
                                    denormalise2(maxima);

                                    var minima = curves[i].minima;
                                    denormalise2(minima);
                                }

                                var freeSymbols = data.freeSymbols;
                                for (var j = 0; j < freeSymbols.length; j++) {
                                    denormalise(freeSymbols[j]);
                                }
                            }

                            function drawButton(){
                                // here we define the buttons:
                                // - test, testCase, drawnCase, custom, undo, redo, clear, testCasePrint, drawnCasePrint
                                var buttonTest = $('.test');

                                buttonTest.click(function() {

                                    var params = 'data=' + JSON.stringify(encodeData()),
                                        url = "http://localhost:5000/test",
                                        xhr = new XMLHttpRequest();

                                    xhr.open("POST", url, true);
                                    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                                    xhr.onreadystatechange = function() {
                                        if (xhr.readyState == 4 && xhr.status == 200) {
                                            var data = JSON.parse(xhr.responseText);
                                            
                                            alert(data['isCorrect'] + ": " + data['errCause']);
                                        }
                                    }
                                    xhr.send(params);
                                });

                                var buttonUndo = $('.undo');

                                buttonUndo.click(function() {
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

                                    reDraw();
                                });

                                var buttonRedo = $('.redo');

                                buttonRedo.click(function(event) {
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

                                    reDraw();
                                });

                                var buttonClear = $('.clearAll');

                                buttonClear.click(function() {
                                    curves = [];
                                    clickedKnot = null;

                                    checkPointsUndo = [];
                                    checkPointsRedo = [];

                                    initiateFreeSymbols();
                                    reDraw();
                                });

                            }


                            // export to p5
                            p.setup = setup;
                            p.mousePressed = mousePressed;
                            p.mouseDragged = mouseDragged;
                            p.mouseReleased = mouseReleased;
                            p.mouseClicked = mouseClicked;
                            p.encodeData = encodeData;
                        }
                $rootScope.showGraphSketcher = function(initialState, questionDoc, editorMode) {

                    return new Promise(function(resolve, reject) {

                        $(".result-preview>span").empty();
                        $(".result-preview").width(0);

                        var eqnModal = $('#equationModal');
                        eqnModal.one("opened.fndtn.reveal", function() {
                            element.find(".top-menu").css("bottom", scope.equationEditorElement.height());
                        });

                        eqnModal.foundation("reveal", "open");
                        scope.state = initialState || {
                            
                        };
                        scope.questionDoc = questionDoc;
                        
                        //
                        //
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

                        
                        var p = new p5(scope.sketch, element.find(".graph-sketcher")[0]);
                        scope.p = p;

                        eqnModal.one("closed.fndtn.reveal", function() {
                            p.remove();
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
