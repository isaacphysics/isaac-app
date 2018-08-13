"use strict";
define(function(_require) {

    const SAMPLE_INTERVAL = 10;

    return {

        // methods used in manipulating the graphs
        getDist: function(pt1, pt2) {
            return Math.sqrt(Math.pow(pt1.x - pt2.x, 2) + Math.pow(pt1.y - pt2.y, 2));
        },

        detect: function(e, x, y) {
            let mousePosition = this.getMousePt(e);
            return (this.getDist(mousePosition, this.createPoint(x, y)) < 5);
        },

        getMousePt: function(e) {
            let x = (e.clientX - 5);
            let y = (e.clientY - 5);
            return (this.createPoint(x, y));
        },

        symbolOverKnot: function(knots, movedSymbol, MOUSE_DETECT_RADIUS) {
            for (let j = 0; j < knots.length; j++) {
                if (knots[j].symbol == undefined && this.getDist(movedSymbol, knots[j]) < MOUSE_DETECT_RADIUS) {
                    return knots[j];
                }
            }
        },

        createPoint: function(x, y, c) {
            let obj = {};
            obj.ind = c;
            obj.x = x;
            obj.y = y;
            return obj;
        },

        createSymbol: function(text, x, y) {
            let obj = {};
            obj.text = text;
            obj.x = x;
            obj.y = y;
            return obj;
        },

        sample: function(pts) {
            let sampled = [];
            sampled.push(pts[0]);
            let i = 0;
            let j = 0;
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

        isOverSymbol: function(pt, symbol) {
            if (symbol == undefined) {
                return false;
            }
            let left = symbol.x - 5;
            let right = symbol.x + 5;
            let top = symbol.y - 5;
            let bottom = symbol.y + 20 + 5;
            return (pt.x > left && pt.x < right && pt.y > top && pt.y < bottom);
        },

        overItem: function(curves, e, freeSymbols, MOUSE_DETECT_RADIUS, found) {
            let mousePosition = this.getMousePt(e);
            let loop = function(knots) {
                for (let j = 0; j < knots.length; j++) {
                    let knot = knots[j];
                    if (this.getDist(mousePosition, knot) < MOUSE_DETECT_RADIUS) {
                        found = "overKnot";
                    } else if (knot.symbol != undefined && this.isOverSymbol(mousePosition, knot.symbol)) {
                        found = "overAttachedSymbol";
                    }
                }
            }.bind(this);

            for (let i = 0; i < freeSymbols.length; i++) { // detects if mouse over free symbol
                if (this.isOverSymbol(mousePosition, freeSymbols[i])) {
                    found = "overFreeSymbol";
                }
            }

            for (let j = 0; j < curves.length; j++) { // detects if mouse is over curve
                for (let k = 0; k < curves[j].pts.length; k++) {
                    if (this.getDist(mousePosition, curves[j].pts[k]) < MOUSE_DETECT_RADIUS) {
                        found = "overCurve";
                    }
                }
            }

            for (let i = 0; i < curves.length; i++) { // is the mouse over a symbol docked to any of these knots?
                let interX = curves[i]['interX'];
                loop(interX);
            
                let interY = curves[i]['interY'];
                loop(interY);
       
                let maxima = curves[i]['maxima'];
                loop(maxima);
            
                let minima = curves[i]['minima'];
                loop(minima);
            } 
            return found;
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
                    intercepts.push(this.createPoint(pts[i].x, pts[i].y, pts[i].ind));
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
                    intercepts.push(this.createPoint(pts[i].x, pts[i].y, pts[i].ind));
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
                if (!isNaN(grad[i-1]) && !isNaN(grad[i])) {
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
        translateCurve: function(curve, dx, dy, canvasProperties, freeSymbols) {
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


            let moveInter = function(inter, newInter) {
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
            }.bind(this);

            let interX = curve.interX,
                newInterX = this.findInterceptX(canvasProperties.height, pts);
            curve.interX = moveInter(interX, newInterX);

            let endPt = curve.endPt,
                newEndPt = this.findEndPts(pts);
            curve.endPt = newEndPt;
            void endPt;

            let interY = curve.interY,
                newInterY = this.findInterceptY(canvasProperties.width, pts);
            curve.interY = moveInter(interY, newInterY);

            return;
        },

        stretchTurningPoint: function(importantPoints, e, selectedCurve, isMaxima, selectedPointIndex, prevMousePt, canvasProperties){
            let mousePosition = this.getMousePt(e);
            let tempMin = undefined;
            let tempMax = undefined;
            let turningPoints = isMaxima ? selectedCurve.maxima : selectedCurve.minima;

            for (let i = 0; i < importantPoints.length; i++) {
                if (importantPoints[i].ind == turningPoints[selectedPointIndex].ind) {
                    tempMin = importantPoints[i - 1]; 
                    tempMax = importantPoints[i + 1];
                }
            }

            let xBuffer = 30;
            let yBuffer = 15;
            let withinXBoundary = (mousePosition.x - tempMax.x) < -xBuffer && (mousePosition.x - tempMin.x) > xBuffer;
            let withinYBoundary = (isMaxima && ((mousePosition.y - tempMax.y) < -yBuffer && (mousePosition.y - tempMin.y) < -yBuffer)) || (!isMaxima && ((mousePosition.y - tempMax.y) > yBuffer && (mousePosition.y - tempMin.y) > yBuffer));
            let movementWithinBoundary = withinXBoundary && withinYBoundary;
            if (movementWithinBoundary) {
                // to this point we get the clicked knot and the turning/end points either side, now we will split the curve into the two
                // origional max/min sides and the 2 new curves to be stretched, then combine them all after.
                let leftStaticPoints = [];
                let rightStaticPoints = [];
                let leftStretchedCurve = {pts: []};
                let rightStretchedCurve = {pts: []};
                for (let t = selectedCurve.pts.length-1; t > -1; t--) {
                    if (selectedCurve.pts[t].ind > tempMax.ind) {
                        rightStaticPoints.push(selectedCurve.pts[t]);
                        selectedCurve.pts.pop(selectedCurve.pts[t]);
                    } else if (selectedCurve.pts[t].ind <= tempMax.ind && selectedCurve.pts[t].ind >= turningPoints[selectedPointIndex].ind) {
                        rightStretchedCurve.pts.push(selectedCurve.pts[t]);
                        selectedCurve.pts.pop(selectedCurve.pts[t]);
                    } else if (selectedCurve.pts[t].ind <= turningPoints[selectedPointIndex].ind && selectedCurve.pts[t].ind >= tempMin.ind) {
                        leftStretchedCurve.pts.push(selectedCurve.pts[t]);
                        selectedCurve.pts.pop(selectedCurve.pts[t]);
                    } else if (selectedCurve.pts[t].ind < tempMin.ind) {
                        leftStaticPoints.push(selectedCurve.pts[t]);
                        selectedCurve.pts.pop(selectedCurve.pts[t]);
                    } else {
                        selectedCurve.pts.pop(selectedCurve.pts[t]); // TODO why does one point have an undefined index?
                    }
                }

                leftStaticPoints.sort(function(a, b){return a.ind - b.ind});
                rightStaticPoints.sort(function(a, b){return a.ind - b.ind});
                leftStretchedCurve.pts.sort(function(a, b){return a.ind - b.ind});
                rightStretchedCurve.pts.sort(function(a, b){return a.ind - b.ind});

                // we have now split the curve into leftStaticPoints and rightStaticPoints, plus leftStretchedCurve and rightStretchedCurve
                let lorx = turningPoints[selectedPointIndex].x - tempMin.x;
                let lory = turningPoints[selectedPointIndex].y - tempMin.y;
                let rorx = tempMax.x - turningPoints[selectedPointIndex].x;
                let rory = turningPoints[selectedPointIndex].y - tempMax.y;
                let dx = mousePosition.x - prevMousePt.x;
                let dy = mousePosition.y - prevMousePt.y;
                turningPoints[selectedPointIndex].x += dx;
                turningPoints[selectedPointIndex].y += dy;

                let lnrx = turningPoints[selectedPointIndex].x - tempMin.x;
                let lnry = turningPoints[selectedPointIndex].y - tempMin.y;
                let rnrx = tempMax.x - turningPoints[selectedPointIndex].x;
                let rnry = turningPoints[selectedPointIndex].y - tempMax.y;

                this.stretchCurve(leftStretchedCurve, lorx, lory, lnrx, lnry, tempMin.x, tempMin.y, canvasProperties);    
                this.stretchCurve(rightStretchedCurve, rorx, rory, rnrx, rnry, tempMax.x, tempMax.y, canvasProperties);
                        
                turningPoints[selectedPointIndex] = mousePosition;

                selectedCurve.pts.push.apply(selectedCurve.pts, leftStaticPoints);
                selectedCurve.pts.push.apply(selectedCurve.pts, leftStretchedCurve.pts);
                selectedCurve.pts.push.apply(selectedCurve.pts, rightStretchedCurve.pts);
                selectedCurve.pts.push.apply(selectedCurve.pts, rightStaticPoints);

                selectedCurve.interX = this.findInterceptX(canvasProperties.height, selectedCurve.pts);
                selectedCurve.interY = this.findInterceptY(canvasProperties.width, selectedCurve.pts);
                selectedCurve.maxima = this.findTurnPts(selectedCurve.pts, 'maxima');
                selectedCurve.minima = this.findTurnPts(selectedCurve.pts, 'minima');
                let minX = selectedCurve.pts[0].x;
                let maxX = selectedCurve.pts[0].x;
                let minY = selectedCurve.pts[0].y;
                let maxY = selectedCurve.pts[0].y;
                for (let k = 1; k < selectedCurve.pts.length; k++) { // TODO BH search through 'important' points instead
                    minX = Math.min(selectedCurve.pts[k].x, minX);
                    maxX = Math.max(selectedCurve.pts[k].x, maxX);
                    minY = Math.min(selectedCurve.pts[k].y, minY);
                    maxY = Math.max(selectedCurve.pts[k].y, maxY);
                }
                selectedCurve.minX = minX;
                selectedCurve.maxX = maxX;
                selectedCurve.minY = minY;
                selectedCurve.maxY = maxY;
            }
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

            let loop2 = function(inter, newInter) {
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
                                freeSymbols.push(symbol);// TODO MT not defined
                            }
                        }
                    }
                    return newInter;
                }
            }.bind(this);

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
