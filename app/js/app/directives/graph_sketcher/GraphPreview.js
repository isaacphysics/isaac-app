"use strict";

define(["p5", "./GraphView.js", "./GraphUtils.js", "/partials/graph_sketcher/graph_preview.html"], function(p5, graphViewBuilder, graphUtils, templateUrl) {
    return function() {

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

                    let curves = [];

                    scope.graphView = new graphViewBuilder.graphView(p);

                    // run in the beginning by p5 library
                    function setup() {
                        p.createCanvas(canvasWidth, canvasHeight);
                        p.noLoop();
                        p.cursor(p.HAND);
                        reDraw();
                    }

                    function reDraw() {
                        scope.graphView.drawBackground(canvasWidth, canvasHeight);
                        scope.graphView.drawCurves(curves);
                    }

                    function decodeData(rawData) {
                        let data = graphUtils.clone(rawData);

                        function denormalise(pt) {
                                pt[0] = pt[0] * canvasWidth + canvasWidth/2;
                                pt[1] = canvasHeight/2 - pt[1] * canvasHeight;
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
    };
});
