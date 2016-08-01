"use strict";
define(function(require) {
    return ["$timeout", "$rootScope", "api", function($timeout, $rootScope, api) {
        // var b = require('lib/bezier.js');
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
                            var action = undefined;
                            var isMouseDragged;

                            var freeSymbols;
                            var myCanvas;
                            // canvas coefficients
                            var canvasHeight = 600,
                                canvasWidth = 600,
                                gridWidth = 50,
                                strkWeight = 1.5,
                                padding = 15;

                            var colors = [
                                [93, 165, 218],
                                [250, 164, 58],
                                [96, 189, 104],
                                [241, 124, 176],
                                [241, 88, 84],
                                [178, 118, 178]
                            ];

                            // point collection
                            var drawnPts = [],
                                curves = [];

                            // for moving curve
                            var prevMousePt,
                                movedCurveIdx;

                            // for moving symbols
                            var movedSymbol,
                                bindedKnot,
                                symbolType;

                            var clickedKnot = null;

                            var checkPoint,
                                checkPointsUndo = [],
                                checkPointsRedo = [];



                            // run in the beginning by p5 library
                            p.setup = function() {
                              console.debug("here 138");
                                p.createCanvas(canvasWidth, canvasHeight);
                                console.debug("here 140");
                                // p.noLoop();
                                // p.cursor(CROSS);
                                console.debug("here 143");
                                p.drawBackground();
                                console.debug("Called draw background");
                                p.refreshFreeSymbols();
                                console.debug("Called refresh free symbols");
                                p.drawSymbols(freeSymbols);
                                p.drawButton();
                            }



                            p.drawBackground = function() {
                                console.debug("here 153");
                                var drawHorizontalAxis = function() {

                                    p.push();

                                    p.strokeWeight(p.strkWeight);

                                    p.strokeJoin(p.ROUND);

                                    p.stroke(0);
                                    p.noFill();

                                    var leftMargin = p.padding;
                                    var rightMargin = p.canvasWidth - p.padding;

                                    p.beginShape();

                                    p.vertex(leftMargin, p.canvasHeight / 2);
                                    p.vertex(rightMargin, p.canvasHeight / 2);
                                    p.vertex(rightMargin - 10, p.canvasHeight / 2 - 5);
                                    p.vertex(rightMargin, p.canvasHeight / 2);
                                    p.vertex(rightMargin - 10, p.canvasHeight / 2 + 5);
                                    p.endShape();

                                    p.pop();
                                }

                                var drawVerticalAxis = function() {
                                    p.push();

                                    p.strokeWeight(p.strkWeight);
                                    p.strokeJoin(p.ROUND);
                                    p.stroke(0);
                                    p.noFill();

                                    var upMargin = padding;
                                    var bottomMargin = p.canvasHeight - padding;

                                    p.beginShape();
                                    p.vertex(canvasWidth / 2, bottomMargin);
                                    p.vertex(canvasWidth / 2, upMargin);
                                    p.vertex(canvasWidth / 2 - 5, upMargin + 10);
                                    p.vertex(canvasWidth / 2, upMargin);
                                    p.vertex(canvasWidth / 2 + 5, upMargin + 10);
                                    p.endShape();

                                    p.pop();
                                }

                                var drawGrid = function() {
                                  console.debug("inside draw grid");
                                    p.push();

                                    p.noFill();
                                    p.strokeWeight(p.strkWeight);

                                    p.strokeJoin(p.ROUND);

                                    p.stroke(215);

                                    p.push();
                                    p.translate(0, p.canvasHeight / 2);
                                    var num = p.canvasHeight / (p.gridWidth * 2);

                                    for (var i = 0; i < num; i++) {
                                        line(0, -i * gridWidth, canvasWidth, -i * gridWidth);
                                        line(0, i * gridWidth, canvasWidth, i * gridWidth);
                                    }
                                    p.pop();

                                    p.push();
                                    p.translate(p.canvasWidth / 2, 0);
                                    var num = p.canvasWidth / (p.gridWidth * 2);
                                    for (var i = 0; i < num; i++) {
                                        line(-i * gridWidth, 0, -i * gridWidth, canvasHeight);
                                        line(i * gridWidth, 0, i * gridWidth, canvasHeight);
                                    }
                                    p.pop();

                                    p.pop();
                                }

                                var drawLabel = function() {
                                    p.push();

                                    p.textSize(16);
                                    p.stroke(0);
                                    p.strokeWeight(0.5);
                                    p.fill(0);

                                    p.text("O", canvasWidth / 2 - 15, canvasHeight / 2 + 15);
                                    p.text("x", canvasWidth - 12, canvasHeight / 2 + 15);
                                    p.text("y", canvasWidth / 2 + 5, 12);

                                    p.pop();
                                }

                                var drawScale = function() {
                                    var len = 3;

                                    p.push();
                                    p.strokeWeight(1);
                                    p.stroke(0);
                                    p.textSize(12);

                                    p.push();
                                    p.translate(0, canvasHeight / 2);
                                    var num = canvasHeight / (gridWidth * 2);
                                    for (var i = 1; i < num; i++) {
                                        line(canvasWidth / 2 - len, -i * gridWidth, canvasWidth / 2 + len, -i * gridWidth);
                                        line(canvasWidth / 2 - len, i * gridWidth, canvasWidth / 2 + len, i * gridWidth);
                                        text(i, canvasWidth / 2 + 5, -i * gridWidth + 5);
                                        text(-i, canvasWidth / 2 + 5, i * gridWidth + 5);
                                    }
                                    p.pop();

                                    p.push();
                                    p.translate(canvasWidth / 2, 0);
                                    var num = canvasWidth / (gridWidth * 2);
                                    for (var i = 1; i < num; i++) {
                                        line(-i * gridWidth, canvasHeight / 2 - len, -i * gridWidth, canvasHeight / 2 + len);
                                        line(i * gridWidth, canvasHeight / 2 - len, i * gridWidth, canvasHeight / 2 + len);
                                        text(-i, -i * gridWidth - 5, canvasHeight / 2 + 15);
                                        text(i, i * gridWidth - 5, canvasHeight / 2 + 15);
                                    }
                                    p.pop();

                                    p.pop();
                                }

                                p.clear();
                                console.debug("here 276");
                                p.background(255);
                                console.debug("here 278");
                                drawGrid();
                                console.debug("here 280");
                                drawHorizontalAxis();
                                console.debug("here 286");
                                drawVerticalAxis();
                                console.debug("here 288");
                                drawLabel();
                                console.debug("here 290");
                            }


                            // given a set of points, draw the corresponding curve.
                            p.drawCurve = function(curve, color){
                                if (color == undefined)
                                    color = curve.color;

                                p.push();
                                p.stroke(color);
                                p.strokeWeight(strkWeight);

                                var pts = curve.pts;
                                for (var i = 1; i < pts.length; i++) {
                                    line(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
                                }

                                p.pop();

                                // draw x intercepts, y intercepts and turning points
                                p.drawKnots(curve['interX']);
                                p.drawKnots(curve['interY']);
                                p.drawKnots(curve['maxima']);
                                p.drawKnots(curve['minima']);
                                p.drawKnots2(curve['maxima']);
                                p.drawKnots2(curve['minima']);

                            }

                            p.drawCurves = function(curves, color) {
                                for (var i = 0; i < curves.length; i++)
                                    p.drawCurve(curves[i], color);
                            }


                            // given a set of points, draw the corresponding points (knots).
                            p.drawKnot = function(knot, color) {
                                if (color == undefined)
                                    p.color = [77, 77, 77];

                                if (knot.symbol != undefined) {
                                    p.drawSymbol(knot.symbol);
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

                            p.drawKnots = function(knots, color) {
                                for (var i = 0; i < knots.length; i++) {
                                    p.drawKnot(knots[i], color);
                                }
                            }

                            p.drawKnot2 = function(knot, color) {
                                if (color == undefined) p.color = 123;

                                if (knot.xSymbol != undefined) {
                                    p.drawVerticalDotLine(knot.x, knot.y, canvasHeight / 2);
                                    p.drawSymbol(knot.xSymbol);
                                }

                                if (knot.ySymbol != undefined) {
                                    p.drawHorizontalDotLine(knot.y, knot.x, canvasWidth / 2);
                                    p.drawSymbol(knot.ySymbol);
                                }
                            }

                            p.drawKnots2 = function(knots, color) {
                                for (var i = 0; i < knots.length; i++) {
                                    p.drawKnot2(knots[i], color);
                                }
                            }

                            p.drawKnot3 = function(knot, color) {
                                if (knot == null) return;
                                if (color == undefined) color = 123;

                                p.drawVerticalDotLine(knot.x, knot.y, canvasHeight / 2);
                                p.drawHorizontalDotLine(knot.y, knot.x, canvasWidth / 2);

                                if (knot.xSymbol != undefined) {
                                    p.drawSymbol(knot.xSymbol);
                                } else {
                                    p.drawKnot(createPoint(knot.x, canvasHeight / 2));
                                }

                                if (knot.ySymbol != undefined) {
                                    p.drawSymbol(knot.ySymbol);
                                } else {
                                    p.drawKnot(createPoint(canvasWidth / 2, knot.y));
                                }
                            }

                            // draw symbols, e.g. "A", "B".
                            p.drawSymbol = function(symbol, color) {
                                if (color == undefined) color = [77, 77, 77];

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

                            p.drawSymbols = function(symbols, color) {
                                for (var i = 0; i < symbols.length; i++) {
                                    p.drawSymbol(symbols[i], color);
                                }
                            }

                            p.drawVerticalDotLine = function(x, begin, end, color) {
                                if (x < 0 || x > canvasWidth) return;
                                if (color == undefined) color = 123;

                                if (begin > end) {
                                    var tmp = begin;
                                    p.begin = end;
                                    p.end = tmp;
                                }

                                p.push();
                                p.stroke(color);
                                p.strokeWeight(1.5);

                                var step = 5;
                                var toDraw = true;
                                var y = begin;
                                while (y + step < end) {
                                    if (toDraw) {
                                        p.line(x, y, x, y + step);
                                    }
                                    y += step;
                                    toDraw = !toDraw;
                                }
                                if (toDraw) line(x, y, x, end);

                                p.pop();
                            }

                            p.drawHorizontalDotLine= function(y, begin, end, color) {
                                if (y < 0 || y > canvasHeight) return;

                                if (color == undefined) color = 123;

                                if (begin > end) {
                                    var tmp = begin;
                                    begin = end;
                                    end = tmp;
                                }

                                push();
                                stroke(color);
                                strokeWeight(1.5);

                                var step = 5;
                                var toDraw = true;
                                var x = begin;
                                while (x + step < end) {
                                    if (toDraw) {
                                        line(x, y, x + step, y);
                                    }
                                    x += step;
                                    toDraw = !toDraw;
                                }
                                if (toDraw) line(x, y, end, y);

                                pop();
                            }



                            // given a curve, translate the curve
                            p.transCurve = function(curve, dx, dy) {
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

                                refreshFreeSymbols();
                                return;
                            }



                            p.mousePressed = function() {
                                var current = createPoint(mouseX, mouseY);
                                mousePressedPt = current;
                                isMouseDragged = false;
                                action = undefined;
                                movedSymbol = undefined;
                                bindedKnot = undefined;
                                symbolType = undefined;
                                drawnPts = [];

                                if (current.x < 0 || current.x > canvasWidth || current.y < 0 || current.y > canvasHeight) return;

                                checkPoint = {};
                                checkPoint.freeSymbolsJSON = JSON.stringify(freeSymbols);
                                checkPoint.curvesJSON = JSON.stringify(curves);

                                for (var i = 0; i < freeSymbols.length; i++) {
                                    if (getDist(current, freeSymbols[i]) < 10) {
                                        movedSymbol = freeSymbols[i];
                                        freeSymbols.splice(i, 1);
                                        action = "MOVE_SYMBOL";
                                        return;
                                    }
                                }

                                for (var i = 0; i < curves.length; i++) {
                                    var interX = curves[i]['interX'];
                                    for (var j = 0; j < interX.length; j++) {
                                        if (interX[j].symbol != undefined && getDist(current, interX[j]) < 10) {
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
                                        if (interY[j].symbol != undefined && getDist(current, interY[j]) < 10) {
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

                                        if (knot.symbol != undefined && getDist(current, knot.symbol) < 10) {
                                            movedSymbol = knot.symbol;
                                            knot.symbol = undefined;
                                            bindedKnot = knot;
                                            symbolType = 'symbol';
                                            action = "MOVE_SYMBOL";
                                            return;
                                        }

                                        if (knot.xSymbol != undefined && getDist(current, knot.xSymbol) < 10) {
                                            movedSymbol = knot.xSymbol;
                                            knot.xSymbol = undefined;
                                            bindedKnot = knot;
                                            symbolType = 'xSymbol';
                                            action = "MOVE_SYMBOL";
                                            return;
                                        }

                                        if (knot.ySymbol != undefined && getDist(current, knot.ySymbol) < 10) {
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

                                        if (knot.symbol != undefined && getDist(current, knot) < 10) {
                                            movedSymbol = knot.symbol;
                                            knot.symbol = undefined;
                                            bindedKnot = knot;
                                            symbolType = 'symbol';
                                            action = "MOVE_SYMBOL";
                                            return;
                                        }

                                        if (knot.xSymbol != undefined && getDist(current, knot.xSymbol) < 10) {
                                            movedSymbol = knot.xSymbol;
                                            knot.xSymbol = undefined;
                                            bindedKnot = knot;
                                            symbolType = 'xSymbol';
                                            action = "MOVE_SYMBOL";
                                            return;
                                        }

                                        if (knot.ySymbol != undefined && getDist(current, knot.ySymbol) < 10) {
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
                                        if (getDist(pts[j], current) < 10) {
                                            movedCurveIdx = i;
                                            action = "MOVE_CURVE";
                                            prevMousePt = current;
                                            drawCurve(curves[i], [135]);
                                            return;
                                        }
                                    }
                                }

                                if (curves.length < colors.length) {
                                    action = "DRAW_CURVE";
                                } else {
                                    alert("Too much lines being drawn.");
                                    checkPointsUndo.pop();
                                }

                            }

                            p.mouseDragged = function() {
                                isMouseDragged = true;
                                var current = createPoint(mouseX, mouseY);

                                if (action == "MOVE_CURVE") {
                                    var dx = current.x - prevMousePt.x;
                                    var dy = current.y - prevMousePt.y;
                                    transCurve(curves[movedCurveIdx], dx, dy);
                                    prevMousePt = current;

                                    drawBackground();
                                    for (var i = 0; i < curves.length; i++) {
                                        if (i == movedCurveIdx) {
                                            drawCurve(curves[i], 135);
                                        } else {
                                            drawCurve(curves[i]);
                                        }
                                    }
                                    drawSymbols(freeSymbols);
                                    drawKnot3(clickedKnot);


                                } else if (action == "MOVE_SYMBOL") {
                                    movedSymbol.x = current.x;
                                    movedSymbol.y = current.y;

                                    drawBackground();
                                    drawCurves(curves);
                                    drawSymbols(freeSymbols);
                                    drawSymbol(movedSymbol, 151);
                                    drawKnot3(clickedKnot);


                                    for (var i = 0; i < curves.length; i++) {
                                        var interX = curves[i]['interX'];
                                        for (var j = 0; j < interX.length; j++) {
                                            if (interX[j].symbol == undefined && getDist(current, interX[j]) < 10) {
                                                drawKnot(interX[j], 151);
                                                return;
                                            }
                                        }

                                        var interY = curves[i]['interY'];
                                        for (var j = 0; j < interY.length; j++) {
                                            if (interY[j].symbol == undefined && getDist(current, interY[j]) < 10) {
                                                drawKnot(interY[j], 151);
                                                return;
                                            }
                                        }

                                        var maxima = curves[i]['maxima'];
                                        for (var j = 0; j < maxima.length; j++) {
                                            var knot = maxima[j];
                                            if (knot.symbol == undefined && getDist(current, knot) < 10) {
                                                drawKnot(knot, 151);
                                                return;
                                            }
                                        }

                                        var minima = curves[i]['minima'];
                                        for (var j = 0; j < minima.length; j++) {
                                            var knot = minima[j];
                                            if (knot.symbol == undefined && getDist(current, knot) < 10) {
                                                drawKnot(knot, 151);
                                                return;
                                            }
                                        }
                                    }

                                    if (clickedKnot != null) {
                                        var knot = clickedKnot;

                                        if (knot.xSymbol == undefined && getDist(current, createPoint(knot.x, canvasHeight / 2)) < 10) {
                                            drawKnot(createPoint(knot.x, canvasHeight / 2), 151);
                                            return;
                                        }

                                        if (knot.ySymbol == undefined && getDist(current, createPoint(canvasWidth / 2, knot.y)) < 10) {
                                            drawKnot(createPoint(canvasWidth / 2, knot.y), 151);
                                            return;
                                        }
                                    }


                                } else if (action == "DRAW_CURVE") {
                                    push();
                                    stroke(colors[curves.length]);
                                    strokeWeight(strkWeight);
                                    if (drawnPts.length > 0) {
                                        var prev = drawnPts[drawnPts.length - 1];
                                        line(prev.x, prev.y, current.x, current.y);
                                    }
                                    pop();

                                    drawnPts.push(current);
                                }
                            }

                            p.mouseReleased = function() {
                                var current = createPoint(mouseX, mouseY);

                                // if it is just a click
                                if (!isMouseDragged) return;

                                if (action == "MOVE_CURVE") {
                                    checkPointsUndo.push(checkPoint);
                                    checkPointsRedo = [];
                                    drawCurve(curves[movedCurveIdx]);
                                } else if (action == "MOVE_SYMBOL") {
                                    checkPointsUndo.push(checkPoint);
                                    checkPointsRedo = [];

                                    var found = false;

                                    for (var i = 0; i < curves.length; i++) {
                                        var interX = curves[i]['interX'];
                                        for (var j = 0; j < interX.length; j++) {
                                            if (interX[j].symbol == undefined && getDist(current, interX[j]) < 10) {
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
                                            if (interY[j].symbol == undefined && getDist(current, interY[j]) < 10) {
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

                                            if (knot.symbol == undefined && getDist(current, knot) < 10) {
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

                                            if (knot.symbol == undefined && getDist(current, knot) < 10) {
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
                                        if (knot.xSymbol == undefined && getDist(current, createPoint(knot.x, canvasHeight / 2)) < 10) {
                                            movedSymbol.x = knot.x;
                                            movedSymbol.y = canvasHeight / 2;
                                            knot.xSymbol = movedSymbol;
                                            found = true;
                                        } else if (knot.ySymbol == undefined && getDist(current, createPoint(canvasWidth / 2, knot.y)) < 10) {
                                            movedSymbol.x = canvasWidth / 2;
                                            movedSymbol.y = knot.y;
                                            knot.ySymbol = movedSymbol;
                                            found = true;
                                        }
                                    }

                                    if (!found) {
                                        freeSymbols.push(movedSymbol);
                                    }


                                    drawBackground();
                                    drawCurves(curves);
                                    refreshFreeSymbols();
                                    drawSymbols(freeSymbols);
                                    drawKnot3(clickedKnot);

                                } else if (action == "DRAW_CURVE") {
                                    // neglect if curve drawn is too short
                                    if (sample(drawnPts).length < 3) {
                                        return;
                                    }

                                    checkPointsUndo.push(checkPoint);
                                    checkPointsRedo = [];

                                    if (Math.abs(drawnPts[0].y - canvasHeight / 2) < 0.01 * canvasHeight)
                                        drawnPts[0].y = canvasHeight / 2;
                                    if (Math.abs(drawnPts[0].x - canvasWidth / 2) < 0.01 * canvasWidth)
                                        drawnPts[0].x = canvasWidth / 2;
                                    if (Math.abs(drawnPts[drawnPts.length - 1].y - canvasHeight / 2) < 0.01 * canvasHeight)
                                        drawnPts[drawnPts.length - 1].y = canvasHeight / 2;
                                    if (Math.abs(drawnPts[drawnPts.length - 1].x - canvasWidth / 2) < 0.01 * canvasWidth)
                                        drawnPts[drawnPts.length - 1].x = canvasWidth / 2;


                                    var pts = genericBezier(sample(drawnPts));
                                    var curve = {};
                                    curve.pts = pts;
                                    curve.interX = findInterceptX(pts);
                                    curve.interY = findInterceptY(pts);
                                    curve.maxima = findMaxima(pts);
                                    curve.minima = findMinima(pts);
                                    curve.color = colors[curves.length];
                                    curves.push(curve);


                                    drawnPts = [];
                                    drawBackground();
                                    drawCurves(curves);
                                    refreshFreeSymbols();
                                    drawSymbols(freeSymbols);
                                    drawKnot3(clickedKnot);
                                }

                                return;
                            }

                            p.mouseClicked = function() {
                                var current = createPoint(mouseX, mouseY);
                                if (isMouseDragged) return;

                                if (action == "MOVE_SYMBOL") {
                                    if (bindedKnot == undefined) {
                                        freeSymbols.push(movedSymbol);
                                    } else {
                                        bindedKnot[symbolType] = movedSymbol;
                                    }
                                    drawBackground();
                                    drawCurves(curves);
                                    refreshFreeSymbols();
                                    drawSymbols(freeSymbols);
                                    drawKnot3(clickedKnot);
                                } else if (action == "MOVE_CURVE") {
                                    drawBackground();
                                    drawCurves(curves);
                                    drawSymbols(freeSymbols);
                                    drawKnot3(clickedKnot);
                                }

                                if (current.x < 0 || current.x > canvasWidth || current.y < 0 || current.y > canvasHeight) return;

                                for (var i = 0; i < curves.length; i++) {
                                    var maxima = curves[i].maxima;
                                    for (var j = 0; j < maxima.length; j++) {
                                        var knot = maxima[j];
                                        if (getDist(current, knot) < 10) {
                                            drawBackground();
                                            drawCurves(curves);
                                            drawSymbols(freeSymbols);

                                            if (knot == clickedKnot) {
                                                clickedKnot = null;
                                            } else {
                                                clickedKnot = knot;
                                                drawKnot3(knot);
                                            }

                                            return;
                                        }
                                    }

                                    var minima = curves[i].minima;
                                    for (var j = 0; j < minima.length; j++) {
                                        var knot = minima[j];
                                        if (getDist(current, knot) < 10) {
                                            drawBackground();
                                            drawCurves(curves);
                                            drawSymbols(freeSymbols);

                                            if (knot == clickedKnot) {
                                                clickedKnot = null;
                                            } else {
                                                clickedKnot = knot;
                                                drawKnot3(knot);
                                            }

                                            return;
                                        }
                                    }
                                }


                                if (clickedKnot != null) {
                                    clickedKnot = null;
                                    drawBackground();
                                    drawCurves(curves);
                                    refreshFreeSymbols();
                                    drawSymbols(freeSymbols);
                                }


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
