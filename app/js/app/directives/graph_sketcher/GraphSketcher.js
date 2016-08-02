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
                            symbols: []
                        };
                        scope.questionDoc = questionDoc;
                        scope.editorMode = editorMode;


                        scope.log = {
                            type: "EQN_EDITOR_LOG",
                            questionId: scope.questionDoc ? scope.questionDoc.id : null,
                            screenSize: {
                                width: window.innerWidth,
                                height: window.innerHeight
                            },
                            actions: [{
                                event: "OPEN",
                                timestamp: Date.now()
                            }]
                        };

                        // Log just before the page closes if tab/browser closed:
                        window.addEventListener("beforeunload", scope.logOnClose);
                        // Log the editor being closed and submit log event to server:
                        eqnModal.one("close", function(e) {
                            scope.log.finalState = [];
                            sketch.symbols.forEach(function(e) {
                                scope.log.finalState.push(e.subtreeObject(true, true));
                            });
                            scope.log.actions.push({
                                event: "CLOSE",
                                timestamp: Date.now()
                            });
                            if (scope.segueEnvironment == "DEV") {
                                console.log("\nLOG: ~" + (JSON.stringify(scope.log).length / 1000).toFixed(2) + "kb\n\n", JSON.stringify(scope.log));
                            }
                            window.removeEventListener("beforeunload", scope.logOnClose);
                            api.logger.log(scope.log);
                            scope.log = null;
                        });

                        scope.history = [JSON.parse(JSON.stringify(scope.state))];
                        scope.historyPtr = 0;
                        //element.find("canvas").remove();


                        scope.future = [];

                        var sketch = function(p) {
                          // func.getDist();

                          // canvas coefficients
                          var canvasHeight = 600,
                            canvasWidth = 600;

                          var GRID_WIDTH = 50,
                            CURVE_STRKWEIGHT = 1.5,
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
                          var drawnPts = [];

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


                          p.initiateFreeSymbols = function() {
                            freeSymbols = [];
                            freeSymbols.push(f.createSymbol('A'));
                            freeSymbols.push(f.createSymbol('B'));
                            freeSymbols.push(f.createSymbol('C'));

                          }

                          // run in the beginning by p5 library
                          p.setup = function(){
                            // p5.createCanvas
                            p.createCanvas(canvasWidth, canvasHeight);
                            p.noLoop();
                            p.cursor(p.CROSS);

                            p.initiateFreeSymbols();

                            p.reDraw();
                            console.debug("here");
                            p.drawButton();
                          }

                          p.drawBackground = function() {

                            function drawHorizontalAxis() {
                              // p5.strokeWeight, p5.strokeJoin, p5.ROUND, p5.stroke, p5.noFill, p5.beginShape, p5.vertex, p5.endShape, p5.push, p5.pop
                              p.push();

                              p.strokeWeight(CURVE_STRKWEIGHT);
                              p.strokeJoin(ROUND);
                              p.stroke(0);
                              p.noFill();

                              var leftMargin = PADDING;
                              var rightMargin = canvasWidth - PADDING;

                              beginShape();
                              vertex(leftMargin, canvasHeight/2);
                              vertex(rightMargin, canvasHeight / 2);
                              vertex(rightMargin - 10, canvasHeight / 2 - 5);
                              vertex(rightMargin, canvasHeight / 2);
                              vertex(rightMargin - 10, canvasHeight / 2 + 5);
                              endShape();

                              pop();
                            }

                            function drawVerticalAxis() {
                              // p5.strokeWeight, p5.strokeJoin, p5.ROUND, p5.stroke, p5.noFill, p5.beginShape, p5.vertex, p5.endShape, p5.push, p5.pop

                              push();

                              strokeWeight(CURVE_STRKWEIGHT);
                              strokeJoin(ROUND);
                              stroke(0);
                              noFill();

                              var upMargin = PADDING;
                              var bottomMargin = canvasHeight - PADDING;

                              beginShape();
                              vertex(canvasWidth/2, bottomMargin);
                              vertex(canvasWidth/2, upMargin);
                              vertex(canvasWidth/2 - 5, upMargin + 10);
                              vertex(canvasWidth/2, upMargin);
                              vertex(canvasWidth/2 + 5, upMargin + 10);
                              endShape();

                              pop();
                            }

                            function drawGrid() {
                              // p5.strokeWeight, p5.strokeJoin, p5.ROUND, p5.stroke, p5.translate, p5.line, p5.push, p5.pop
                              push();

                              noFill();
                              strokeWeight(CURVE_STRKWEIGHT);
                              strokeJoin(ROUND);
                              stroke(215);

                              push();
                              translate(0, canvasHeight / 2);
                              var num = canvasHeight / (GRID_WIDTH * 2);
                              for (var i = 0; i < num; i++) {
                                line(0, -i*GRID_WIDTH, canvasWidth, -i*GRID_WIDTH);
                                line(0, i*GRID_WIDTH, canvasWidth, i*GRID_WIDTH);
                              }
                              pop();

                              push();
                              translate(canvasWidth / 2, 0);
                              var num = canvasWidth / (GRID_WIDTH * 2);
                              for (var i = 0; i < num; i++) {
                                line(-i*GRID_WIDTH, 0, -i*GRID_WIDTH, canvasHeight);
                                line(i*GRID_WIDTH, 0, i*GRID_WIDTH, canvasHeight);
                              }
                              pop();

                              pop();
                            }

                            function drawLabel() {
                              // p5.push, p5.textSize, p5.stroke, p5.strokeWeight, p5.fill, p5.text, p5.pop
                              push();

                              textSize(16);
                              stroke(0);
                              strokeWeight(0.5);
                              fill(0);

                              text("O", canvasWidth/2 - 15, canvasHeight/2 + 15);
                              text("x", canvasWidth - 12, canvasHeight/2 + 15);
                              text("y", canvasWidth/2 + 5, 12);

                              pop();
                            }

                            // function drawScale() {
                            // 	var len = 3;

                            // 	push();
                            // 	strokeWeight(1);
                            // 	stroke(0);
                            // 	textSize(12);

                            // 	push();
                            // 	translate(0, canvasHeight / 2);
                            // 	var num = canvasHeight / (GRID_WIDTH * 2);
                            // 	for (var i = 1; i < num; i++) {
                            // 		line(canvasWidth/2 -len, -i*GRID_WIDTH, canvasWidth/2 + len, -i*GRID_WIDTH);
                            // 		line(canvasWidth/2 - len, i*GRID_WIDTH, canvasWidth/2 + len, i*GRID_WIDTH);
                            // 		text(i, canvasWidth/2 + 5, -i * GRID_WIDTH + 5);
                            // 		text(-i, canvasWidth/2 + 5, i * GRID_WIDTH + 5);
                            // 	}
                            // 	pop();

                            // 	push();
                            // 	translate(canvasWidth / 2, 0);
                            // 	var num = canvasWidth / (GRID_WIDTH * 2);
                            // 	for (var i = 1; i < num; i++) {
                            // 		line(-i*GRID_WIDTH, canvasHeight/2 - len, -i*GRID_WIDTH, canvasHeight / 2 + len);
                            // 		line(i*GRID_WIDTH, canvasHeight/2 - len, i*GRID_WIDTH, canvasHeight /2 + len);
                            // 		text(-i, -i * GRID_WIDTH - 5, canvasHeight / 2 + 15);
                            // 		text(i, i * GRID_WIDTH - 5, canvasHeight / 2 + 15);
                            // 	}
                            // 	pop();

                            // 	pop();
                            // }



                            // p5.clear, p5.background
                            clear();
                            background(255);
                            drawGrid();
                            drawHorizontalAxis();
                            drawVerticalAxis();
                            drawLabel();
                          }

                          // given a set of points, draw the corresponding curve.
                          function drawCurve(curve, color) {
                            if (color == undefined) {
                              color = curve.color;
                            }

                            push();
                            stroke(color);
                            strokeWeight(CURVE_STRKWEIGHT);

                            var pts = curve.pts;
                            for (var i = 1; i < pts.length; i++) {
                              line(pts[i-1].x, pts[i-1].y, pts[i].x, pts[i].y);
                            }

                            pop();

                            // draw x intercepts, y intercepts and turning points
                            drawKnots(curve['interX']);
                            drawKnots(curve['interY']);
                            drawKnots(curve['maxima']);
                            drawKnots(curve['minima']);
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
                              push();
                              noFill();
                              stroke(color);
                              strokeWeight(1.5);
                              line(knot.x - 3, knot.y - 3, knot.x + 3, knot.y + 3);
                              line(knot.x + 3, knot.y - 3, knot.x - 3, knot.y + 3);
                              pop();
                            }
                          }

                          function drawKnots(knots, color) {
                            for (var i = 0; i < knots.length; i++) {
                              drawKnot(knots[i], color);
                            }
                          }

                          function drawKnot2(knot) {
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
                              drawKnot(createPoint(knot.x, canvasHeight/2));
                            }

                            if (knot.ySymbol != undefined) {
                              drawSymbol(knot.ySymbol);
                            } else {
                              drawKnot(createPoint(canvasWidth/2, knot.y));
                            }
                          }

                          // draw symbols, e.g. "A", "B".
                          function drawSymbol(symbol, color) {
                            if (color == undefined) {
                              color = KNOT_COLOR;
                            }

                            push();

                            stroke(color);
                            strokeWeight(1.5);
                            noFill();
                            line(symbol.x - 3, symbol.y - 3, symbol.x + 3, symbol.y + 3);
                            line(symbol.x + 3, symbol.y - 3, symbol.x - 3, symbol.y + 3);

                            stroke(0);
                            strokeWeight(0.5);
                            fill(0);
                            textSize(14);
                            text(symbol.text, symbol.x - 4, symbol.y + 20);

                            pop();
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

                            push();
                            stroke(DOT_LINE_COLOR);
                            strokeWeight(CURVE_STRKWEIGHT);

                            var step = DOT_LINE_STEP;
                            var toDraw = true;
                            var y = begin;
                            while (y + step < end) {
                              if (toDraw) {
                                line(x, y, x, y+step);
                              }
                              y += step;
                              toDraw = !toDraw;
                            }
                            if (toDraw) {
                              line(x, y, x, end);
                            }

                            pop();
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

                            push();
                            stroke(DOT_LINE_COLOR);
                            strokeWeight(CURVE_STRKWEIGHT);

                            var step = DOT_LINE_STEP;
                            var toDraw = true;
                            var x = begin;
                            while (x + step < end) {
                              if (toDraw) {
                                line(x, y, x+step, y);
                              }
                              x += step;
                              toDraw = !toDraw;
                            }
                            if (toDraw) {
                              line(x, y, end, y);
                            }

                            pop();
                          }

                          p.reDraw = function() {

                            function refreshFreeSymbols() {
                              var start = 15,
                                separation = 30;

                              for (var i = 0; i < freeSymbols.length; i++) {
                                var symbol = freeSymbols[i];
                                symbol.x = start + i * separation;
                                symbol.y = start;
                              }
                            }

                            p.drawBackground();
                            console.log("here");
                            drawCurves(curves);
                            refreshFreeSymbols();
                            drawSymbols(freeSymbols);
                            drawKnot3(clickedKnot);
                          }

                          function findInterceptX(pts) {
                            if (pts.length == 0) return [];

                            var intercepts = [];

                            if (pts[0].y == canvasHeight/2) intercepts.push(pts[0]);
                            for (var i = 1; i < pts.length; i++) {
                              if (pts[i].y == canvasHeight/2) {
                                intercepts.push(createPoint(pts[i].x, pts[i].y));
                                continue;
                              }

                              if ((pts[i-1].y - canvasHeight/2) * (pts[i].y - canvasHeight/2) < 0) {
                                var dx = pts[i].x - pts[i-1].x;
                                var dy = pts[i].y - pts[i-1].y;
                                var grad = dy/dx;
                                var esti = pts[i-1].x + (1 / grad) * (canvasHeight/2 - pts[i-1].y);
                                intercepts.push(createPoint(esti, canvasHeight/2));
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
                                intercepts.push(createPoint(pts[i].x, pts[i].y));
                                continue;
                              }

                              if ((pts[i-1].x - canvasWidth/2) * (pts[i].x - canvasWidth/2) < 0) {
                                var dx = pts[i].x - pts[i-1].x;
                                var dy = pts[i].y - pts[i-1].y;
                                var grad = dy/dx;
                                var esti = pts[i-1].y + grad * (canvasWidth/2 - pts[i-1].x);
                                intercepts.push(createPoint(canvasWidth/2, esti));
                              }
                            }

                            return intercepts;
                          }

                          function findMaxima(pts) {
                            if (pts.length == 0) return [];

                            var maxima = [];

                            var grad = [];
                            for (var i = 0; i < pts.length - 1; i++) {
                              var dx = pts[i+1].x - pts[i].x;
                              var dy = pts[i+1].y - pts[i].y;
                              grad.push(dy/dx);
                            }

                            for (var i = 1; i < grad.length; i++) {
                              if (grad[i-1] != NaN && grad[i] != NaN) {
                                if (grad[i] * grad[i-1] < 0 && (pts[i].x - pts[i-1].x) * (pts[i+1].x - pts[i].x) > 0) {

                                  var l = i-1;
                                  while (l >= 0 && getDist(pts[l], pts[i]) < 15) l--;
                                  if (l < 0) continue;
                                  var dy = pts[i].y - pts[l].y;
                                  var dx = pts[i].x - pts[l].x;
                                  var grad1 = dy/dx;

                                  var r = i+1;
                                  while (r < pts.length && getDist(pts[r], pts[i]) < 15) r++;
                                  if (r >= pts.length) continue;
                                  var dy = pts[r].y - pts[i].y;
                                  var dx = pts[r].x - pts[i].x;
                                  var grad2 = dy/dx;

                                  if (Math.abs(grad1) > 0.03 && Math.abs(grad2) > 0.03) {
                                    if ((pts[i].x > pts[i-1].x && grad1 < 0 && grad2 > 0) || (pts[i].x < pts[i-1].x && grad1 > 0 && grad2 < 0)) {
                                      maxima.push(createPoint(pts[i].x, pts[i].y));
                                    }
                                  }
                                }
                              }
                            }

                            return maxima;
                          }

                          function findMinima(pts) {
                            if (pts.length == 0) return [];

                            var minima = [];

                            var grad = [];
                            for (var i = 0; i < pts.length - 1; i++) {
                              var dx = pts[i+1].x - pts[i].x;
                              var dy = pts[i+1].y - pts[i].y;
                              grad.push(dy/dx);
                            }

                            for (var i = 1; i < grad.length; i++) {
                              if (grad[i-1] != NaN && grad[i] != NaN) {
                                if (grad[i] * grad[i-1] < 0 && (pts[i].x - pts[i-1].x) * (pts[i+1].x - pts[i].x) > 0) {

                                  var l = i-1;
                                  while (l >= 0 && getDist(pts[l], pts[i]) < 15) l--;
                                  if (l < 0) continue;
                                  var dy = pts[i].y - pts[l].y;
                                  var dx = pts[i].x - pts[l].x;
                                  var grad1 = dy/dx;

                                  var r = i+1;
                                  while (r < pts.length && getDist(pts[r], pts[i]) < 15) r++;
                                  if (r >= pts.length) continue;
                                  var dy = pts[r].y - pts[i].y;
                                  var dx = pts[r].x - pts[i].x;
                                  var grad2 = dy/dx;

                                  if (Math.abs(grad1) > 0.03 && Math.abs(grad2) > 0.03) {
                                    if ((pts[i].x > pts[i-1].x && grad1 > 0 && grad2 < 0) || (pts[i].x < pts[i-1].x && grad1 < 0 && grad2 > 0)) {
                                      minima.push(createPoint(pts[i].x, pts[i].y));
                                    }
                                  }
                                }
                              }
                            }

                            return minima;
                          }


                          // given a curve, translate the curve
                          function transCurve(curve, dx, dy) {
                            var pts = curve.pts;
                            for (var i = 0; i < pts.length; i++) {
                              pts[i].x += dx;
                              pts[i].y += dy;
                            }

                            var maxima = curve.maxima;
                            for (var i = 0; i < maxima.length; i++) {
                              var knot = maxima[i];

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

                            var minima = curve.minima;
                            for (var i = 0; i < minima.length; i++) {
                              var knot = minima[i];

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

                            var interX = curve.interX,
                              newInterX = findInterceptX(pts);
                            for (var i = 0; i < interX.length; i++) {
                              if (interX[i].symbol != undefined) {
                                var symbol = interX[i].symbol;

                                var found = false,
                                  min = 50,
                                  knot;
                                for (var j = 0; j < newInterX.length; j++) {
                                  if (getDist(interX[i], newInterX[j]) < min) {
                                    min = getDist(interX[i], newInterX[j]);
                                    knot = newInterX[j];
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
                            curve.interX = newInterX;

                            var interY = curve.interY,
                              newInterY = findInterceptY(pts);
                            for (var i = 0; i < interY.length; i++) {
                              if (interY[i].symbol != undefined) {
                                var symbol = interY[i].symbol;

                                var found = false,
                                  min = 50,
                                  knot;
                                for (var j = 0; j < newInterY.length; j++) {
                                  if (getDist(interY[i], newInterY[j]) < min) {
                                    min = getDist(interY[i], newInterY[j]);
                                    knot = newInterY[j];
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
                            curve.interY = newInterY;

                            return;
                          }



                          function mousePressed() {
                            var current = createPoint(mouseX, mouseY);
                            isMouseDragged = false;
                            action = undefined;

                            movedSymbol = undefined;
                            bindedKnot = undefined;
                            symbolType = undefined;

                            drawnPts = [];

                            movedCurveIdx = undefined;
                            prevMousePt = undefined;

                            if (current.x < 0 || current.x > canvasWidth || current.y < 0 || current.y > canvasHeight) return;

                            checkPoint = {};
                            checkPoint.freeSymbolsJSON = JSON.stringify(freeSymbols);
                            checkPoint.curvesJSON = JSON.stringify(curves);

                            for (var i = 0; i < freeSymbols.length; i++) {
                              if (getDist(current, freeSymbols[i]) < MOUSE_DETECT_RADIUS) {
                                movedSymbol = freeSymbols[i];
                                freeSymbols.splice(i, 1);
                                action = "MOVE_SYMBOL";
                                return;
                              }
                            }

                            for (var i = 0; i < curves.length; i++) {
                              var interX = curves[i]['interX'];
                              for (var j = 0; j < interX.length; j++) {
                                if (interX[j].symbol != undefined && getDist(current, interX[j]) < MOUSE_DETECT_RADIUS) {
                                  movedSymbol = interX[j].symbol;
                                  interX[j].symbol = undefined;
                                  bindedKnot = knot;
                                  symbolType = 'symbol';
                                  action = "MOVE_SYMBOL";
                                  return;
                                }
                              }

                              var interY = curves[i]['interY'];
                              for (var j = 0; j < interY.length; j++) {
                                if (interY[j].symbol != undefined && getDist(current, interY[j]) < MOUSE_DETECT_RADIUS) {
                                  movedSymbol = interY[j].symbol;
                                  interY[j].symbol = undefined;
                                  bindedKnot = knot;
                                  symbolType = 'symbol';
                                  action = "MOVE_SYMBOL";
                                  return;
                                }
                              }

                              var maxima = curves[i]['maxima'];
                              for (var j = 0; j < maxima.length; j++) {
                                var knot = maxima[j];

                                if (knot.symbol != undefined && getDist(current, knot.symbol) < MOUSE_DETECT_RADIUS) {
                                  movedSymbol = knot.symbol;
                                  knot.symbol = undefined;
                                  bindedKnot = knot;
                                  symbolType = 'symbol';
                                  action = "MOVE_SYMBOL";
                                  return;
                                }

                                if (knot.xSymbol != undefined && getDist(current, knot.xSymbol) < MOUSE_DETECT_RADIUS) {
                                  movedSymbol = knot.xSymbol;
                                  knot.xSymbol = undefined;
                                  bindedKnot = knot;
                                  symbolType = 'xSymbol';
                                  action = "MOVE_SYMBOL";
                                  return;
                                }

                                if (knot.ySymbol != undefined && getDist(current, knot.ySymbol) < MOUSE_DETECT_RADIUS) {
                                  movedSymbol = knot.ySymbol;
                                  knot.ySymbol = undefined;
                                  bindedKnot = knot;
                                  symbolType = 'ySymbol';
                                  action = "MOVE_SYMBOL";
                                  return;
                                }

                              }

                              var minima = curves[i]['minima'];
                              for (var j = 0; j < minima.length; j++) {
                                var knot = minima[j];

                                if (knot.symbol != undefined && getDist(current, knot) < MOUSE_DETECT_RADIUS) {
                                  movedSymbol = knot.symbol;
                                  knot.symbol = undefined;
                                  bindedKnot = knot;
                                  symbolType = 'symbol';
                                  action = "MOVE_SYMBOL";
                                  return;
                                }

                                if (knot.xSymbol != undefined && getDist(current, knot.xSymbol) < MOUSE_DETECT_RADIUS) {
                                  movedSymbol = knot.xSymbol;
                                  knot.xSymbol = undefined;
                                  bindedKnot = knot;
                                  symbolType = 'xSymbol';
                                  action = "MOVE_SYMBOL";
                                  return;
                                }

                                if (knot.ySymbol != undefined && getDist(current, knot.ySymbol) < MOUSE_DETECT_RADIUS) {
                                  movedSymbol = knot.ySymbol;
                                  knot.ySymbol = undefined;
                                  bindedKnot = knot;
                                  symbolType = 'ySymbol';
                                  action = "MOVE_SYMBOL";
                                  return;
                                }

                              }

                            }


                            for (var i = 0; i < curves.length; i++) {
                              var pts = curves[i].pts;
                              for (var j = 0; j < pts.length; j++) {
                                if (getDist(pts[j], current) < MOUSE_DETECT_RADIUS) {
                                  movedCurveIdx = i;
                                  action = "MOVE_CURVE";
                                  prevMousePt = current;
                                  drawCurve(curves[i], MOVE_LINE_COLOR);
                                  return;
                                }
                              }
                            }

                            if (curves.length < CURVE_COLORS.length) {
                              action = "DRAW_CURVE";
                            } else {
                              alert("Too much lines being drawn.");
                              checkPointsUndo.pop();
                            }

                          }

                          function mouseDragged() {
                            isMouseDragged = true;
                            var current = createPoint(mouseX, mouseY);

                            if (action == "MOVE_CURVE") {
                              var dx = current.x - prevMousePt.x;
                              var dy = current.y - prevMousePt.y;
                              transCurve(curves[movedCurveIdx], dx, dy);
                              prevMousePt = current;

                              reDraw();
                              drawCurve(curves[movedCurveIdx], MOVE_LINE_COLOR);

                            } else if (action == "MOVE_SYMBOL") {
                              movedSymbol.x = current.x;
                              movedSymbol.y = current.y;

                              reDraw();
                              drawSymbol(movedSymbol, MOVE_SYMBOL_COLOR);

                              for (var i = 0; i < curves.length; i++) {
                                var interX = curves[i]['interX'];
                                for (var j = 0; j < interX.length; j++) {
                                  if (interX[j].symbol == undefined && getDist(current, interX[j]) < MOUSE_DETECT_RADIUS) {
                                    drawKnot(interX[j], KNOT_DETECT_COLOR);
                                    return;
                                  }
                                }

                                var interY = curves[i]['interY'];
                                for (var j = 0; j < interY.length; j++) {
                                  if (interY[j].symbol == undefined && getDist(current, interY[j]) < MOUSE_DETECT_RADIUS) {
                                    drawKnot(interY[j], KNOT_DETECT_COLOR);
                                    return;
                                  }
                                }

                                var maxima = curves[i]['maxima'];
                                for (var j = 0; j < maxima.length; j++) {
                                  var knot = maxima[j];
                                  if (knot.symbol == undefined && getDist(current, knot) < MOUSE_DETECT_RADIUS) {
                                    drawKnot(knot, KNOT_DETECT_COLOR);
                                    return;
                                  }
                                }

                                var minima = curves[i]['minima'];
                                for (var j = 0; j < minima.length; j++) {
                                  var knot = minima[j];
                                  if (knot.symbol == undefined && getDist(current, knot) < MOUSE_DETECT_RADIUS) {
                                    drawKnot(knot, KNOT_DETECT_COLOR);
                                    return;
                                  }
                                }
                              }

                              if (clickedKnot != null) {
                                var knot = clickedKnot;

                                if (knot.xSymbol == undefined && getDist(current, createPoint(knot.x, canvasHeight/2)) < MOUSE_DETECT_RADIUS) {
                                  drawKnot(createPoint(knot.x, canvasHeight/2), KNOT_DETECT_COLOR);
                                  return;
                                }

                                if (knot.ySymbol == undefined && getDist(current, createPoint(canvasWidth/2, knot.y)) < MOUSE_DETECT_RADIUS) {
                                  drawKnot(createPoint(canvasWidth/2, knot.y), KNOT_DETECT_COLOR);
                                  return;
                                }
                              }


                            } else if (action == "DRAW_CURVE") {
                              push();
                              stroke(CURVE_COLORS[curves.length]);
                              strokeWeight(CURVE_STRKWEIGHT);
                              if (drawnPts.length > 0) {
                                var prev = drawnPts[drawnPts.length - 1];
                                line(prev.x, prev.y, current.x, current.y);
                              }
                              pop();

                              drawnPts.push(current);
                            }
                          }

                          function mouseReleased() {
                            var current = createPoint(mouseX, mouseY);

                            // if it is just a click
                            if (!isMouseDragged) return;

                            if (action == "MOVE_CURVE") {
                              checkPointsUndo.push(checkPoint);
                              checkPointsRedo = [];
                              reDraw();
                            } else if (action == "MOVE_SYMBOL") {
                              checkPointsUndo.push(checkPoint);
                              checkPointsRedo = [];

                              var found = false;

                              for (var i = 0; i < curves.length; i++) {
                                var interX = curves[i]['interX'];
                                for (var j = 0; j < interX.length; j++) {
                                  if (interX[j].symbol == undefined && getDist(current, interX[j]) < MOUSE_DETECT_RADIUS) {
                                    knot = interX[j];
                                    movedSymbol.x = knot.x;
                                    movedSymbol.y = knot.y;
                                    knot.symbol = movedSymbol;
                                    found = true;
                                    break;
                                  }
                                }
                                if (found) break;

                                var interY = curves[i]['interY'];
                                for (var j = 0; j < interY.length; j++) {
                                  if (interY[j].symbol == undefined && getDist(current, interY[j]) < MOUSE_DETECT_RADIUS) {
                                    knot = interY[j];
                                    movedSymbol.x = knot.x;
                                    movedSymbol.y = knot.y;
                                    knot.symbol = movedSymbol;
                                    found = true;
                                    break;
                                  }
                                }
                                if (found) break;

                                var maxima = curves[i]['maxima'];
                                for (var j = 0; j < maxima.length; j++) {
                                  var knot = maxima[j];

                                  if (knot.symbol == undefined && getDist(current, knot) < MOUSE_DETECT_RADIUS) {
                                    movedSymbol.x = knot.x;
                                    movedSymbol.y = knot.y;
                                    knot.symbol = movedSymbol;
                                    found = true;
                                    break;
                                  }
                                }
                                if (found) break;


                                var minima = curves[i]['minima'];
                                for (var j = 0; j < minima.length; j++) {
                                  var knot = minima[j];

                                  if (knot.symbol == undefined && getDist(current, knot) < MOUSE_DETECT_RADIUS) {
                                    movedSymbol.x = knot.x;
                                    movedSymbol.y = knot.y;
                                    knot.symbol = movedSymbol;
                                    found = true;
                                    break;
                                  }
                                }
                                if (found) break;
                              }

                              if (clickedKnot != null) {
                                var knot = clickedKnot;
                                if (knot.xSymbol == undefined && getDist(current, createPoint(knot.x, canvasHeight/2)) < MOUSE_DETECT_RADIUS) {
                                  movedSymbol.x = knot.x;
                                  movedSymbol.y = canvasHeight/2;
                                  knot.xSymbol = movedSymbol;
                                  found = true;
                                } else if (knot.ySymbol == undefined && getDist(current, createPoint(canvasWidth/2, knot.y)) < MOUSE_DETECT_RADIUS) {
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
                              if (sample(drawnPts).length < 3) {
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

                              var pts = genericBezier(sample(drawnPts));
                              var curve = {};
                              curve.pts = pts;
                              curve.interX = findInterceptX(pts);
                              curve.interY = findInterceptY(pts);
                              curve.maxima = findMaxima(pts);
                              curve.minima = findMinima(pts);
                              curve.color = CURVE_COLORS[curves.length];
                              curves.push(curve);


                              drawnPts = [];
                              reDraw();
                            }

                            return;
                          }

                          function mouseClicked() {
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

                            var current = createPoint(mouseX, mouseY);

                            if (current.x < 0 || current.x > canvasWidth || current.y < 0 || current.y > canvasHeight) {
                              return;
                            }

                            for (var i = 0; i < curves.length; i++) {
                              var maxima = curves[i].maxima;
                              for (var j = 0; j < maxima.length; j++) {
                                var knot = maxima[j];
                                if (getDist(current, knot) < MOUSE_DETECT_RADIUS) {
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
                                if (getDist(current, knot) < MOUSE_DETECT_RADIUS) {
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

                          function encodeData() {

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


                            for (var i = 0; i < clonedCurves.length; i++) {
                              var pts = clonedCurves[i].pts;
                              for (var j = 0; j < pts.length; j++) {
                                pts[j].x = (pts[j].x - canvasWidth/2) / canvasWidth;
                                pts[j].y = (canvasHeight/2 - pts[j].y) / canvasHeight;
                              }

                              var interX = clonedCurves[i].interX;
                              for (var j = 0; j < interX.length; j++) {
                                var knot = interX[j];
                                knot.x = (knot.x - canvasWidth/2) / canvasWidth;
                                knot.y = (canvasHeight/2 - knot.y) / canvasHeight;
                                if (knot.symbol != undefined) {
                                  var symbol = knot.symbol;
                                  symbol.x = (symbol.x - canvasWidth/2) / canvasWidth;
                                  symbol.y = (canvasHeight/2 - symbol.y) / canvasHeight;
                                }
                              }

                              var interY = clonedCurves[i].interY;
                              for (var j = 0; j < interY.length; j++) {
                                var knot = interY[j];
                                knot.x = (knot.x - canvasWidth/2) / canvasWidth;
                                knot.y = (canvasHeight/2 - knot.y) / canvasHeight;
                                if (knot.symbol != undefined) {
                                  var symbol = knot.symbol;
                                  symbol.x = (symbol.x - canvasWidth/2) / canvasWidth;
                                  symbol.y = (canvasHeight/2 - symbol.y) / canvasHeight;
                                }
                              }

                              var maxima = clonedCurves[i].maxima;
                              for (var j = 0; j < maxima.length; j++) {
                                var knot = maxima[j];
                                knot.x = (knot.x - canvasWidth/2) / canvasWidth;
                                knot.y = (canvasHeight/2 - knot.y) / canvasHeight;
                                if (knot.symbol != undefined) {
                                  var symbol = knot.symbol;
                                  symbol.x = (symbol.x - canvasWidth/2) / canvasWidth;
                                  symbol.y = (canvasHeight/2 - symbol.y) / canvasHeight;
                                }
                              }

                              var minima = clonedCurves[i].minima;
                              for (var j = 0; j < minima.length; j++) {
                                var knot = minima[j];
                                knot.x = (knot.x - canvasWidth/2) / canvasWidth;
                                knot.y = (canvasHeight/2 - knot.y) / canvasHeight;
                                if (knot.symbol != undefined) {
                                  var symbol = knot.symbol;
                                  symbol.x = (symbol.x - canvasWidth/2) / canvasWidth;
                                  symbol.y = (canvasHeight/2 - symbol.y) / canvasHeight;
                                }
                              }
                            }

                            data.curves = clonedCurves;

                            var clonedFreeSymbols = clone(freeSymbols);
                            for (var i = 0; i < clonedFreeSymbols.length; i++) {
                              var symbol = clonedFreeSymbols[i];
                              symbol.x = (symbol.x - canvasWidth/2) / canvasWidth;
                              symbol.y = (canvasHeight/2 - symbol.y) / canvasHeight;
                            }
                            data.freeSymbols = clonedFreeSymbols;

                            return data;
                          }

                           p.decodeData = function(data) {

                            var curves = data.curves;
                            for (var i = 0; i < curves.length; i++) {
                              var pts = curves[i].pts;
                              for (var j = 0; j < pts.length; j++) {
                                pts[j].x = pts[j].x * canvasWidth + canvasWidth/2;
                                pts[j].y = canvasHeight/2 - pts[j].y * canvasHeight;
                              }


                              // 4 duplicated codes

                              var interX = curves[i].interX;
                              for (var j = 0; j < interX.length; j++) {
                                var knot = interX[j];
                                knot.x = knot.x * canvasWidth + canvasWidth/2;
                                knot.y = canvasHeight/2 - knot.y * canvasHeight;
                                if (knot.symbol != undefined) {
                                  var symbol = knot.symbol;
                                  symbol.x = symbol.x * canvasWidth + canvasWidth/2;
                                  symbol.y = canvasHeight/2 - symbol.y * canvasHeight;
                                }
                              }

                              var interY = curves[i].interY;
                              for (var j = 0; j < interY.length; j++) {
                                var knot = interY[j];
                                knot.x = knot.x * canvasWidth + canvasWidth/2;
                                knot.y = canvasHeight/2 - knot.y * canvasHeight;
                                if (knot.symbol != undefined) {
                                  var symbol = knot.symbol;
                                  symbol.x = symbol.x * canvasWidth + canvasWidth/2;
                                  symbol.y = canvasHeight/2 - symbol.y * canvasHeight;
                                }
                              }


                              var maxima = curves[i].maxima;
                              for (var j = 0; j < maxima.length; j++) {
                                var knot = maxima[j];
                                knot.x = knot.x * canvasWidth + canvasWidth/2;
                                knot.y = canvasHeight/2 - knot.y * canvasHeight;
                                if (knot.symbol != undefined) {
                                  var symbol = knot.symbol;
                                  symbol.x = symbol.x * canvasWidth + canvasWidth/2;
                                  symbol.y = canvasHeight/2 - symbol.y * canvasHeight;
                                }
                              }


                              var minima = curves[i].minima;
                              for (var j = 0; j < minima.length; j++) {
                                var knot = minima[j];
                                knot.x = knot.x * canvasWidth + canvasWidth/2;
                                knot.y = canvasHeight/2 - knot.y * canvasHeight;
                                if (knot.symbol != undefined) {
                                  var symbol = knot.symbol;
                                  symbol.x = symbol.x * canvasWidth + canvasWidth/2;
                                  symbol.y = canvasHeight/2 - symbol.y * canvasHeight;
                                }
                              }
                            }

                            var freeSymbols = data.freeSymbols;
                            for (var j = 0; j < freeSymbols.length; j++) {
                              freeSymbols[j].x = freeSymbols[j].x * canvasWidth + canvasWidth/2;
                              freeSymbols[j].y = canvasHeight/2 - freeSymbols[j].y * canvasHeight;
                            }

                          }


                          p.drawButton = function() {
                            var upper = 20;
                            var bottom = 680;

                            var buttonTest = createButton("test");
                            buttonTest.position(450, upper);
                            buttonTest.mousePressed(function() {
                              var params = 'data=' + JSON.stringify(encodeData()),
                              url = "http://localhost:5000/test",
                              xhr = new XMLHttpRequest();

                              xhr.open("POST", url, true);
                              xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                              xhr.onreadystatechange = function() {
                                if (xhr.readyState == 4 && xhr.status == 200) {
                                  var data = JSON.parse(xhr.responseText);
                                  console.log(data);
                                  alert(data['isCorrect'] + ": " + data['errCause']);
                                }
                              }
                              xhr.send(params);
                            });

                            var buttonTestcase = createButton("show test case");
                            buttonTestcase.position(50, bottom);
                            buttonTestcase.mousePressed(function () {
                              var url = '/json/test.json';
                              var xhr = new XMLHttpRequest();
                              xhr.open("GET", url, true);
                              xhr.onreadystatechange = function() {
                                if (xhr.readyState == 4 && xhr.status == 200) {
                                  var data = JSON.parse(xhr.responseText);
                                  decodeData(data);

                                  var freeSymbols = data.freeSymbols;
                                  var curves = data.curves;

                                  drawCurves(curves);
                                  drawSymbols(freeSymbols);
                                }
                              }
                              xhr.send();
                            });

                            var buttonDrawnCase = createButton("show drawn case");
                            buttonDrawnCase.position(150, bottom);
                            buttonDrawnCase.mousePressed(function () {
                              var url = '/json/drawn.json';
                              var xhr = new XMLHttpRequest();
                              xhr.open("GET", url, true);
                              xhr.onreadystatechange = function() {
                                if (xhr.readyState == 4 && xhr.status == 200) {
                                  var data = JSON.parse(xhr.responseText);
                                  decodeData(data);

                                  var freeSymbols = data.freeSymbols;
                                  var curves = data.curves;

                                  drawCurves(curves);
                                  drawSymbols(freeSymbols);
                                }
                              }
                              xhr.send();
                            });


                            var buttonShape = createButton("custom");
                            buttonShape.position(50, upper);
                            buttonShape.mousePressed( function() {
                              //
                            });


                            // redo and undo is essentially the reverse of each other.

                            var buttonUndo = createButton("undo");
                            buttonUndo.position(500, upper);
                            buttonUndo.mousePressed(function() {
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

                            var buttonRedo = createButton("redo");
                            buttonRedo.position(550, upper);
                            buttonRedo.mousePressed(function() {
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

                            var buttonClear = createButton('clear');
                            buttonClear.position(600, upper);
                            buttonClear.mousePressed(function() {
                              curves = [];
                              clickedKnot = null;

                              checkPointsUndo = [];
                              checkPointsRedo = [];

                              initiateFreeSymbols();
                              reDraw();
                            });

                            var buttonPrintTest = createButton("print test case");
                            buttonPrintTest.position(450, bottom);
                            buttonPrintTest.mousePressed(function() {
                              var data = encodeData();
                              var params = "data=" + JSON.stringify(data);

                              var url = '/print_test';
                              var xhr = new XMLHttpRequest();
                              xhr.open("GET", url + "?" + params, true);
                              xhr.onreadystatechange = function() {
                                if (xhr.readyState == 4 && xhr.status == 200) {
                                  alert(xhr.responseText);
                                }
                              }
                              xhr.send();
                            });

                            var buttonPrintDrawn = createButton("print drawn case");
                            buttonPrintDrawn.position(550, bottom);
                            buttonPrintDrawn.mousePressed(function() {
                              var data = encodeData();
                              var params = "data=" + JSON.stringify(data);

                              var url = '/print_drawn';
                              var xhr = new XMLHttpRequest();
                              xhr.open("GET", url + "?" + params, true);
                              xhr.onreadystatechange = function() {
                                if (xhr.readyState == 4 && xhr.status == 200) {
                                  alert(xhr.responseText);
                                }
                              }
                              xhr.send();
                            });
                          }








                        }
                        var p = new p5(sketch, element.find(".equation-editor")[0]);

                        eqnModal.one("closed.fndtn.reveal", function() {
                            sketch.p.remove();
                            resolve(scope.state);
                        });

                    });
                };




                scope.submit = function() {
                    $("#equationModal").foundation("reveal", "close");
                };

                scope.centre = function() {
                    sketch.centre();
                }




            }
        };
    }];
});
