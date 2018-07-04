"use strict";
define(function(require) {
    const graphUtils = require("./GraphUtils.js");// TODO MT use injection

    // TODO MT pass in canvas properties and update on resize
    let canvasHeight = window.innerHeight;
    let canvasWidth = window.innerWidth;

    const DOT_LINE_COLOR = [123];
    const MOVE_LINE_COLOR = [135];
    const DEFAULT_KNOT_COLOR = [77,77,77];

    const GRID_WIDTH = 60;
    const PADDING = 0.025 * canvasWidth;
    const DOT_LINE_STEP = 5;


    // TODO MT move this into a "class" where the constructor is given p
    return {
        CURVE_COLORS: [[93,165,218], [250,164,58], [96,189,104], [241,124,176], [241,88,84], [178,118,178]],
        CURVE_STRKWEIGHT: 2,
        KNOT_DETECT_COLOR: [0],

        drawBackground: function(p) {

            function drawHorizontalAxis(curveStrokeWeight) {
                p.push();

                p.strokeWeight(curveStrokeWeight);
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

            function drawVerticalAxis(curveStrokeWeight) {
                p.push();

                p.strokeWeight(curveStrokeWeight);
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

            function drawGrid(curveStrokeWeight) {
                p.push();

                p.noFill();
                p.strokeWeight(curveStrokeWeight);
                p.strokeJoin(p.ROUND);
                p.stroke(240);

                p.push();
                p.translate(0, canvasHeight / 2);
                let num = canvasHeight / (GRID_WIDTH * 2);
                for (let i = 0; i < num; i++) {
                    p.line(0, -i*GRID_WIDTH, canvasWidth, -i*GRID_WIDTH);
                    p.line(0, i*GRID_WIDTH, canvasWidth, i*GRID_WIDTH);
                }
                p.pop();

                p.push();
                p.translate(canvasWidth / 2, 0);
                num = canvasWidth / (GRID_WIDTH * 2);
                for (let i = 0; i < num; i++) {
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

            p.clear();
            p.background(255);

            drawGrid(this.CURVE_STRKWEIGHT);
            drawHorizontalAxis(this.CURVE_STRKWEIGHT);
            drawVerticalAxis(this.CURVE_STRKWEIGHT);
            drawLabel();
        },

        drawCurves: function(p, curves, color) {
            for (let i = 0; i < curves.length; i++) {
                this.drawCurve(p, curves[i], color);
            }
        },

        // given a set of points, draw the corresponding curve.
        drawCurve: function(p, curve, color) {
            if (color == undefined) {
                color = this.CURVE_COLORS[curve.colorIdx];
            }

            p.push();
            p.stroke(color);
            p.strokeWeight(this.CURVE_STRKWEIGHT);


            // want to connect closest points x,y wise, not just x wise
            let pts = curve.pts;
            for (let i = 1; i < pts.length; i++) {
                if (pts[i].x - pts[i-1].x < 100 && pts[i].y - pts[i-1].y < 100) {
                    p.line(pts[i-1].x, pts[i-1].y, pts[i].x, pts[i].y);
                }
            }

            // to here for point connection

            p.pop();

            curve.endPt = graphUtils.findEndPts(curve.pts);
            // draw x intercepts, y intercepts and turning points
            this.drawKnots(p, curve['interX']);
            this.drawKnots(p, curve['interY']);
            this.drawKnots2(p, curve['maxima']);
            this.drawKnots2(p, curve['minima']);
        },

        // given a set of points, draw the corresponding points (knots).
        drawKnot: function(p, knot, color) {
            if (color == undefined) {
                color = DEFAULT_KNOT_COLOR;
            }

            if (knot.symbol != undefined) {
                this.drawSymbol(p, knot.symbol);
            } else {
                p.push();
                p.noFill();
                p.stroke(color);
                p.strokeWeight(1.5);
                p.line(knot.x - 3, knot.y - 3, knot.x + 3, knot.y + 3);
                p.line(knot.x + 3, knot.y - 3, knot.x - 3, knot.y + 3);
                p.pop();
            }
        },

        drawKnots: function(p, knots, color) {
            for (let i = 0; i < knots.length; i++) {
                this.drawKnot(p, knots[i], color);
            }
        },

        drawKnot2: function(p, knot) {
            this.drawKnot(p, knot);

            if (knot.xSymbol != undefined) {
                this.drawVerticalDotLine(p, knot.x, knot.y, canvasHeight/2);
                this.drawSymbol(p, knot.xSymbol);
            }

            if (knot.ySymbol != undefined) {
                this.drawHorizontalDotLine(p, knot.y, knot.x, canvasWidth/2);
                this.drawSymbol(p, knot.ySymbol);
            }
        },

        drawKnots2: function(p, knots) {
            for (let i = 0; i < knots.length; i++) {
                this.drawKnot2(p, knots[i]);
            }
        },

        drawKnotDetect: function(p, knot) {
            p.push();
            p.noFill();
            p.stroke(this.KNOT_DETECT_COLOR);
            p.strokeWeight(2);
            p.line(knot.x - 5, knot.y - 5, knot.x + 5, knot.y + 5);
            p.line(knot.x + 5, knot.y - 5, knot.x - 5, knot.y + 5);
            p.pop();
        },

        // draw symbols, e.g. "A", "B".
        drawSymbol: function(p, symbol, color) {
            if (color == undefined) {
                color = DEFAULT_KNOT_COLOR;
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
        },

        drawSymbols: function(p, symbols, color) {
            for (let i = 0; i < symbols.length; i++) {
                this.drawSymbol(p, symbols[i], color);
            }
        },

        drawVerticalDotLine: function(p, x, begin, end) {
            if (x < 0 || x > canvasWidth) {
                return;
            }

            if (begin > end) {
                let tmp = begin;
                begin = end;
                end = tmp;
            }

            p.push();
            p.stroke(DOT_LINE_COLOR);
            p.strokeWeight(this.CURVE_STRKWEIGHT);

            let step = DOT_LINE_STEP;
            let toDraw = true;
            let y = begin;
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
        },

        drawHorizontalDotLine: function(p, y, begin, end) {
            if (y < 0 || y > canvasHeight) {
                return;
            }

            if (begin > end) {
                let tmp = begin;
                begin = end;
                end = tmp;
            }

            p.push();
            p.stroke(DOT_LINE_COLOR);
            p.strokeWeight(this.CURVE_STRKWEIGHT);

            let step = DOT_LINE_STEP;
            let toDraw = true;
            let x = begin;
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
        },

        drawStretchBox: function(p, idx) {
            if (idx == undefined) {
                return;
            }

            let curve = curves[idx];

            let pts = curve.pts;

            let minX = curve.minX;
            let maxX = curve.maxX;
            let minY = curve.minY;
            let maxY = curve.maxY;

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
        },
    };
});
