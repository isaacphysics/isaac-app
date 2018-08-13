"use strict";

define(["p5", "../../../lib/graph_sketcher/bezier.js", "../../../lib/graph_sketcher/func.js", "../../../lib/graph_sketcher/sampler.js", "/partials/graph_sketcher/graph_preview.html"], function(p5, _b, f, _s, templateUrl) {
    return ["$timeout", "$rootScope", "api", function(_$timeout, _$rootScope, _api) {

        return {
            scope: {
                state: "=",
                questionDoc: "=",
            },

            restrict: "A",
            templateUrl: templateUrl,
            link: function(scope, element, _attrs) {
                let graphPreviewDiv = element.find(".graph-preview");

                scope.canvasID = scope.questionDoc.id;

                scope.sketch = function(p) {

                    // canvas coefficients
                    let canvasHeight = graphPreviewDiv.height();
                    let canvasWidth = graphPreviewDiv.width();

                    let CURVE_STRKWEIGHT = 2;
                    let PADDING = 0.025 * canvasWidth;
                        
                    let CURVE_COLORS = [[93,165,218], [250,164,58], [96,189,104], [241,124,176], [241,88,84], [178,118,178]];
                    let KNOT_COLOR = [77,77,77];

                    let freeSymbols = [];
                    let curves = [];

                    function initiateFreeSymbols() {
                        freeSymbols = [];
                        freeSymbols.push(f.createSymbol('A'));
                        freeSymbols.push(f.createSymbol('B'));
                        freeSymbols.push(f.createSymbol('C'));
                    }

                    // run in the beginning by p5 library
                    function setup() {
                        p.createCanvas(canvasWidth, canvasHeight);
                        p.noLoop();
                        p.cursor(p.HAND);


                        initiateFreeSymbols();
                        reDraw();
                    }

                    function reDraw() {
                        drawBackground();
                        drawCurves(curves);
                    }

                    function drawBackground() {

                        function drawHorizontalAxis() {
                            p.push();
                            
                            p.strokeWeight(CURVE_STRKWEIGHT);
                            p.strokeJoin(p.ROUND);
                            p.stroke(0);
                            p.noFill();

                            let leftMargin = PADDING;
                            let rightMargin = canvasWidth - PADDING;

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

                            let upMargin = PADDING;
                            let bottomMargin = canvasHeight - PADDING;

                            p.beginShape();
                            p.vertex(canvasWidth/2, bottomMargin);
                            p.vertex(canvasWidth/2, upMargin);
                            p.vertex(canvasWidth/2 - 5, upMargin + 10);
                            p.vertex(canvasWidth/2, upMargin);
                            p.vertex(canvasWidth/2 + 5, upMargin + 10);
                            p.endShape();
                            
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

                        // p5.clear, p5.background
                        p.clear();
                        p.background(255);

                        // drawGrid();
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

                        let pts = curve.pts;
                        for (let i = 1; i < pts.length; i++) {
                            p.line(pts[i-1].x, pts[i-1].y, pts[i].x, pts[i].y);
                        }
                        
                        p.pop();

                        // draw x intercepts, y intercepts and turning points
                        drawKnots(curve['interX']);
                        drawKnots(curve['interY']);
                        drawKnots2(curve['maxima']);
                        drawKnots2(curve['minima']);

                    }

                    function drawCurves(theCurves, color) {
                        for (let i = 0; i < theCurves.length; i++) {
                            drawCurve(theCurves[i], color);    
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
                        for (let i = 0; i < knots.length; i++) {
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
                        for (let i = 0; i < knots.length; i++) {
                            drawKnot2(knots[i]);
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

                    function clone(obj) {
                        let json = JSON.stringify(obj);
                        return JSON.parse(json);
                    }
                  
                    function decodeData(rawData) {
                        let data = clone(rawData);

                        function denormalise(pt) {
                                pt.x = pt.x * canvasWidth + canvasWidth/2;
                                pt.y = canvasHeight/2 - pt.y * canvasHeight;
                            }

                        function denormalise1(knots) {
                            for (let j = 0; j < knots.length; j++) {
                                let knot = knots[j];
                                denormalise(knot);
                                if (knot.symbol != undefined) {
                                    denormalise(knot.symbol);
                                }
                            }
                        }

                        function denormalise2(knots) {
                            denormalise1(knots);
                            for (let j = 0; j < knots.length; j++) {
                                let knot = knots[j];
                                if (knot.xSymbol != undefined) {
                                    denormalise(knot.xSymbol);
                                }
                                if (knot.ySymbol != undefined) {
                                    denormalise(knot.ySymbol);
                                }
                            }
                        }

                        
                        curves = data.curves;
                        for (let i = 0; i < curves.length; i++) {

                            let pts = curves[i].pts;
                            for (let j = 0; j < pts.length; j++) {
                                denormalise(pts[j]);
                            }

                            let interX = curves[i].interX;
                            denormalise1(interX);

                            let interY = curves[i].interY;
                            denormalise1(interY);

                            let maxima = curves[i].maxima;
                            denormalise2(maxima);

                            let minima = curves[i].minima;
                            denormalise2(minima);
                        }

                        reDraw();
                    }


                    // export
                    p.setup = setup;
                    p.decodeData = decodeData;
                }

                scope.updateGraphPreview = function() {
                    if (scope.preview == undefined) {
                        scope.preview = new p5(scope.sketch, graphPreviewDiv[0]);
                    }
                    if (scope.state != undefined && scope.state.curves != undefined) {
                        scope.preview.decodeData(scope.state);
                    }
                }


                scope.updateGraphPreview();

                scope.$watch("state", function(_newState, _oldState) {
                    scope.updateGraphPreview();
                })
            }

        };
    }];
});
