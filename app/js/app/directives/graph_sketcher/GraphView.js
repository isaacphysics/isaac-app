"use strict";
define(['./GraphUtils.js'], function(graphUtils) {
    let canvasHeight = window.innerHeight;
    let canvasWidth = window.innerWidth;

    const DOT_LINE_COLOR = [123];
    const DEFAULT_KNOT_COLOR = [77,77,77];

    const GRID_WIDTH = 60;
    const PADDING = 0.025 * canvasWidth;
    const DOT_LINE_STEP = 5;

    // self explanatory drawing methods
    class GraphView {
        constructor(p) {
            this.p = p
        }        

        drawCurves(curves, color) {
            for (let i = 0; i < curves.length; i++) {
                this.drawCurve(curves[i], color);
            }
        }

        drawCurve(curve, color) {
            if (color == undefined) {
                color = GraphView.CURVE_COLORS[curve.colorIdx];
            }

            this.p.push();
            this.p.stroke(color);
            this.p.strokeWeight(GraphView.CURVE_STRKWEIGHT);

            // want to connect closest points x,y wise, not just x wise
            let pts = curve.pts;
            for (let i = 1; i < pts.length; i++) {
                if (pts[i].x - pts[i-1].x < 100 && pts[i].y - pts[i-1].y < 100) {
                    this.p.line(pts[i-1].x, pts[i-1].y, pts[i].x, pts[i].y);
                }
            }

            this.p.pop();

            curve.endPt = graphUtils.findEndPts(curve.pts);
            // draw x intercepts, y intercepts and turning points
            this.drawKnots(curve['interX']);
            this.drawKnots(curve['interY']);
            this.drawKnots(curve['maxima']);
            this.drawKnots(curve['minima']);
        }

        drawKnots(knots, color) {
            for (let i = 0; i < knots.length; i++) {
                this.drawKnot(knots[i], color);
            }
        }

        drawKnot(knot, color) {
            if (color == undefined) {
                color = DEFAULT_KNOT_COLOR;
            }
            if (knot.symbol != undefined) {
                this.drawSymbol(knot.symbol);
            } else {
                this.p.push();
                this.p.noFill();
                this.p.stroke(color);
                this.p.strokeWeight(1.5);
                this.p.line(knot.x - 3, knot.y - 3, knot.x + 3, knot.y + 3);
                this.p.line(knot.x + 3, knot.y - 3, knot.x - 3, knot.y + 3);
                this.p.pop();
            }
        }

        drawDetectedKnot(knot) {
            if (typeof knot !==  "undefined") {
                this.p.push();
                this.p.noFill();
                this.p.stroke(GraphView.KNOT_DETECT_COLOR);
                this.p.strokeWeight(2);
                this.p.line(knot.x - 5, knot.y - 5, knot.x + 5, knot.y + 5);
                this.p.line(knot.x + 5, knot.y - 5, knot.x - 5, knot.y + 5);
                this.p.pop();
            }
        }

        drawSymbols(symbols, color) {
            for (let i = 0; i < symbols.length; i++) {
                this.drawSymbol(symbols[i], color);
            }
        }

        drawSymbol(symbol, color) {
            if (color == undefined) {
                color = DEFAULT_KNOT_COLOR;
            }
            this.p.push();

            this.p.stroke(color);
            this.p.strokeWeight(1.5);
            this.p.noFill();
            this.p.line(symbol.x - 3, symbol.y - 3, symbol.x + 3, symbol.y + 3);
            this.p.line(symbol.x + 3, symbol.y - 3, symbol.x - 3, symbol.y + 3);

            this.p.stroke(0);
            this.p.strokeWeight(0.5);
            this.p.fill(0);
            this.p.textSize(16);
            this.p.text(symbol.text, symbol.x - 5, symbol.y + 20);

            this.p.pop();
        }

        drawVerticalDotLine(x, begin, end) {
            if (x < 0 || x > canvasWidth) {
                return;
            }

            if (begin > end) {
                let tmp = begin;
                begin = end;
                end = tmp;
            }

            this.p.push();
            this.p.stroke(DOT_LINE_COLOR);
            this.p.strokeWeight(GraphView.CURVE_STRKWEIGHT);

            let step = DOT_LINE_STEP;
            let toDraw = true;
            let y = begin;
            while (y + step < end) {
                if (toDraw) {
                    this.p.line(x, y, x, y+step);
                }
                y += step;
                toDraw = !toDraw;
            }
            if (toDraw) {
                this.p.line(x, y, x, end);
            }

            this.p.pop();
        }

        drawHorizontalDotLine(y, begin, end) {
            if (y < 0 || y > canvasHeight) {
                return;
            }

            if (begin > end) {
                let tmp = begin;
                begin = end;
                end = tmp;
            }

            this.p.push();
            this.p.stroke(DOT_LINE_COLOR);
            this.p.strokeWeight(GraphView.CURVE_STRKWEIGHT);

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
                this.p.line(x, y, end, y);
            }

            this.p.pop();
        }

        drawStretchBox(idx, curves) {
            if (idx == undefined) {
                return;
            }

            if (curves[idx] == undefined) {
                return;
            }

            let curve = curves[idx];

            let minX = curve.minX;
            let maxX = curve.maxX;
            let minY = curve.minY;
            let maxY = curve.maxY;

            this.p.push();
            this.p.stroke(DOT_LINE_COLOR);
            this.p.strokeWeight(0.5);
            this.p.line(minX, minY, maxX, minY);
            this.p.line(maxX, minY, maxX, maxY);
            this.p.line(maxX, maxY, minX, maxY);
            this.p.line(minX, maxY, minX, minY);

            this.p.fill(255);
            this.p.rect(minX - 4, minY - 4, 8, 8);
            this.p.rect(maxX - 4, minY - 4, 8, 8);
            this.p.rect(minX - 4, maxY - 4, 8, 8);
            this.p.rect(maxX - 4, maxY - 4, 8, 8);
            this.p.triangle((minX + maxX)/2 - 5, minY - 2, (minX + maxX)/2 + 5, minY - 2, (minX + maxX)/2, minY - 7);
            this.p.triangle((minX + maxX)/2 - 5, maxY + 2, (minX + maxX)/2 + 5, maxY + 2, (minX + maxX)/2, maxY + 7);
            this.p.triangle(minX - 2, (minY + maxY) / 2 - 5, minX - 2, (minY + maxY) / 2 + 5, minX - 7, (minY + maxY) / 2);
            this.p.triangle(maxX + 2, (minY + maxY) / 2 - 5, maxX + 2, (minY + maxY) / 2 + 5, maxX + 7, (minY + maxY) / 2); 
            this.p.pop();
        }

        drawHorizontalAxis(curveStrokeWeight, passed_width, passed_height) {
            if (passed_width && passed_height) {
                canvasHeight = passed_height;
                canvasWidth = passed_width;
            }
            this.p.push();

            this.p.strokeWeight(curveStrokeWeight);
            this.p.strokeJoin(this.p.ROUND);
            this.p.stroke(0);
            this.p.noFill();

            let leftMargin = PADDING;
            let rightMargin = canvasWidth - PADDING;

            this.p.beginShape();
            this.p.vertex(leftMargin, canvasHeight/2);
            this.p.vertex(rightMargin, canvasHeight / 2);
            this.p.vertex(rightMargin - 10, canvasHeight / 2 - 5);
            this.p.vertex(rightMargin, canvasHeight / 2);
            this.p.vertex(rightMargin - 10, canvasHeight / 2 + 5);
            this.p.endShape();

            this.p.pop();
        }

        drawVerticalAxis(curveStrokeWeight, passed_width, passed_height) {
            if (passed_width && passed_height) {
                canvasHeight = passed_height;
                canvasWidth = passed_width;
            }
            this.p.push();

            this.p.strokeWeight(curveStrokeWeight);
            this.p.strokeJoin(this.p.ROUND);
            this.p.stroke(0);
            this.p.noFill();

            let upMargin = PADDING;
            let bottomMargin = canvasHeight - PADDING;

            this.p.beginShape();
            this.p.vertex(canvasWidth/2, bottomMargin);
            this.p.vertex(canvasWidth/2, upMargin);
            this.p.vertex(canvasWidth/2 - 5, upMargin + 10);
            this.p.vertex(canvasWidth/2, upMargin);
            this.p.vertex(canvasWidth/2 + 5, upMargin + 10);
            this.p.endShape();

            this.p.pop();
        }

        drawGrid(curveStrokeWeight, passed_width, passed_height) {
            if (passed_width && passed_height) {
                canvasHeight = passed_height;
                canvasWidth = passed_width;
            }
            this.p.push();

            this.p.noFill();
            this.p.strokeWeight(curveStrokeWeight);
            this.p.strokeJoin(this.p.ROUND);
            this.p.stroke(240);

            this.p.push();
            this.p.translate(0, canvasHeight / 2);
            let num = canvasHeight / (GRID_WIDTH * 2);
            for (let i = 0; i < num; i++) {
                this.p.line(0, -i*GRID_WIDTH, canvasWidth, -i*GRID_WIDTH);
                this.p.line(0, i*GRID_WIDTH, canvasWidth, i*GRID_WIDTH);
            }
            this.p.pop();

            this.p.push();
            this.p.translate(canvasWidth / 2, 0);
            num = canvasWidth / (GRID_WIDTH * 2);
            for (let i = 0; i < num; i++) {
                this.p.line(-i*GRID_WIDTH, 0, -i*GRID_WIDTH, canvasHeight);
                this.p.line(i*GRID_WIDTH, 0, i*GRID_WIDTH, canvasHeight);
            }
            this.p.pop();

            this.p.pop();
        }

        drawLabel() {
            this.p.push();

            this.p.textSize(16);
            this.p.stroke(0);
            this.p.strokeWeight(0.5);
            this.p.fill(0);

            this.p.text("O", canvasWidth/2 - 15, canvasHeight/2 + 15);
            this.p.text("x", canvasWidth - PADDING, canvasHeight/2 + 15);
            this.p.text("y", canvasWidth/2 + 5, PADDING);

            this.p.pop();
        }

        drawBackground(passed_width, passed_height) {
            this.p.clear();
            this.p.background(255);

            this.drawGrid(GraphView.CURVE_STRKWEIGHT, passed_width, passed_height);
            this.drawHorizontalAxis(GraphView.CURVE_STRKWEIGHT, passed_width, passed_height);
            this.drawVerticalAxis(GraphView.CURVE_STRKWEIGHT, passed_width, passed_height);
            this.drawLabel();
        }

        drawCorner(stretchMode, c) {
            this.p.push();
            this.p.fill(GraphView.KNOT_DETECT_COLOR);
            switch (stretchMode) {
                case "bottomLeft": {
                    this.p.rect(c.minX - 4, c.minY - 4, 8, 8);
                    break;
                }
                case "bottomRight": {
                    this.p.rect(c.maxX - 4, c.minY - 4, 8, 8);
                    break;
                }
                case "topRight": {
                    this.p.rect(c.maxX - 4, c.maxY - 4, 8, 8);
                    break;
                }
                case "topLeft": {
                    this.p.rect(c.minX - 4, c.maxY - 4, 8, 8);
                    break;
                }
                case "bottomMiddle": {
                    this.p.triangle((c.minX + c.maxX)/2 - 5, c.minY - 2, (c.minX + c.maxX)/2 + 5, c.minY - 2, (c.minX + c.maxX)/2, c.minY - 7);
                    break;
                }
                case "topMiddle": {
                    this.p.triangle((c.minX + c.maxX)/2 - 5, c.maxY + 2, (c.minX + c.maxX)/2 + 5, c.maxY + 2, (c.minX + c.maxX)/2, c.maxY + 7);
                    break;
                }
                case "leftMiddle": {
                    this.p.triangle(c.minX - 2, (c.minY + c.maxY) / 2 - 5, c.minX - 2, (c.minY + c.maxY) / 2 + 5, c.minX - 7, (c.minY + c.maxY) / 2);
                    break;
                }
                case "rightMiddle": {
                    this.p.triangle(c.maxX + 2, (c.minY + c.maxY) / 2 - 5, c.maxX + 2, (c.minY + c.maxY) / 2 + 5, c.maxX + 7, (c.minY + c.maxY) / 2);
                    break;
                }
            }
            this.p.pop();
        }


    }
    GraphView.CURVE_COLORS = [[93,165,218], [250,164,58], [96,189,104], [241,124,176], [241,88,84], [178,118,178]];
    GraphView.CURVE_STRKWEIGHT = 2;
    GraphView.KNOT_DETECT_COLOR = [0];


    // TODO MT pass these in as arguments

    return {graphView: GraphView}
});
