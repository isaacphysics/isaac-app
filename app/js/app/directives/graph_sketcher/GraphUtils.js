"use strict";
define(function(require) {

    const SAMPLE_INTERVAL = 10;

    return {

        getDist: function(pt1, pt2) {
            return Math.sqrt(Math.pow(pt1.x - pt2.x, 2) + Math.pow(pt1.y - pt2.y, 2));
        },

        createPoint: function(x, y, c) {
            var obj = {};
            obj.ind = c;
            obj.x = x;
            obj.y = y;
            return obj;
        },

        createSymbol: function(text, x, y) {
            var obj = {};
            obj.text = text;
            obj.x = x;
            obj.y = y;
            return obj;
        },

        sample: function(pts) {
            var sampled = [];
            sampled.push(pts[0]);
            var i = 0;
            var j = 0;
            while (i < pts.length) {
                // func.getDist
                
                while (j < pts.length && this.getDist(pts[i], pts[j]) < SAMPLE_INTERVAL) {
                    j += 1;
                }

                if (j < pts.length) {
                    sampled.push(pts[j]);
                }

                i = j;
            }
            sampled.push(pts[pts.length - 1]);
            return sampled;
        },

        findEndPts: function(pts) {
            if (pts.length == 0) return [];

            let ends = [];

            ends.push(this.createPoint(pts[0].x, pts[0].y, pts[0].ind));
            ends.push(this.createPoint(pts[pts.length - 2].x, pts[pts.length - 2].y, pts[pts.length - 2].ind));

            for (let i = 1; i < pts.length; i++) {
                if (pts[i-1].x - pts[i].x > 200) {
                    ends.push(this.createPoint(pts[i-1].x, pts[i-1].y, pts[i-1].ind));
                    ends.push(this.createPoint(pts[i].x, pts[i].y, pts[i].ind));
                    continue;
                }
            }

            if (ends.length == 2) {
                for (let i = pts.length - 2; i > 1; i--) {
                    if (pts[i+1].x - pts[i].x > 200) {
                        ends.push(this.createPoint(pts[i+1].x, pts[i+1].y, pts[i+1].ind));
                        ends.push(this.createPoint(pts[i].x, pts[i].y, pts[i].ind));
                        continue;
                    }
                }
            }

            return ends;
        },

        findInterceptX: function(canvasHeight, pts) {
            if (pts.length == 0) return [];

            let intercepts = [];

            if (pts[0].y == canvasHeight/2) intercepts.push(pts[0]);
            for (let i = 1; i < pts.length; i++) {
                if (pts[i].y == canvasHeight/2) {
                    intercepts.push(this.createPoint(pts[i].x, pts[i].y));
                    continue;
                }

                if ((pts[i-1].y - canvasHeight/2) * (pts[i].y - canvasHeight/2) < 0 && (pts[i-1].y - pts[i].y < Math.abs(200))) {
                    let dx = pts[i].x - pts[i-1].x;
                    let dy = pts[i].y - pts[i-1].y;
                    let grad = dy/dx;
                    let esti = pts[i-1].x + (1 / grad) * (canvasHeight/2 - pts[i-1].y);
                    intercepts.push(this.createPoint(esti, canvasHeight/2));
                }
            }

            return intercepts;
        },

        findInterceptY: function(canvasWidth, pts) {
            if (pts.length == 0) return [];

            let intercepts = [];

            if (pts[0].x == canvasWidth/2) intercepts.push(pts[0]);
            for (let i = 1; i < pts.length; i++) {
                if (pts[i].x == canvasWidth/2) {
                    intercepts.push(this.createPoint(pts[i].x, pts[i].y));
                    continue;
                }

                if ((pts[i-1].x - canvasWidth/2) * (pts[i].x - canvasWidth/2) < 0 && (pts[i-1].x - pts[i].x < Math.abs(200))) {
                    let dx = pts[i].x - pts[i-1].x;
                    let dy = pts[i].y - pts[i-1].y;
                    let grad = dy/dx;
                    let esti = pts[i-1].y + grad * (canvasWidth/2 - pts[i-1].x);
                    intercepts.push(this.createPoint(canvasWidth/2, esti));
                }
            }

            return intercepts;
        },

        findTurnPts: function(pts, mode) {
            if (pts.length == 0) {
              return [];
            }

            let grad = [];
            for (let i = 0; i < pts.length - 1; i++) {
                let dx = pts[i+1].x - pts[i].x;
                let dy = pts[i+1].y - pts[i].y;
                grad.push(dy/dx);
            }

            let turnPts = [];

            for (let i = 1; i < grad.length; i++) {
                if (grad[i-1] != NaN && grad[i] != NaN) {
                    if (grad[i] * grad[i-1] < 0 && (pts[i].x - pts[i-1].x) * (pts[i+1].x - pts[i].x) > 0) {

                        let limit = 0.01;

                        let l = i - 2;
                        while (l >= 0 && Math.abs(grad[l]) < limit && Math.abs(grad[l]) > Math.abs(grad[l+1]) && grad[l] * grad[l+1] >= 0) {
                            l--;
                        }
                        if (!(Math.abs(grad[l]) >= limit)) {
                            continue;
                        }

                        let r = i + 1;
                        while (r < grad.length && Math.abs(grad[r]) < limit && Math.abs(grad[r]) > Math.abs(grad[r-1]) && grad[r] * grad[r-1] >= 0) {
                            r++;
                        }
                        if (!(Math.abs(grad[r]) >= limit)) {
                            continue;
                        }

                        let acc1 = grad[l];
                        let acc2 = grad[r];

                        if (mode == 'maxima') {
                            if ((pts[i].x > pts[i-1].x && acc1 < 0 && acc2 > 0) || (pts[i].x < pts[i-1].x && acc1 > 0 && acc2 < 0)) {
                                turnPts.push(this.createPoint(pts[i].x, pts[i].y, pts[i].ind));
                            } 
                        } else {
                            if ((pts[i].x > pts[i-1].x && acc1 > 0 && acc2 < 0) || (pts[i].x < pts[i-1].x && acc1 < 0 && acc2 > 0)) {
                                turnPts.push(this.createPoint(pts[i].x, pts[i].y, pts[i].ind));
                            } 
                        }


                    }
                }
            }

            return turnPts;
        },

        // given a curve, translate the curve
        translateCurve: function(curve, dx, dy, canvasProperties) {
            let pts = curve.pts;

            curve.minX += dx;
            curve.maxX += dx;
            curve.minY += dy;
            curve.maxY += dy;

            for (let i = 0; i < pts.length; i++) {
                pts[i].x += dx;
                pts[i].y += dy;
            }

            function moveTurnPts(knots) {
                for (let i = 0; i < knots.length; i++) {
                    let knot = knots[i];

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

            let maxima = curve.maxima;
            moveTurnPts(maxima);

            let minima = curve.minima;
            moveTurnPts(minima);


            function moveInter(inter, newInter) {
                for (let i = 0; i < inter.length; i++) {
                    if (inter[i].symbol != undefined) {
                        let symbol = inter[i].symbol;

                        let found = false,
                            min = 50,
                            knot;
                        for (let j = 0; j < newInter.length; j++) {
                            if (this.getDist(inter[i], newInter[j]) < min) {
                                min = this.getDist(inter[i], newInter[j]);
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

            let interX = curve.interX,
                newInterX = this.findInterceptX(canvasProperties.height, pts);
            curve.interX = moveInter(interX, newInterX);

            let endPt = curve.endPt,
                newEndPt = this.findEndPts(pts);
            curve.endPt = newEndPt;


            let interY = curve.interY,
                newInterY = this.findInterceptY(canvasProperties.width, pts);
            curve.interY = moveInter(interY, newInterY);

            return;
        },

        stretchCurve: function(c, orx, ory, nrx, nry, baseX, baseY, canvasProperties) {

            function stretch(pt) {
                let nx = (pt.x - baseX) / orx;
                let ny = (pt.y - baseY) / ory;
                pt.x = nx * nrx + baseX;
                pt.y = ny * nry + baseY;
            }

            let pts = c.pts;
            for (let j = 0; j < pts.length; j++) {
                stretch(pts[j]);
                c.pts[j] = pts[j];
            }


            function loop1(knots) {
                if (knots != undefined) {
                    for (let j = 0; j < knots.length; j++) {
                        let knot = knots[j];

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
            }

            c.endPt = this.findEndPts(pts)

            let maxima = c.maxima;
            loop1(maxima);

            let minima = c.minima;
            loop1(minima);

            function loop2(inter, newInter) {
                if (inter != undefined) {
                    for (let i = 0; i < inter.length; i++) {
                        if (inter[i].symbol != undefined) {
                            let symbol = inter[i].symbol;

                            let found = false,
                                min = 50,
                                knot;
                            for (let j = 0; j < newInter.length; j++) {
                                if (this.getDist(inter[i], newInter[j]) < min) {
                                    min = this.getDist(inter[i], newInter[j]);
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
            }

            let interX = c.interX,
                newInterX = this.findInterceptX(canvasProperties.height, pts);
            c.interX = loop2(interX, newInterX);


            let interY = c.interY,
                newInterY = this.findInterceptY(canvasProperties.width, pts);
            c.interY = loop2(interY, newInterY);
        },

        clone: function(obj) {
            let json = JSON.stringify(obj);
            return JSON.parse(json);
        }
    };
});
