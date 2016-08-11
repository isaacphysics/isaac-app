define(function(require) {

    return ["$timeout", "$rootScope", "api", function($timeout, $rootScope, api) {

        return {
            scope: {
                state: "=",
                questionDoc: "=",  
            },

            restrict: "A",
            templateUrl: "/partials/graph_sketcher/graph_input.html",
            link: function(scope, element, attrs) {

              scope.edit = function() {
                  $rootScope.showGraphSketcher(scope.state, scope.questionDoc, scope.editorMode).then(function(finalState) {
                      console.debug("finalState: ", finalState);
                      scope.state = finalState;
                      scope.$apply();

                      
                      if (scope.isTherePreviousAnswer) {
                          if (scope.preview == undefined) {

                              scope.preview = new p5(scope.sketch, document.getElementById("graphPreview"));
                          }
                          scope.preview.decodeData(scope.state);
                      }
                  });
              };

              var b = require('lib/graph_sketcher/bezier.js');
              var f = require('lib/graph_sketcher/func.js');
              var s = require('lib/graph_sketcher/sampler.js');

              scope.sketch = function(p) {

                  // canvas coefficients
                  var canvasHeight = document.getElementById("graphPreview").offsetHeight;
                  var canvasWidth = document.getElementById("graphPreview").offsetWidth;

                  var GRID_WIDTH = 50,
                      CURVE_STRKWEIGHT = 2,
                      PADDING = 0.025 * canvasWidth,
                      DOT_LINE_STEP = 5,
                      MOUSE_DETECT_RADIUS = 5;
                      
                  var CURVE_COLORS = [[93,165,218], [250,164,58], [96,189,104], [241,124,176], [241,88,84], [178,118,178]],
                      KNOT_COLOR = [77,77,77],
                      DOT_LINE_COLOR = [123],
                      MOVE_LINE_COLOR = [135],
                      MOVE_SYMBOL_COLOR = [151],
                      KNOT_DETECT_COLOR = [151];

                  var freeSymbols = [],
                      curves = [];

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

                  function drawKnot4(knot, color) {
                      if (color == undefined) {
                          color = KNOT_COLOR;
                      }

                      p.push();
                      p.noFill();
                      p.stroke(color);
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

                  function clone(obj) {
                      var json = JSON.stringify(obj);
                      return JSON.parse(json);
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

                          var interX = curves[i].interX;
                          denormalise1(interX);

                          var interY = curves[i].interY;
                          denormalise1(interY);

                          var maxima = curves[i].maxima;
                          denormalise2(maxima);

                          var minima = curves[i].minima;
                          denormalise2(minima);
                      }

                      // freeSymbols = data.freeSymbols;
                      // for (var j = 0; j < freeSymbols.length; j++) {
                      //     denormalise(freeSymbols[j]);
                      // }

                      reDraw();
                  }


                  // export
                  p.setup = setup;
                  p.decodeData = decodeData;
              }

              
              if (scope.isTherePreviousAnswer) {
                  scope.preview = new p5(scope.sketch, document.getElementById("graphPreview"));
                  scope.preview.decodeData(scope.state);
              }

              scope.isTherePreviousAnswer = function() {
                  return (scope.state.curves != undefined && scope.state.freeSymbols != undefined );
              }

            }


        };
    }];
});
