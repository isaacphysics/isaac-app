'use strict';
define([], function() {

    const SAMPLE_INTERVAL = 10;
    const numOfPts = 100;

    return {

        // methods used in manipulating the graphs
        getDist: function(pt1, pt2) {
            return Math.sqrt(Math.pow(pt1[0] - pt2[0], 2) + Math.pow(pt1[1] - pt2[1], 2));
        },

        // enables data to be encoded/decoded to input on reload (2nd attempt at a question etc)
        encodeData: function(trunc, canvasProperties, curves) {

            if (trunc == undefined) {
                trunc = true;
            }

            if (canvasProperties.width > 5000 || canvasProperties.width <= 0) {
                alert("Invalid canvasProperties.width.");
                return;
            }

            if (canvasProperties.height > 5000 || canvasProperties.height <= 0) {
                alert("Invalid canvasProperties.height.");
                return;
            }

            let data = {};
            data.canvasWidth = canvasProperties.width;
            data.canvasHeight = canvasProperties.height;

            let clonedCurves = this.clone(curves);

            // sort segments according to their left most points.
            function compare(curve1, curve2) {
                function findMinX(pts) {
                    if (pts.length == 0) return 0;
                    let min = canvasProperties.width;
                    for (let i = 0; i < pts.length; i++)
                        min = Math.min(min, pts[i][0]);
                    return min;
                }

                let min1 = findMinX(curve1.pts);
                let min2 = findMinX(curve2.pts);
                if (min1 < min2) return -1
                else if (min1 == min2) return 0
                else return 1;
            }

            clonedCurves.sort(compare);

            function normalise(pt) {
                let x = (pt[0] - canvasProperties.width/2) / canvasProperties.width;
                let y = (canvasProperties.height/2 - pt[1]) / canvasProperties.height;
                if (trunc) {
                    pt[0] = Math.round(x * 10000) / 10000;
                    pt[1] = Math.round(y * 10000) / 10000;
                } else {
                    pt[0] = x;
                    pt[1] = y;
                }
            }

            function normalise1(knots) {
                for (let j = 0; j < knots.length; j++) {
                    let knot = knots[j];
                    normalise(knot);
                    if (knot.symbol != undefined) {
                        normalise(knot.symbol);
                    }
                }
            }

            function normalise2(knots) {
                normalise1(knots);
                for (let j = 0; j < knots.length; j++) {
                    let knot = knots[j];
                    if (knot.xSymbol != undefined) {
                        normalise(knot.xSymbol);
                    }
                    if (knot.ySymbol != undefined) {
                        normalise(knot.ySymbol);
                    }
                }
            }


            for (let i = 0; i < clonedCurves.length; i++) {
                let pts = clonedCurves[i].pts;
                for (let j = 0; j < pts.length; j++) {
                    normalise(pts[j]);
                }

                let tmp;

                tmp = (clonedCurves[i].minX - canvasProperties.width/2) / canvasProperties.width;
                clonedCurves[i].minX = Math.trunc(tmp * 1000) / 1000;

                tmp = (clonedCurves[i].maxX - canvasProperties.width/2) / canvasProperties.width;
                clonedCurves[i].maxX = Math.trunc(tmp * 1000) / 1000;

                tmp = (canvasProperties.height/2 - clonedCurves[i].minY) / canvasProperties.height;
                clonedCurves[i].minY = Math.trunc(tmp * 1000) / 1000;

                tmp = (canvasProperties.height/2 - clonedCurves[i].maxY) / canvasProperties.height;
                clonedCurves[i].maxY = Math.trunc(tmp * 1000) / 1000;


                let interX = clonedCurves[i].interX;
                normalise1(interX);

                let interY = clonedCurves[i].interY;
                normalise1(interY);

                let maxima = clonedCurves[i].maxima;
                normalise2(maxima);

                let minima = clonedCurves[i].minima;
                normalise2(minima);
            }

            data.curves = clonedCurves;

            return data;
        },

        decodeData: function(data, width, height) {

            function denormalise(pt) {
                pt[0] = pt[0] * width + width/2;
                pt[1] = height/2 - pt[1] * height;
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


            let curves = data.curves;

            for (let i = 0; i < curves.length; i++) {

                let pts = curves[i].pts;
                for (let j = 0; j < pts.length; j++) {
                    denormalise(pts[j]);
                }

                curves[i].minX = curves[i].minX * width + width/2;
                curves[i].maxX = curves[i].maxX * width + width/2;
                curves[i].minY = height/2 - curves[i].minY * height;
                curves[i].maxY = height/2 - curves[i].maxY * height;

                let interX = curves[i].interX;
                denormalise1(interX);

                let interY = curves[i].interY;
                denormalise1(interY);

                let maxima = curves[i].maxima;
                denormalise2(maxima);

                let minima = curves[i].minima;
                denormalise2(minima);
            }

            return;
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

        createPoint: function(x, y) {
            let obj = [x, y];
            return obj;
        },

        linearLineStyle: function(pts) {
            pts.sort(function(a, b){return a[0] - b[0]});
            let start = pts[0];
            let end = pts[1];
            let increment = 1/numOfPts;
            let linearPoints = [];
            let x_diff = pts[1][0]-pts[0][0];
            let y_diff = pts[1][1]-pts[0][1];
            for (let currentPoint = 0; currentPoint < numOfPts; currentPoint += 1) {
                let x_co = pts[0][0] + (currentPoint*increment*x_diff);
                let y_co = pts[0][1] + (currentPoint*increment*y_diff);
                linearPoints.push(this.createPoint(x_co,y_co));
            }
            return linearPoints;
        },

        bezierLineStyle: function(pts) {

            // See https://github.com/josdejong/mathjs/blob/v5.8.0/src/function/probability/product.js
            let product = function(i, n) {
                let half;
                if (n < i) {
                    return 1;
                }
                if (n === i) {
                    return n;
                }
                half = (n + i) >> 1 // divide (n + i) by 2 and truncate to integer
                return product(i, half) * product(half + 1, n);
            }

             // See https://github.com/josdejong/mathjs/blob/v5.8.0/src/function/probability/combinations.js
            let combinations = function(n, k) {
                let prodrange, nMinusk;

                 if (n < 0 || k < 0) {
                    throw new TypeError('Positive integer value expected in function combinations');
                }
                if (k > n) {
                    throw new TypeError('k must be less than or equal to n');
                }

                 nMinusk = n - k;

                 if (k < nMinusk) {
                    prodrange = product(nMinusk + 1, n);
                    return prodrange / product(1, k);
                }
                prodrange = product(k + 1, n)
                return prodrange / product(1, nMinusk);
            }

            let drawnNumberOfPoints = pts.length - 1;
            let comb = [];
            for (let currentIndex = 0; currentIndex <= drawnNumberOfPoints; currentIndex += 1) {
                comb.push(combinations(drawnNumberOfPoints, currentIndex));
            }

            let step = 1 / numOfPts;
            let bezier = [];
            let u;

            let tmp1;
            let tmp2;
            let tmp3;

            for (let i = 0; i < numOfPts; i += 1) {
                u = i * step;
                let sx = 0;
                let sy = 0;
                for (let currentIndex = 0; currentIndex <= drawnNumberOfPoints; currentIndex += 1) {
                    tmp1 = Math.pow(u, currentIndex);
                    tmp2 = Math.pow(1 - u, drawnNumberOfPoints - currentIndex);
                    tmp3 = comb[currentIndex] * tmp1 * tmp2;
                    sx += tmp3 * pts[currentIndex][0];
                    sy += tmp3 * pts[currentIndex][1];
                }
                bezier.push(this.createPoint(sx, sy));
            }
            bezier.push(pts[pts.length - 1]);
            return bezier;
        },

        sample: function(pts) {
            let sampled = [];
            sampled.push(pts[0]);
            let i = 0;
            let j = 0;
            while (i < pts.length) {
                
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

        overItem: function(curves, e, MOUSE_DETECT_RADIUS, found) {
            let mousePosition = this.getMousePt(e);
            let loop = function(knots) {
                for (let j = 0; j < knots.length; j++) {
                    let knot = knots[j];
                    if (this.getDist(mousePosition, knot) < MOUSE_DETECT_RADIUS) {
                        found = "overKnot";
                    } 
                }
            }.bind(this);

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

            ends.push(this.createPoint(pts[0][0], pts[0][1]));
            ends.push(this.createPoint(pts[pts.length - 1][0], pts[pts.length - 1][1]));

            // 200 acceptable for showing a curve is no longer just one line
            for (let i = 1; i < pts.length; i++) {
                if (pts[i-1][0] - pts[i][0] > 200) {
                    ends.push(this.createPoint(pts[i-1][0], pts[i-1][1]));
                    ends.push(this.createPoint(pts[i][0], pts[i][1]));
                    continue;
                }
            }

            if (ends.length == 2) {
                for (let i = pts.length - 2; i > 1; i--) {
                    if (pts[i+1][0] - pts[i][0] > 200) {
                        ends.push(this.createPoint(pts[i+1][0], pts[i+1][1]));
                        ends.push(this.createPoint(pts[i][0], pts[i][1]));
                        continue;
                    }
                }
            }

            return ends;
        },

        findInterceptX: function(canvasHeight, pts) {
            if (pts.length == 0) return [];

            let intercepts = [];

            if (pts[0][1] == canvasHeight/2) intercepts.push(pts[0]);
            for (let i = 1; i < pts.length; i++) {
                if (pts[i][1] == canvasHeight/2) {
                    intercepts.push(this.createPoint(pts[i][0], pts[i][1]));
                    continue;
                }

                if ((pts[i-1][1] - canvasHeight/2) * (pts[i][1] - canvasHeight/2) < 0 && (pts[i-1][1] - pts[i][1] < Math.abs(200))) {
                    let dx = pts[i][0] - pts[i-1][0];
                    let dy = pts[i][1] - pts[i-1][1];
                    let grad = dy/dx;
                    let esti = pts[i-1][0] + (1 / grad) * (canvasHeight/2 - pts[i-1][1]);
                    intercepts.push(this.createPoint(esti, canvasHeight/2));
                }
            }

            return intercepts;
        },

        findInterceptY: function(canvasWidth, pts) {
            if (pts.length == 0) return [];

            let intercepts = [];

            if (pts[0][0] == canvasWidth/2) intercepts.push(pts[0]);
            for (let i = 1; i < pts.length; i++) {
                if (pts[i][0] == canvasWidth/2) {
                    intercepts.push(this.createPoint(pts[i][0], pts[i][1]));
                    continue;
                }

                if ((pts[i-1][0] - canvasWidth/2) * (pts[i][0] - canvasWidth/2) < 0 && (pts[i-1][0] - pts[i][0] < Math.abs(200))) {
                    let dx = pts[i][0] - pts[i-1][0];
                    let dy = pts[i][1] - pts[i-1][1];
                    let grad = dy/dx;
                    let esti = pts[i-1][1] + grad * (canvasWidth/2 - pts[i-1][0]);
                    intercepts.push(this.createPoint(canvasWidth/2, esti));
                }
            }

            return intercepts;
        },

        findTurnPts: function(pts, mode) {
            if (pts.length == 0) {
              return [];
            }

            let turnPts = [];
            let potentialPts = [];
            let statPts = [];
            let pot_max = [];
            let pot_min = [];
            let CUTOFF = 10;

            for (let i = CUTOFF; i < pts.length-CUTOFF; i++) {
                if ((pts[i][1] < pts[i-1][1] && pts[i][1] < pts[i+1][1]) || (pts[i][1] > pts[i-1][1] && pts[i][1] > pts[i+1][1]) || (pts[i][1] == pts[i-1][1])) {
                    potentialPts.push(this.createPoint(pts[i][0], pts[i][1]));
                }
            }

            let stationaryArrays = Object.create(null);

            // loop over turn pts and put them in arrays by same y value
            potentialPts.forEach(function(pt) {
                let stationaryArray = stationaryArrays[pt[1]];
                if (!stationaryArray) {
                    stationaryArray = stationaryArrays[pt[1]] = [];
                }
                stationaryArray.push(pt);
            });

            Object.keys(stationaryArrays).forEach(function(key) {
                let middle = stationaryArrays[key][Math.floor(stationaryArrays[key].length / 2)];
                statPts.push(middle);
            });

            let position = null

            for (let i = 0; i < statPts.length; i++) { 
                for (let j = 0; j < pts.length; j++) {
                    if (statPts[i][0] == pts[j][0]) {
                        position = j;
                    }
                }
                if (statPts[i][1] < pts[position-5][1] && statPts[i][1] < pts[position+5][1]) {
                    pot_max.push(statPts[i]);
                } else if (statPts[i][1] > pts[position-5][1] && statPts[i][1] > pts[position+5][1]) {
                    pot_min.push(statPts[i]);
                }
            }

            let true_max = this.duplicateStationaryPts(pot_max, mode);
            let true_min = this.duplicateStationaryPts(pot_min, mode);

            mode == 'maxima' ? turnPts = true_max : turnPts = true_min;  
            turnPts.sort(function(a, b){return a[0] - b[0]});
            
            return turnPts;
        },

        duplicateStationaryPts: function(pts, mode) {
            let non_duplicates = []
            for (let i = 0; i < pts.length; i++) {
                let similar_ind = [pts[i]]
                for (let j = 0; j < pts.length; j++) {
                    if ((pts[j][0] !== pts[i][0]) && ((pts[j][0] < pts[i][0] + 5) && (pts[j][0] > pts[i][0] - 5))) {
                        similar_ind.push(pts[j]);
                    }
                }
                if (mode == 'maxima') {
                    similar_ind.sort(function(a, b){return a[1] - b[1]})
                } else {
                    similar_ind.sort(function(a, b){return b[1] - a[1]})
                }
                if (non_duplicates.indexOf(similar_ind[0]) === -1) {
                    non_duplicates.push(similar_ind[0])
                }
            }
            return non_duplicates;
        },

        // given a curve, translate the curve
        translateCurve: function(curve, dx, dy, canvasProperties) {
            let pts = curve.pts;

            curve.minX += dx;
            curve.maxX += dx;
            curve.minY += dy;
            curve.maxY += dy;

            for (let i = 0; i < pts.length; i++) {
                pts[i][0] += dx;
                pts[i][1] += dy;
            }

            function moveTurnPts(knots) {
                for (let i = 0; i < knots.length; i++) {
                    let knot = knots[i];

                    knot[0] += dx;
                    knot[1] += dy;
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
                            symbol.x = knot[0];
                            symbol.y = knot.y;
                            knot.symbol = symbol;
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
                if (importantPoints[i] == undefined || turningPoints[selectedPointIndex] == undefined) {
                    break;
                }
                if (importantPoints[i][0] == turningPoints[selectedPointIndex][0]) {
                    tempMin = importantPoints[i - 1]; 
                    tempMax = importantPoints[i + 1];
                }
            }
            let XBUFFER = 30;
            let YBUFFER = 15;
            let withinXBoundary = (mousePosition[0] - tempMax[0]) < -XBUFFER && (mousePosition[0] - tempMin[0]) > XBUFFER;
            let withinYBoundary = (isMaxima && ((mousePosition[1] - tempMax[1]) < -YBUFFER && (mousePosition[1] - tempMin[1]) < -YBUFFER)) || (!isMaxima && ((mousePosition[1] - tempMax[1]) > YBUFFER && (mousePosition[1] - tempMin[1]) > YBUFFER));
            let movementWithinBoundary = (withinXBoundary && withinYBoundary);
            if (movementWithinBoundary) {
                // to this point we get the clicked knot and the turning/end points either side, now we will split the curve into the two
                // origional max/min sides and the 2 new curves to be stretched, then combine them all after.
                let leftStaticPoints = [];
                let rightStaticPoints = [];
                let leftStretchedCurve = {pts: []};
                let rightStretchedCurve = {pts: []};
                for (let t = selectedCurve.pts.length-1; t > -1; t--) {
                    if (selectedCurve.pts[t][0] > tempMax[0]) {
                        rightStaticPoints.push(selectedCurve.pts[t]);
                        selectedCurve.pts.pop(selectedCurve.pts[t]);
                    } else if (selectedCurve.pts[t][0] <= tempMax[0] && selectedCurve.pts[t][0] >= turningPoints[selectedPointIndex][0]) {
                        rightStretchedCurve.pts.push(selectedCurve.pts[t]);
                        selectedCurve.pts.pop(selectedCurve.pts[t]);
                    } else if (selectedCurve.pts[t][0] <= turningPoints[selectedPointIndex][0] && selectedCurve.pts[t][0] >= tempMin[0]) {
                        leftStretchedCurve.pts.push(selectedCurve.pts[t]);
                        selectedCurve.pts.pop(selectedCurve.pts[t]);
                    } else if (selectedCurve.pts[t][0] < tempMin[0]) {
                        leftStaticPoints.push(selectedCurve.pts[t]);
                        selectedCurve.pts.pop(selectedCurve.pts[t]);
                    } else {
                        selectedCurve.pts.pop(selectedCurve.pts[t]);
                    }
                }

                leftStaticPoints.sort(function(a, b){return a[0] - b[0]});
                rightStaticPoints.sort(function(a, b){return a[0] - b[0]});
                leftStretchedCurve.pts.sort(function(a, b){return a[0] - b[0]});
                rightStretchedCurve.pts.sort(function(a, b){return a[0] - b[0]});

                // we have now split the curve into leftStaticPoints and rightStaticPoints, plus leftStretchedCurve and rightStretchedCurve
                let lorx = turningPoints[selectedPointIndex][0] - tempMin[0];
                let lory = turningPoints[selectedPointIndex][1] - tempMin[1];
                let rorx = tempMax[0] - turningPoints[selectedPointIndex][0];
                let rory = turningPoints[selectedPointIndex][1] - tempMax[1];
                let dx = mousePosition[0] - prevMousePt[0];
                let dy = mousePosition[1] - prevMousePt[1];
                turningPoints[selectedPointIndex][0] += dx;
                turningPoints[selectedPointIndex][1] += dy;

                let lnrx = turningPoints[selectedPointIndex][0] - tempMin[0];
                let lnry = turningPoints[selectedPointIndex][1] - tempMin[1];
                let rnrx = tempMax[0] - turningPoints[selectedPointIndex][0];
                let rnry = turningPoints[selectedPointIndex][1] - tempMax[1];

                this.stretchCurve(leftStretchedCurve, lorx, lory, lnrx, lnry, tempMin[0], tempMin[1], canvasProperties);    
                this.stretchCurve(rightStretchedCurve, rorx, rory, rnrx, rnry, tempMax[0], tempMax[1], canvasProperties);
                        
                turningPoints[selectedPointIndex] = mousePosition;

                selectedCurve.pts.push.apply(selectedCurve.pts, leftStaticPoints);
                selectedCurve.pts.push.apply(selectedCurve.pts, leftStretchedCurve.pts);
                selectedCurve.pts.push.apply(selectedCurve.pts, rightStretchedCurve.pts);
                selectedCurve.pts.push.apply(selectedCurve.pts, rightStaticPoints);

                selectedCurve.interX = this.findInterceptX(canvasProperties.height, selectedCurve.pts);
                selectedCurve.interY = this.findInterceptY(canvasProperties.width, selectedCurve.pts);
                selectedCurve.maxima = this.findTurnPts(selectedCurve.pts, 'maxima');
                selectedCurve.minima = this.findTurnPts(selectedCurve.pts, 'minima');
                let minX = selectedCurve.pts[0][0];
                let maxX = selectedCurve.pts[0][0];
                let minY = selectedCurve.pts[0][1];
                let maxY = selectedCurve.pts[0][1];
                for (let k = 1; k < selectedCurve.pts.length; k++) {
                    minX = Math.min(selectedCurve.pts[k][0], minX);
                    maxX = Math.max(selectedCurve.pts[k][0], maxX);
                    minY = Math.min(selectedCurve.pts[k][1], minY);
                    maxY = Math.max(selectedCurve.pts[k][1], maxY);
                }
                selectedCurve.minX = minX;
                selectedCurve.maxX = maxX;
                selectedCurve.minY = minY;
                selectedCurve.maxY = maxY;
            }
            return selectedCurve;
        },

        stretchCurve: function(c, orx, ory, nrx, nry, baseX, baseY, canvasProperties) {

            function stretch(pt) {
                let nx = (pt[0] - baseX) / orx;
                let ny = (pt[1] - baseY) / ory;
                pt[0] = nx * nrx + baseX;
                pt[1] = ny * nry + baseY;
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
                                symbol.x = knot[0];
                                symbol.y = knot[1];
                                knot.symbol = symbol;
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
