"use strict";
define(["p5", "../../../lib/graph_sketcher/bezier.js", "../../../lib/graph_sketcher/linear.js", "../../../lib/graph_sketcher/func.js", "../../../lib/graph_sketcher/sampler.js", "/partials/graph_sketcher/graph_sketcher.html"],
    function(p5, bezierLineType, linearLineType, graphFunctions, lineSampler, templateUrl) {
    return ["$timeout", "$rootScope", "api", function($timeout, $rootScope, api) {
        let instanceCounter = 0;
        return {
            // scope: true,
            // transclude: true,
            restrict: "A",
            templateUrl: templateUrl,

            link: function(scope, element, attrs) {

                element.on("touchstart touchmove", "canvas", function(e) {
                    e.preventDefault();
                });

                scope.title = "Sketcher";
                scope.canvasOffset = {};
                scope.draggingNewSymbol = false;
                scope.equationEditorElement = element;
                scope.selectedLineType = bezierLineType;

                let colorSelect = element.find(".color-select")[0];
                let encodeData;
                let decodeData;
                let reDraw;



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

                scope.sketch = function(p) {

                    // canvas coefficients
                    let canvasHeight = window.innerHeight;
                    let canvasWidth = window.innerWidth;

                    let CURVE_LIMIT = 3;

                    let GRID_WIDTH = 60;
                    let CURVE_STRKWEIGHT = 2;
                    let PADDING = 0.025 * canvasWidth;
                    let DOT_LINE_STEP = 5;
                    let MOUSE_DETECT_RADIUS = 10;

                    let CURVE_COLORS = [[93,165,218], [250,164,58], [96,189,104], [241,124,176], [241,88,84], [178,118,178]];
                    let KNOT_COLOR = [77,77,77];
                    let DOT_LINE_COLOR = [123];
                    let MOVE_LINE_COLOR = [135];
                    let MOVE_SYMBOL_COLOR = [151];
                    let KNOT_DETECT_COLOR = [0];

                    // action recorder
                    let action = undefined;
                    let isMouseDragged;
                    let releasePt;
                    let drawMode;
                    let key = undefined;
                        
                    let freeSymbols = [];
                    let curves = [];
                    let dat;


                    // for drawing curve
                    let drawnPts = [];
                    let drawnColorIdx;
                    let lineStart;
                    let lineEnd;

                    let prevMousePt;

                    // for moving and stretching curve
                    let movedCurveIdx;
                    let stretchMode;
                    let minMax = 0;


                    // for moving symbols
                    let movedSymbol;
                    let bindedKnot;
                    let symbolType;

                    let clickedKnot = null;
                    let clickedCurveIdx;
                    let clickedKnotId;
                    let tempCurve;
                    let tempPts = [];
                    let clickedCurve;

                    // for redo and undo
                    p.checkPoint;
                    p.checkPointsUndo = [];
                    p.checkPointsRedo = [];

                    function initiateFreeSymbols() {
                        freeSymbols = [];

                        const symbolList = ['A', 'B', 'C', 'D', 'E'];
                        symbolList.forEach(function(symbol) {
                            freeSymbols.push(graphFunctions.createSymbol(symbol));
                        });
                        
                        refreshFreeSymbols();
                    }

                    function refreshFreeSymbols() {
                        let start = 15,
                            separation = 30;

                        for (let i = 0; i < freeSymbols.length; i++) {
                            let symbol = freeSymbols[i];
                            symbol.x = start + i * separation;
                            symbol.y = start;
                        }
                    }

                    // run in the beginning by p5 library
                    p.setup = function() {
                        p.createCanvas(canvasWidth, canvasHeight);
                        p.noLoop();
                        p.cursor(p.ARROW);

                        initiateFreeSymbols();
                        reDraw();
                    }

                    p.mouseMoved = function(e) {
                        let current = getMousePt(e);


                        // this funciton does not react if the mouse is over buttons or outside the canvas.
                        if (!isActive(current)) {
                            return;
                        }

                        let found = false;


                        // maxima and minima
                        if (!found) {
                            function loop(knots) {
                                if (found) {
                                    return;
                                }

                                for (let i = 0; i < knots.length; i++) {
                                    if (graphFunctions.getDist(current, knots[i]) < MOUSE_DETECT_RADIUS) {
                                        p.cursor(p.HAND);
                                        drawKnotDetect(knots[i]);
                                        found = true;
                                        return;
                                    }
                                }
                            }

                            for (let i = 0; i < curves.length; i++) {
                                let maxima = curves[i]['maxima'];
                                loop(maxima);

                                let minima = curves[i]['minima'];
                                loop(minima);

                                if (found) {
                                    break;
                                }
                            }
                        }

                        // freeSymbols
                        if (!found) {
                            for (let i = 0; i < freeSymbols.length; i++) {
                                if (isOverSymbol(current, freeSymbols[i])) {
                                    p.cursor(p.MOVE);
                                    found = true;
                                    break;
                                }
                            }
                        }

                        if (!found) {
                            for (let i = 0; i < curves.length; i++) {
                                for (let j = 0; j < curves[i].pts.length; j++) {
                                    if (graphFunctions.getDist(current, curves[i].pts[j]) < MOUSE_DETECT_RADIUS) {
                                        p.cursor(p.MOVE);
                                        found = true;
                                        break;
                                    }
                                }
                            }
                        }

                        // attached symbols
                        if (!found) {
                            function loop1(knots) {
                                if (found) {
                                    return;
                                }

                                for (let j = 0; j < knots.length; j++) {
                                    let knot = knots[j];
                                    if (knot.symbol != undefined && isOverSymbol(current, knot.symbol)) {
                                        p.cursor(p.MOVE);
                                        found = true;
                                        return;
                                    }
                                }
                            }

                            function loop2(knots) {
                                if (found) {
                                    return;
                                }

                                loop1(knots);

                                for (let j = 0; j < knots.length; j++) {
                                    let knot = knots[j];
                                    if (knot.xSymbol != undefined && isOverSymbol(current, knot.xSymbol)) {
                                        p.cursor(p.MOVE);
                                        found = true;
                                        return;
                                    }
                                    if (knot.ySymbol != undefined && isOverSymbol(current, knot.ySymbol)) {
                                        p.cursor(p.MOVE);
                                        found = true;
                                        return;
                                    }

                                }
                            }


                            for (let i = 0; i < curves.length; i++) {
                                let interX = curves[i]['interX'];
                                loop1(interX);

                                let interY = curves[i]['interY'];
                                loop1(interY);

                                let maxima = curves[i]['maxima'];
                                loop2(maxima);

                                let minima = curves[i]['minima'];
                                loop2(minima);

                                if (found) {
                                    break;
                                }
                            }
                        }


                        // stretch box
                        if (!found) {

                            if (clickedCurveIdx != undefined) {

                                function detect(x, y) {
                                    return (Math.abs(current.x - x) < 5 && Math.abs(current.y - y) < 5);
                                }

                                let c = curves[clickedCurveIdx];
                                if (current.x >= c.minX && current.x <= c.maxX && current.y >= c.minY && current.y <= c.maxY) {
                                    found = true;
                                    p.cursor(p.MOVE);
                                } else if (detect(c.minX, c.minY) || detect(c.maxX, c.minY) || detect(c.minX, c.maxY) || detect(c.maxX, c.maxY)) {
                                    p.push();
                                    p.fill(KNOT_DETECT_COLOR);
                                    if (detect(c.minX, c.minY)) {
                                         p.rect(c.minX - 4, c.minY - 4, 8, 8);
                                    } else if (detect(c.maxX, c.minY)) {
                                        p.rect(c.maxX - 4, c.minY - 4, 8, 8);
                                    } else if (detect(c.minX, c.maxY)) {
                                        p.rect(c.minX - 4, c.maxY - 4, 8, 8);
                                    } else {
                                        p.rect(c.maxX - 4, c.maxY - 4, 8, 8);
                                    }
                                    p.pop();

                                    found = true;
                                    p.cursor(p.MOVE);
                                } else if (detect((c.minX + c.maxX)/2, c.minY - 3) || detect((c.minX + c.maxX)/2, c.maxY + 3) 
                                    || detect(c.minX - 3, (c.minY + c.maxY)/2) || detect(c.maxX + 3, (c.minY + c.maxY)/2)) {

                                    p.push();
                                    p.fill(KNOT_DETECT_COLOR);
                                    if (detect((c.minX + c.maxX)/2, c.minY - 3)) {
                                        p.triangle((c.minX + c.maxX)/2 - 5, c.minY - 2, (c.minX + c.maxX)/2 + 5, c.minY - 2, (c.minX + c.maxX)/2, c.minY - 7);
                                    } else if (detect((c.minX + c.maxX)/2, c.maxY + 3)) {
                                        p.triangle((c.minX + c.maxX)/2 - 5, c.maxY + 2, (c.minX + c.maxX)/2 + 5, c.maxY + 2, (c.minX + c.maxX)/2, c.maxY + 7);
                                    } else if (detect(c.minX - 3, (c.minY + c.maxY)/2)) {
                                        p.triangle(c.minX - 2, (c.minY + c.maxY) / 2 - 5, c.minX - 2, (c.minY + c.maxY) / 2 + 5, c.minX - 7, (c.minY + c.maxY) / 2);
                                    } else {
                                        p.triangle(c.maxX + 2, (c.minY + c.maxY) / 2 - 5, c.maxX + 2, (c.minY + c.maxY) / 2 + 5, c.maxX + 7, (c.minY + c.maxY) / 2); 
                                    }
                                    p.pop();

                                    found = true;
                                    p.cursor(p.MOVE);
                                }
                            }
                        }

                        if (!found) {
                            p.cursor(p.CROSS);
                            reDraw();
                        }
                    }

                    p.mousePressed = function(e) {

                        isMouseDragged = false;
                        action = undefined;

                        movedSymbol = undefined;
                        bindedKnot = undefined;
                        symbolType = undefined;

                        drawnPts = [];
                        drawnColorIdx = undefined;

                        movedCurveIdx = undefined;
                        prevMousePt = undefined;

                        releasePt = undefined;


                        let current = getMousePt(e);
                        releasePt = current;

                        // this funciton does not react if the mouse is over buttons or outside the canvas.
                        if (!isActive(current)) {
                            return;
                        }

                        function detect(x, y) {
                            return (Math.abs(current.x - x) < 5 && Math.abs(current.y - y) < 5);
                        }


                        // record down current status, may be used later for undo.
                        p.checkPoint = {};
                        p.checkPoint.freeSymbolsJSON = JSON.stringify(freeSymbols);
                        p.checkPoint.curvesJSON = JSON.stringify(curves);


                        // check if it is to move a symbol
                        for (let i = 0; i < freeSymbols.length; i++) {
                            if (isOverSymbol(current, freeSymbols[i])) {
                                movedSymbol = freeSymbols[i];
                                freeSymbols.splice(i, 1);
                                prevMousePt = current;
                                action = "MOVE_SYMBOL";

                                // clickedCurveIdx = undefined;

                                return;
                            }
                        }

                        let found = false;
                        function detach1(knots) {
                            if (found) {
                                return;
                            }
                            for (let j = 0; j < knots.length; j++) {
                                let knot = knots[j];
                                if (knot.symbol != undefined && isOverSymbol(current, knot.symbol)) {
                                    movedSymbol = knot.symbol;
                                    knot.symbol = undefined;
                                    bindedKnot = knot;
                                    symbolType = 'symbol';
                                    found = true;
                                    break;
                                }
                            }
                        }

                        function detach2(knots) {
                            if (found) {
                                return;
                            }
                            detach1(knots);
                            for (let j = 0; j < knots.length; j++) {
                                let knot = knots[j];
                                if (knot.xSymbol != undefined && isOverSymbol(current, knot.xSymbol)) {
                                    movedSymbol = knot.xSymbol;
                                    knot.xSymbol = undefined;
                                    bindedKnot = knot;
                                    symbolType = 'xSymbol';
                                    found = true;
                                }
                                if (knot.ySymbol != undefined && isOverSymbol(current, knot.ySymbol)) {
                                    movedSymbol = knot.ySymbol;
                                    knot.ySymbol = undefined;
                                    bindedKnot = knot;
                                    symbolType = 'ySymbol';
                                    found = true;
                                }
                                if (found) {
                                    break;
                                }
                            }
                        }

                        for (let i = 0; i < curves.length; i++) {
                            let interX = curves[i]['interX'];
                            detach1(interX);

                            let interY = curves[i]['interY'];
                            detach1(interY);

                            let maxima = curves[i]['maxima'];
                            detach2(maxima);

                            let minima = curves[i]['minima'];
                            detach2(minima);

                            if (found) {
                                break;
                            }
                        }

                        if (found) {
                            action = "MOVE_SYMBOL";
                            prevMousePt = current;
                                
                            // clickedCurveIdx = undefined;

                            return;
                        }

                        // check if stretching curve 
                        if (clickedCurveIdx != undefined) {
                            let c = curves[clickedCurveIdx];

                            if (detect(c.minX, c.minY) || detect(c.maxX, c.minY) || detect(c.minX, c.maxY) || detect(c.maxX, c.maxY)
                                    || detect((c.minX + c.maxX)/2, c.minY - 3) || detect((c.minX + c.maxX)/2, c.maxY + 3) 
                                    || detect(c.minX - 3, (c.minY + c.maxY)/2) || detect(c.maxX + 3, (c.minY + c.maxY)/2)) {

                                if (detect(c.minX, c.minY)) {
                                    stretchMode = 0;
                                } else if (detect(c.maxX, c.minY)) {
                                    stretchMode = 1;
                                } else if (detect(c.maxX, c.maxY)) {
                                    stretchMode = 2;
                                } else if (detect(c.minX, c.maxY)) {
                                    stretchMode = 3;
                                } else if (detect((c.minX + c.maxX)/2, c.minY - 3)) {
                                    stretchMode = 4;
                                } else if (detect((c.minX + c.maxX)/2, c.maxY + 3)) {
                                    stretchMode = 5;
                                } else if (detect(c.minX - 3, (c.minY + c.maxY)/2)) {
                                    stretchMode = 6;
                                } else {
                                    stretchMode = 7;
                                }


                                action = "STRETCH_CURVE";
                                clickedKnot = null;
                                prevMousePt = current;
                                return;
                            }
                        }


                        if (curves != []) {
                            for (let i = 0; i < curves.length; i++) { 
                                let maxima = curves[i].maxima;
                                let minima = curves[i].minima;
                                for (let j = 0; j < maxima.length; j++) {
                                    let knot = maxima[j];
                                    if (graphFunctions.getDist(current, knot) < MOUSE_DETECT_RADIUS + 10){
                                        clickedCurve = i;
                                        action = "STRETCH_POINT";
                                        clickedKnotId = j;
                                        prevMousePt = current;
                                        minMax = 1;
                                        // console.log("maxima");
                                        return;
                                    } 
                                }
                                for (let j = 0; j < minima.length; j++) {
                                    let knot = minima[j];
                                    if (graphFunctions.getDist(current, knot) < MOUSE_DETECT_RADIUS + 10){
                                        clickedCurve = i;
                                        action = "STRETCH_POINT";
                                        clickedKnotId = j;
                                        prevMousePt = current;
                                        minMax = 0;
                                        // console.log("minima");
                                        return;
                                    } 
                                }
                            }
                            let tc = [];
                            for (let i = 0; i < curves.length; i++) {
                                for (let j = 0; j < curves[i].pts.length; j++) {
                                    if (graphFunctions.getDist(current, curves[i].pts[j]) < MOUSE_DETECT_RADIUS) {
                                        clickedCurveIdx = i;
                                        tc = curves[clickedCurveIdx];
                                        break;
                                    }
                                }
                            } 
                            if (tc != undefined) {   
                                  // && graphFunctions.getDist(current, knot) > MOUSE_DETECT_RADIUS + 10
                                if (current.x >= tc.minX && current.x <= tc.maxX && current.y >= tc.minY && current.y <= tc.maxY) {
                                    movedCurveIdx = clickedCurveIdx;
                                    action = "MOVE_CURVE";
                                    clickedKnot = null;
                                    prevMousePt = current;
                                    return;
                                }
                            }
                        }

                        if (curves.length < CURVE_LIMIT){
                            action = "DRAW_CURVE";
                        }


                        if (clickedCurveIdx != undefined || clickedKnot != null) {
                            clickedCurveIdx = undefined;
                            clickedKnot = null;
                            reDraw();
                        }

                        if (key === "shift") {
                            lineStart = current;
                            drawMode = "line";
                        } else {
                            drawMode = "curve";
                        }

                        if (key === 46) {
                            // delete key pressed
                            if (clickedCurveIdx != undefined) {
                                let curve = (curves.splice(movedCurveIdx, 1))[0];

                                function freeAllSymbols(knots) {
                                    for (let i = 0; i < knots.length; i++) {
                                        let knot = knots[i];
                                        if (knot.symbol != undefined) {
                                            freeSymbols.push(knot.symbol);
                                        }
                                        if (knot.xSymbol != undefined) {
                                            freeSymbols.push(knot.xSymbol);
                                        }
                                        if (knot.ySymbol != undefined) {
                                            freeSymbols.push(knot.ySymbol);
                                        }
                                    }
                                }

                                let interX = curve.interX;
                                freeAllSymbols(interX);

                                let interY = curve.interY;
                                freeAllSymbols(interY);

                                let maxima = curve.maxima;
                                freeAllSymbols(maxima);

                                let minima = curve.minima;
                                freeAllSymbols(minima);

                                clickedCurveIdx = undefined;
                            }
                        }

                        // get drawnColor
                        switch (colorSelect.value) {
                            case "Blue": {
                                drawnColorIdx = 0;
                                break;
                            }
                            case "Orange": {
                                drawnColorIdx = 1;
                                break;
                            }
                            case "Green": {
                                drawnColorIdx = 2;
                                break;
                            }
                        }
                        return;
                    }

                    p.mouseDragged = function(e) {
                        isMouseDragged = true;
                        let current = getMousePt(e);
                        releasePt = current;

                        if (action == "STRETCH_POINT") {
                            let m = curves[clickedCurve];
                            let tempScale = [];
                            let switcher = undefined;
                            let checka = undefined;     
                            if (m.pts[0].x > m.pts[m.pts.length - 1].x) {
                                m.pts.reverse();
                                for (i = 0; i < m.pts.length; i++) {
                                    m.pts[i].ind = i;
                                }
                                m.endPt = findEndPts(m.pts);
                                m.maxima = findTurnPts(m.pts, 'maxima');
                                m.minima = findTurnPts(m.pts, 'minima');

                                reDraw();
                            }
                            tempScale.push.apply(tempScale, m.endPt);
                            tempScale.push.apply(tempScale, m.maxima);
                            tempScale.push.apply(tempScale, m.minima);
                            tempScale.sort(function(a, b){return a.ind - b.ind});
                            let tempMin = undefined;
                            let tempMax = undefined;
                            if (minMax == 1) { 
                                for (let q = 0; q < tempScale.length; q++) {
                                    if (tempScale[q].ind < (m.maxima[clickedKnotId].ind + 4) && tempScale[q].ind < (m.maxima[clickedKnotId].ind - 4)) {
                                        tempMin = tempScale[q];
                                    } else if (tempScale[q].ind > (m.maxima[clickedKnotId].ind + 4)) {
                                        tempMax = tempScale[q];
                                        break;
                                    }
                                }
                                if ((current.x - tempMax.x) > -30 || (current.x - tempMin.x) < 30) {
                                    // console.log("Can you please not");
                                } else if ((current.y - tempMax.y) > -15 || (current.y - tempMin.y) > -15) {

                                } else {
                                    // to this point we get the clicked know and the turning/end points either side, no we will split the curve into the two
                                    // origional max/min sides and the 2 new curves to be stretched, then combine them all after.
                                    let lowerRng = [];
                                    let upperRng = [];
                                    let tempCurveLower = [];
                                    let tempCurveHigher = [];
                                    let tempCurveL = [];
                                    let tempCurveH = [];
                                    let initialSearch = [];
                                    let intpts = m.pts
                                    for (let t = intpts.length - 1; t > -1; t--) {
                                        if (intpts[t].ind > tempMax.ind) {
                                            upperRng.push(intpts[t]); 
                                            intpts.pop(intpts[t]);
                                        } else if (intpts[t].ind <= tempMax.ind && intpts[t].ind >= m.maxima[clickedKnotId].ind) {
                                            tempCurveHigher.push(intpts[t]);
                                            intpts.pop(intpts[t]);
                                        } else if (intpts[t].ind <= m.maxima[clickedKnotId].ind && intpts[t].ind >= tempMin.ind) {
                                            tempCurveLower.push(intpts[t]);
                                            intpts.pop(intpts[t]);
                                        } else if (intpts[t].ind < tempMin.ind) {
                                            lowerRng.push(intpts[t]);
                                            intpts.pop(intpts[t]);
                                        }              
                                    }

                                    lowerRng.sort(function(a, b){return a.ind - b.ind});
                                    upperRng.sort(function(a, b){return a.ind - b.ind});
                                    tempCurveLower.sort(function(a, b){return a.ind - b.ind});
                                    tempCurveHigher.sort(function(a, b){return a.ind - b.ind});
                                    tempCurveL.pts = tempCurveLower;
                                    tempCurveH.pts = tempCurveHigher;

                                    // we have now split the curve into lowerRng and upperRng, plus tempCurveLower and tempCurveHigher
                                    let lorx = m.maxima[clickedKnotId].x - tempMin.x;
                                    let lory = m.maxima[clickedKnotId].y - tempMin.y;
                                    let rorx = tempMax.x - m.maxima[clickedKnotId].x;
                                    let rory = m.maxima[clickedKnotId].y - tempMax.y;
                                    let dx = current.x - prevMousePt.x;
                                    let dy = current.y - prevMousePt.y;
                                    prevMousePt = current;
                                    m.maxima[clickedKnotId].x += dx;
                                    m.maxima[clickedKnotId].y += dy;

                                    let lnrx = m.maxima[clickedKnotId].x - tempMin.x;
                                    let lnry = m.maxima[clickedKnotId].y - tempMin.y;
                                    let rnrx = tempMax.x - m.maxima[clickedKnotId].x;
                                    let rnry = m.maxima[clickedKnotId].y - tempMax.y;
                                    stretchMode = 2;
                                    switch (stretchMode) {
                                        case 2: {
                                            stretchCurve(tempCurveL, lorx, lory, lnrx, lnry, tempMin.x, tempMin.y);
                                            break;
                                        }
                                    }
                                    stretchMode = 3;
                                    switch (stretchMode) {
                                        case 3: {
                                            stretchCurve(tempCurveH, rorx, rory, rnrx, rnry, tempMax.x, tempMax.y);
                                            break;
                                        }
                                    }
                                    
                                    m.maxima[clickedKnotId] = current;

                                    intpts = [];
                                    intpts.push.apply(intpts, lowerRng);
                                    intpts.push.apply(intpts, tempCurveLower);
                                    intpts.push.apply(intpts, tempCurveHigher);
                                    intpts.push.apply(intpts, upperRng);

                                    m.pts = intpts;
                                    // m.pts = uniqueNames;

                                    m.interX = findInterceptX(m.pts);
                                    m.interY = findInterceptY(m.pts);     
                                    m.maxima = findTurnPts(m.pts, 'maxima');   
                                    m.minima = findTurnPts(m.pts, 'minima');  
                                    let minX = m.pts[0].x;
                                    let maxX = m.pts[0].x;
                                    let minY = m.pts[0].y;
                                    let maxY = m.pts[0].y;      
                                    for (let k = 1; k < m.pts.length; k++) {
                                        minX = Math.min(m.pts[k].x, minX);
                                        maxX = Math.max(m.pts[k].x, maxX);
                                        minY = Math.min(m.pts[k].y, minY);
                                        maxY = Math.max(m.pts[k].y, maxY);
                                    }
                                    m.minX = minX;
                                    m.maxX = maxX;
                                    m.minY = minY;
                                    m.maxY = maxY;               
                                    reDraw();
                                }
                            } else if (minMax ==0) {
                                for (let q = 0; q < tempScale.length; q++) {
                                    if (tempScale[q].ind < (m.minima[clickedKnotId].ind + 4) && tempScale[q].ind < (m.minima[clickedKnotId].ind - 4)) {
                                        tempMin = tempScale[q];
                                    } else if (tempScale[q].ind > (m.minima[clickedKnotId].ind + 4)) {
                                        tempMax = tempScale[q];
                                        break;
                                    }
                                }
                                if ((current.x - tempMax.x) > -30 || (current.x - tempMin.x) < 30) {
                                    // console.log("Can you please not");
                                } else if ((current.y - tempMax.y) < 15 || (current.y - tempMin.y) < 15) {

                                } else {
                                    // to this point we get the clicked know and the turning/end points either side, no we will split the curve into the two
                                    // origional max/min sides and the 2 new curves to be stretched, then combine them all after.
                                    let lowerRng = [];
                                    let upperRng = [];
                                    let tempCurveLower = [];
                                    let tempCurveHigher = [];
                                    let tempCurveL = [];
                                    let tempCurveH = [];
                                    let intpts = m.pts
                                    for (let t = intpts.length - 1; t > -1; t--) {
                                        if (intpts[t].ind > tempMax.ind) {
                                            upperRng.push(intpts[t]); 
                                            intpts.pop(intpts[t]);
                                        } else if (intpts[t].ind <= tempMax.ind && intpts[t].ind >= m.minima[clickedKnotId].ind) {
                                            tempCurveHigher.push(intpts[t]);
                                            intpts.pop(intpts[t]);
                                        } else if (intpts[t].ind <= m.minima[clickedKnotId].ind && intpts[t].ind >= tempMin.ind) {
                                            tempCurveLower.push(intpts[t]);
                                            intpts.pop(intpts[t]);
                                        } else if (intpts[t].ind < tempMin.ind) {
                                            lowerRng.push(intpts[t]);
                                            intpts.pop(intpts[t]);
                                        }              
                                    }

                                    lowerRng.sort(function(a, b){return a.ind - b.ind});
                                    upperRng.sort(function(a, b){return a.ind - b.ind});
                                    tempCurveLower.sort(function(a, b){return a.ind - b.ind});
                                    tempCurveHigher.sort(function(a, b){return a.ind - b.ind});
                                    tempCurveL.pts = tempCurveLower;
                                    tempCurveH.pts = tempCurveHigher;

                                    // we have now split the curve into lowerRng and upperRng, plus tempCurveLower and tempCurveHigher
                                    let lorx = m.minima[clickedKnotId].x - tempMin.x;
                                    let lory = m.minima[clickedKnotId].y - tempMin.y;
                                    let rorx = tempMax.x - m.minima[clickedKnotId].x;
                                    let rory = m.minima[clickedKnotId].y - tempMax.y;
                                    let dx = current.x - prevMousePt.x;
                                    let dy = current.y - prevMousePt.y;
                                    prevMousePt = current;
                                    m.minima[clickedKnotId].x += dx;
                                    m.minima[clickedKnotId].y += dy;

                                    let lnrx = m.minima[clickedKnotId].x - tempMin.x;
                                    let lnry = m.minima[clickedKnotId].y - tempMin.y;
                                    let rnrx = tempMax.x - m.minima[clickedKnotId].x;
                                    let rnry = m.minima[clickedKnotId].y - tempMax.y;
                                    stretchMode = 1;
                                    switch (stretchMode) {
                                        case 1: {
                                            stretchCurve(tempCurveL, lorx, lory, lnrx, lnry, tempMin.x, tempMin.y);
                                            break;
                                        }
                                    }
                                    stretchMode = 0;
                                    switch (stretchMode) {
                                        case 0: {
                                            stretchCurve(tempCurveH, rorx, rory, rnrx, rnry, tempMax.x, tempMax.y);
                                            break;
                                        }
                                    }
                                    
                                    m.minima[clickedKnotId] = current;

                                    intpts = [];
                                    intpts.push.apply(intpts, lowerRng);
                                    intpts.push.apply(intpts, tempCurveLower);
                                    intpts.push.apply(intpts, tempCurveHigher);
                                    intpts.push.apply(intpts, upperRng);
                                    m.pts = intpts;
                                    
                                    m.interX = findInterceptX(m.pts);
                                    m.interY = findInterceptY(m.pts);     
                                    m.maxima = findTurnPts(m.pts, 'maxima');   
                                    m.minima = findTurnPts(m.pts, 'minima');
                                    let minX = m.pts[0].x;
                                    let maxX = m.pts[0].x;
                                    let minY = m.pts[0].y;
                                    let maxY = m.pts[0].y;
                                    for (let k = 1; k < m.pts.length; k++) {
                                        minX = Math.min(m.pts[k].x, minX);
                                        maxX = Math.max(m.pts[k].x, maxX);
                                        minY = Math.min(m.pts[k].y, minY);
                                        maxY = Math.max(m.pts[k].y, maxY);
                                    }
                                    m.minX = minX;
                                    m.maxX = maxX;
                                    m.minY = minY;
                                    m.maxY = maxY;    
                                    reDraw();
                                }
                            }
                        }
        
                        if (action == "MOVE_CURVE") {
                            p.cursor(p.MOVE);

                            scope.trashActive = isOverButton(current, element.find(".trash-button"));
                            scope.$apply();

                            let dx = current.x - prevMousePt.x;
                            let dy = current.y - prevMousePt.y;
                            prevMousePt = current;
                            transCurve(curves[movedCurveIdx], dx, dy);

                            reDraw();
                            drawCurve(curves[movedCurveIdx], MOVE_LINE_COLOR);

                        } else if (action == "STRETCH_CURVE") {

                            function drawCorner() {
                                p.push();
                                p.fill(KNOT_DETECT_COLOR);
                                switch (stretchMode) {
                                    case 0: {
                                        p.rect(c.minX - 4, c.minY - 4, 8, 8);
                                        break;
                                    }
                                    case 1: {
                                        p.rect(c.maxX - 4, c.minY - 4, 8, 8);
                                        break;
                                    }
                                    case 2: {
                                        p.rect(c.maxX - 4, c.maxY - 4, 8, 8);
                                        break;
                                    }
                                    case 3: {
                                        p.rect(c.minX - 4, c.maxY - 4, 8, 8);
                                        break;
                                    }
                                    case 4: {
                                        p.triangle((c.minX + c.maxX)/2 - 5, c.minY - 2, (c.minX + c.maxX)/2 + 5, c.minY - 2, (c.minX + c.maxX)/2, c.minY - 7);
                                        break;
                                    }
                                    case 5: {
                                        p.triangle((c.minX + c.maxX)/2 - 5, c.maxY + 2, (c.minX + c.maxX)/2 + 5, c.maxY + 2, (c.minX + c.maxX)/2, c.maxY + 7);
                                        break;
                                    }
                                    case 6: {
                                        p.triangle(c.minX - 2, (c.minY + c.maxY) / 2 - 5, c.minX - 2, (c.minY + c.maxY) / 2 + 5, c.minX - 7, (c.minY + c.maxY) / 2);
                                        break;
                                    }
                                    case 7: {
                                        p.triangle(c.maxX + 2, (c.minY + c.maxY) / 2 - 5, c.maxX + 2, (c.minY + c.maxY) / 2 + 5, c.maxX + 7, (c.minY + c.maxY) / 2);
                                        break;
                                    }
                                }
                                p.pop();
                            }

                            p.cursor(p.MOVE);

                            let dx = current.x - prevMousePt.x;
                            let dy = current.y - prevMousePt.y;
                            prevMousePt = current;

                            let c = curves[clickedCurveIdx];

                            // calculate old x,y range
                            let orx = c.maxX - c.minX;
                            let ory = c.maxY - c.minY;

                            drawCorner();

                            // update the position of stretched vertex
                            switch (stretchMode) {
                                case 0: {
                                    if (orx < 30 && dx > 0  || ory < 30 && dy > 0) {
                                        return;
                                    }
                                    c.minX += dx;
                                    c.minY += dy;
                                    break;
                                }
                                case 1: {
                                    if (orx < 30 && dx < 0 || ory < 30 && dy > 0) {
                                        return;
                                    }
                                    c.maxX += dx;
                                    c.minY += dy;
                                    break;
                                }
                                case 2: {
                                    if (orx < 30 && dx < 0 || ory < 30 && dy < 0) {
                                        return;
                                    }
                                    c.maxX += dx;
                                    c.maxY += dy;
                                    break;
                                }
                                case 3: {
                                    if (orx < 30 && dy > 0 || ory < 30 && dy < 0) {
                                        return;
                                    }
                                    c.minX += dx;
                                    c.maxY += dy;
                                    break;
                                }
                                case 4: {
                                    if ( ory < 30 && dy > 0) {
                                        return;
                                    }
                                    c.minY += dy;
                                    break;
                                }
                                case 5: {
                                    if (ory < 30 && dy < 0) {
                                        return;
                                    }
                                    c.maxY += dy;
                                    break;
                                }
                                case 6: {
                                    if (orx < 30 && dx > 0) {
                                        return;
                                    }
                                    c.minX += dx;
                                    break;
                                }
                                case 7: {
                                    if (orx < 30 && dx < 0) {
                                        return;
                                    }
                                    c.maxX += dx;
                                    break;
                                }
                            }

                            // calculate the new range
                            let nrx = c.maxX - c.minX;
                            let nry = c.maxY - c.minY;

                            // stretch the curve
                            switch (stretchMode) {
                                case 0: {
                                    stretchCurve(c, orx, ory, nrx, nry, c.maxX, c.maxY);
                                    break;
                                }
                                case 1: {
                                    stretchCurve(c, orx, ory, nrx, nry, c.minX, c.maxY);
                                    break;
                                }
                                case 2: {
                                    stretchCurve(c, orx, ory, nrx, nry, c.minX, c.minY);
                                    break;
                                }
                                case 3: {
                                    stretchCurve(c, orx, ory, nrx, nry, c.maxX, c.minY);
                                    break;
                                }
                                case 4: {
                                    stretchCurve(c, orx, ory, orx, nry, (c.minX + c.maxX)/2, c.maxY);
                                    break;
                                }
                                case 5: {
                                    stretchCurve(c, orx, ory, orx, nry, (c.minX + c.maxX)/2, c.minY);
                                    break;
                                }
                                case 6: {
                                    stretchCurve(c, orx, ory, nrx, ory, c.maxX, (c.minY + c.maxY)/2);
                                    break;
                                }
                                case 7: {
                                    stretchCurve(c, orx, ory, nrx, ory, c.minX, (c.minY + c.maxY)/2);
                                    break;
                                }
                            }
                            
                            reDraw();
                            drawCorner();

                        } else if (action == "MOVE_SYMBOL") {
                            p.cursor(p.MOVE);

                            let dx = current.x - prevMousePt.x;
                            let dy = current.y - prevMousePt.y;
                            prevMousePt = current;

                            movedSymbol.x += dx;
                            movedSymbol.y += dy;

                            reDraw();
                            drawSymbol(movedSymbol, MOVE_SYMBOL_COLOR);

                            function detect(knots) {
                                for (let j = 0; j < knots.length; j++) {
                                    if (knots[j].symbol == undefined && graphFunctions.getDist(movedSymbol, knots[j]) < MOUSE_DETECT_RADIUS) {
                                        drawKnotDetect(knots[j], KNOT_DETECT_COLOR);
                                        return;
                                    }
                                }
                            }

                            for (let i = 0; i < curves.length; i++) {
                                let interX = curves[i]['interX'];
                                detect(interX);

                                let interY = curves[i]['interY'];
                                detect(interY);

                                let maxima = curves[i]['maxima'];
                                detect(maxima);

                                let minima = curves[i]['minima'];
                                detect(minima);
                            }


                            if (clickedKnot != null) {
                                let knot = clickedKnot;
                                if (knot.xSymbol == undefined && graphFunctions.getDist(movedSymbol, graphFunctions.createPoint(knot.x, canvasHeight/2)) < MOUSE_DETECT_RADIUS) {
                                    drawKnotDetect(graphFunctions.createPoint(knot.x, canvasHeight/2), KNOT_DETECT_COLOR);
                                    return;
                                }
                                if (knot.ySymbol == undefined && graphFunctions.getDist(movedSymbol, graphFunctions.createPoint(canvasWidth/2, knot.y)) < MOUSE_DETECT_RADIUS) {
                                    drawKnotDetect(graphFunctions.createPoint(canvasWidth/2, knot.y), KNOT_DETECT_COLOR);
                                    return;
                                }
                            }


                        } else if (action == "DRAW_CURVE") {
                            p.cursor(p.CROSS);
                            if (curves.length < CURVE_LIMIT) {
                                if (drawMode == "curve") {
                                    p.push();
                                    p.stroke(CURVE_COLORS[drawnColorIdx]);
                                    p.strokeWeight(CURVE_STRKWEIGHT);
                                    if (drawnPts.length > 0) {
                                        let prev = drawnPts[drawnPts.length - 1];
                                        p.line(prev.x, prev.y, current.x, current.y);
                                    }
                                    p.pop();

                                    drawnPts.push(current);
                                } else {
                                    reDraw();

                                    p.push();
                                    p.stroke(CURVE_COLORS[drawnColorIdx]);
                                    p.strokeWeight(CURVE_STRKWEIGHT);
                                    p.line(lineStart.x, lineStart.y, current.x, current.y);
                                    p.pop();

                                    lineEnd = current;
                                }
                            }
                        }
                    }

                    p.mouseReleased = function(e) {
                        let current = releasePt;

                        // if it is just a click, handle click in the following if block
                        if (!isMouseDragged) {

                            // clean up the mess of MOVE_SYMBOL and MOVE_CURVE
                            if (action  == "MOVE_SYMBOL") {
                                if (bindedKnot == undefined) {
                                    freeSymbols.push(movedSymbol);
                                } else {
                                    bindedKnot[symbolType] = movedSymbol;
                                }
                                reDraw();

                            } else if (action == "MOVE_CURVE" || action == "STRETCH_CURVE" || action == "STRETCH_POINT") {
                                reDraw();
                            }

                            // click do not respond in inactive area (eg buttons)
                            if (!isActive(current)) {
                                return;
                            }


                            // check if show stretch box
                            for (let i = 0; i < curves.length; i++) {
                                let pts = curves[i].pts;
                                for (let j = 0; j < pts.length; j++) {
                                    if (graphFunctions.getDist(pts[j], current) < MOUSE_DETECT_RADIUS) {
                                        clickedCurveIdx = i;
                                        reDraw();
                                        return;
                                    }
                                }
                            }


                            if (clickedKnot != null || clickedCurveIdx != undefined) {
                                clickedKnot = null;
                                clickedCurveIdx = undefined;
                                reDraw();
                            }

                            return;
                        }

                        if (action == "MOVE_CURVE") {

                            p.checkPointsUndo.push(p.checkPoint);
                            p.checkPointsRedo = [];

                            // for deletion
                            if (scope.trashActive) {
                                let curve = (curves.splice(movedCurveIdx, 1))[0];

                                function freeAllSymbols(knots) {
                                    for (let i = 0; i < knots.length; i++) {
                                        let knot = knots[i];
                                        if (knot.symbol != undefined) {
                                            freeSymbols.push(knot.symbol);
                                        }
                                        if (knot.xSymbol != undefined) {
                                            freeSymbols.push(knot.xSymbol);
                                        }
                                        if (knot.ySymbol != undefined) {
                                            freeSymbols.push(knot.ySymbol);
                                        }
                                    }
                                }

                                let interX = curve.interX;
                                freeAllSymbols(interX);

                                let interY = curve.interY;
                                freeAllSymbols(interY);

                                let maxima = curve.maxima;
                                freeAllSymbols(maxima);

                                let minima = curve.minima;
                                freeAllSymbols(minima);

                                clickedCurveIdx = undefined;
                            }

                            scope.trashActive = false;
                            scope.$apply();
                            reDraw();

                        } else if (action == "STRETCH_CURVE") {
                            p.checkPointsUndo.push(p.checkPoint);
                            p.checkPointsRedo = [];

                            let c = curves[clickedCurveIdx];

                        } else if (action == "STRETCH_POINT") {
                            p.checkPointsUndo.push(p.checkPoint);
                            p.checkPointsRedo = [];

                            let c = curves[clickedCurveIdx];

                        } else if (action == "MOVE_SYMBOL") {
                            p.checkPointsUndo.push(p.checkPoint);
                            p.checkPointsRedo = [];
                            scope.$apply();

                            let found = false;

                            function attach(knots) {
                                if (found) {
                                    return;
                                }
                                for (let j = 0; j < knots.length; j++) {
                                    let knot = knots[j];
                                    if (knot.symbol == undefined && graphFunctions.getDist(movedSymbol, knot) < MOUSE_DETECT_RADIUS) {
                                        movedSymbol.x = knot.x;
                                        movedSymbol.y = knot.y;
                                        knot.symbol = movedSymbol;
                                        found = true;
                                    }
                                }
                            }

                            for (let i = 0; i < curves.length; i++) {
                                let interX = curves[i]['interX'];
                                attach(interX);

                                let interY = curves[i]['interY'];
                                attach(interY);

                                let maxima = curves[i]['maxima'];
                                attach(maxima);

                                let minima = curves[i]['minima'];
                                attach(minima);

                                if (found) {
                                    break;
                                }
                            }

                            if (!found && clickedKnot != null) {
                                let knot = clickedKnot;
                                if (knot.xSymbol == undefined && graphFunctions.getDist(movedSymbol, graphFunctions.createPoint(knot.x, canvasHeight/2)) < MOUSE_DETECT_RADIUS) {
                                    movedSymbol.x = knot.x;
                                    movedSymbol.y = canvasHeight/2;
                                    knot.xSymbol = movedSymbol;
                                    found = true;
                                } else if (knot.ySymbol == undefined && graphFunctions.getDist(movedSymbol, graphFunctions.createPoint(canvasWidth/2, knot.y)) < MOUSE_DETECT_RADIUS) {
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
                            if (curves.length < CURVE_LIMIT){

                                let curve;

                                if (drawMode == "curve") {
                                     // reject if curve drawn is too short
                                    if (lineSampler.sample(drawnPts).length < 3) {
                                        return;
                                    }

                                    p.checkPointsUndo.push(p.checkPoint);
                                    p.checkPointsRedo = [];
                                    scope.$apply();

                                    // adjustment of start and end to attach to the axis automatically.
                                    if (Math.abs(drawnPts[0].y - canvasHeight/2) < 3) {
                                        drawnPts[0].y = canvasHeight/2;
                                    }
                                    if (Math.abs(drawnPts[0].x - canvasWidth/2) < 3) {
                                        drawnPts[0].x = canvasWidth/2;
                                    }
                                    if (Math.abs(drawnPts[drawnPts.length - 1].y - canvasHeight/2) < 3) {
                                        drawnPts[drawnPts.length - 1].y = canvasHeight/2;
                                    }
                                    if (Math.abs(drawnPts[drawnPts.length - 1].x - canvasWidth/2) < 3) {
                                        drawnPts[drawnPts.length - 1].x = canvasWidth/2;
                                    }

                                    // sampler.sample, bezier.genericBezier
                                    let pts = scope.selectedLineType.lineStyle(lineSampler.sample(drawnPts));
                                    curve = {};
                                    curve.pts = pts;

                                    let minX = pts[0].x;
                                    let maxX = pts[0].x;
                                    let minY = pts[0].y;
                                    let maxY = pts[0].y;
                                    for (let i = 1; i < pts.length; i++) {
                                        minX = Math.min(pts[i].x, minX);
                                        maxX = Math.max(pts[i].x, maxX);
                                        minY = Math.min(pts[i].y, minY);
                                        maxY = Math.max(pts[i].y, maxY);
                                    }
                                    curve.minX = minX;
                                    curve.maxX = maxX;
                                    curve.minY = minY;
                                    curve.maxY = maxY;

                                    curve.endPt = findEndPts(pts);
                                    curve.interX = findInterceptX(pts);
                                    curve.interY = findInterceptY(pts);
                                    curve.maxima = findTurnPts(pts, 'maxima');
                                    curve.minima = findTurnPts(pts, 'minima');
                                    curve.colorIdx = drawnColorIdx;

                                } else {
                                    p.checkPointsUndo.push(p.checkPoint);
                                    p.checkPointsRedo = [];
                                    scope.$apply();


                                    let n = 100;
                                    let rx = lineEnd.x - lineStart.x;
                                    let ry = lineEnd.y - lineStart.y;
                                    let sx = rx / n;
                                    let sy = ry / n;
                                    let pts = [];
                                    for (let i = 0; i <= n; i++) {
                                        let x = lineStart.x + i * sx;
                                        let y = lineStart.y + i * sy;
                                        pts.push(graphFunctions.createPoint(x, y, i));
                                    }

                                    curve = {};
                                    curve.pts = pts;

                                    curve.minX = Math.min(lineStart.x, lineEnd.x);
                                    curve.maxX = Math.max(lineStart.x, lineEnd.x);
                                    curve.minY = Math.min(lineStart.y, lineEnd.y);
                                    curve.maxY = Math.max(lineStart.y, lineEnd.y);

                                    curve.endPt = findEndPts(pts);
                                    curve.interX = findInterceptX(pts);
                                    curve.interY = findInterceptY(pts);
                                    curve.maxima = [];
                                    curve.minima = [];
                                    curve.colorIdx = drawnColorIdx;
                                }
                            

                                function loop(knots) {
                                    for (let i = 0; i < knots.length; i++) {
                                        let knot = knots[i];
                                        for (let j = 0; j < freeSymbols.length; j++) {
                                            let sym = freeSymbols[j];
                                            if (graphFunctions.getDist(knot, sym) < 20) {
                                                sym.x = knot.x;
                                                sym.y = knot.y;
                                                knot.symbol = sym;
                                                freeSymbols.splice(j, 1);
                                            }
                                        }
                                    }
                                }

                                loop(curve.maxima);
                                loop(curve.minima);
                                loop(curve.interX);
                                loop(curve.interY);

                                curves.push(curve);
                                reDraw();
                            }

                            return;
                        }
                    }

                    p.touchStarted = function(e) {
                        p.mousePressed(e.touches[0]);
                    }

                    p.touchMoved = function(e) {
                        p.mouseDragged(e.touches[0]);
                    }

                    p.touchEnded = function(e) {
                        p.mouseReleased(e);
                    }

                    p.windowResized = function() {
                        let data = encodeData(false);
                        canvasWidth = window.innerWidth;
                        canvasHeight = window.innerHeight;
                        p.resizeCanvas(window.innerWidth, window.innerHeight);
                        decodeData(data);
                        reDraw();
                    }

                    window.onkeydown = function(event) {
                       if (event.keyCode == 46) { // delete key
                            p.checkPointsUndo.push(p.checkPoint);
                            p.checkPointsRedo = [];
                            if (clickedCurveIdx != undefined) {
                                let curve = (curves.splice(clickedCurveIdx, 1))[0];

                                function freeAllSymbols(knots) {
                                    for (let i = 0; i < knots.length; i++) {
                                        let knot = knots[i];
                                        if (knot.symbol != undefined) {
                                            freeSymbols.push(knot.symbol);
                                        }
                                        if (knot.xSymbol != undefined) {
                                            freeSymbols.push(knot.xSymbol);
                                        }
                                        if (knot.ySymbol != undefined) {
                                            freeSymbols.push(knot.ySymbol);
                                        }
                                    }
                                }

                                let interX = curve.interX;
                                freeAllSymbols(interX);

                                let interY = curve.interY;
                                freeAllSymbols(interY);

                                let maxima = curve.maxima;
                                freeAllSymbols(maxima);

                                let minima = curve.minima;
                                freeAllSymbols(minima);

                                clickedCurveIdx = undefined;
                                reDraw();
                            }
                        }
                    }

                    function getMousePt(e) {
                        let x = (e.clientX - 5);
                        let y = (e.clientY - 5);
                        return (graphFunctions.createPoint(x, y));
                    }

                    function isOverSymbol(pt, symbol) {
                        if (symbol == undefined) {
                            return false;
                        }
                        let left = symbol.x - 5;
                        let right = symbol.x + 5;
                        let top = symbol.y - 5;
                        let bottom = symbol.y + 20 + 5;
                        return (pt.x > left && pt.x < right && pt.y > top && pt.y < bottom);
                    }

                    function isOverButton(pt, button) {
                        if (button.position() == undefined) {
                            return false;
                        }

                        let left = button.position().left;
                        let top = button.position().top;
                        let width = button.width();
                        let height = button.height();
                        return (pt.x > left && pt.x < left + width && pt.y > top && pt.y < top + height);
                    }

                    function isActive(pt) {

                        if (!(pt.x > 0 && pt.x < canvasWidth && pt.y > 0 && pt.y < canvasHeight)) {
                            return false;
                        }

                        let buttons = [];
                        buttons.push(element.find(".redo"));
                        buttons.push(element.find(".undo"));
                        buttons.push(element.find(".poly"));
                        buttons.push(element.find(".straight"));
                        buttons.push(element.find(".trash-button"));
                        buttons.push(element.find(".submit"));
                        for (let i = 0; i < buttons.length; i++) {
                            if (isOverButton(pt, buttons[i])) {
                                return false;
                            }
                        }

                        return true;
                    }

                    reDraw = function() {
                        if (curves.length < 4) {
                            drawBackground();
                            drawCurves(curves);
                            scope.dat = encodeData();
                            drawSymbols(freeSymbols);
                            drawStretchBox(clickedCurveIdx);
                        }
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

                        function drawGrid() {
                            p.push();

                            p.noFill();
                            p.strokeWeight(CURVE_STRKWEIGHT);
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

                        drawGrid();
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


                        // want to connect closest points x,y wise, not just x wise
                        let pts = curve.pts;
                        for (let i = 1; i < pts.length; i++) {
                            if (pts[i].x - pts[i-1].x < 100 && pts[i].y - pts[i-1].y < 100) {
                                p.line(pts[i-1].x, pts[i-1].y, pts[i].x, pts[i].y);
                            }
                        }

                        // to here for point connection

                        p.pop();

                        curve.endPt = findEndPts(curve.pts);
                        // draw x intercepts, y intercepts and turning points
                        drawKnots(curve['interX']);
                        drawKnots(curve['interY']);
                        drawKnots2(curve['maxima']);
                        drawKnots2(curve['minima']);
                    }

                    function findEndPts(pts) {
                        if (pts.length == 0) return [];

                        let ends = [];

                        ends.push(graphFunctions.createPoint(pts[0].x, pts[0].y, pts[0].ind));
                        ends.push(graphFunctions.createPoint(pts[pts.length - 2].x, pts[pts.length - 2].y, pts[pts.length - 2].ind));

                        for (let i = 1; i < pts.length; i++) {
                            if (pts[i-1].x - pts[i].x > 200) {
                                ends.push(graphFunctions.createPoint(pts[i-1].x, pts[i-1].y, pts[i-1].ind));
                                ends.push(graphFunctions.createPoint(pts[i].x, pts[i].y, pts[i].ind));
                                continue;
                            }
                        }

                        if (ends.length == 2) {
                            for (let i = pts.length - 2; i > 1; i--) {
                                if (pts[i+1].x - pts[i].x > 200) {
                                    ends.push(graphFunctions.createPoint(pts[i+1].x, pts[i+1].y, pts[i+1].ind));
                                    ends.push(graphFunctions.createPoint(pts[i].x, pts[i].y, pts[i].ind));
                                    continue;
                                }
                            }
                        }

                        return ends;
                    }

                    function drawCurves(curves, color) {
                        for (let i = 0; i < curves.length; i++) {
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

                    function drawKnotDetect(knot) {
                        p.push();
                        p.noFill();
                        p.stroke(KNOT_DETECT_COLOR);
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
                        p.textSize(16);
                        p.text(symbol.text, symbol.x - 5, symbol.y + 20);

                        p.pop();
                    }

                    function drawSymbols(symbols, color) {
                        for (let i = 0; i < symbols.length; i++) {
                            drawSymbol(symbols[i], color);
                        }
                    }

                    function drawVerticalDotLine(x, begin, end) {
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
                        p.strokeWeight(CURVE_STRKWEIGHT);

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
                    }

                    function drawHorizontalDotLine(y, begin, end) {
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
                        p.strokeWeight(CURVE_STRKWEIGHT);

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
                    }

                    function drawStretchBox(idx) {
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
                    }

                    function findInterceptX(pts) {
                        if (pts.length == 0) return [];

                        let intercepts = [];

                        if (pts[0].y == canvasHeight/2) intercepts.push(pts[0]);
                        for (let i = 1; i < pts.length; i++) {
                            if (pts[i].y == canvasHeight/2) {
                                intercepts.push(graphFunctions.createPoint(pts[i].x, pts[i].y));
                                continue;
                            }

                            if ((pts[i-1].y - canvasHeight/2) * (pts[i].y - canvasHeight/2) < 0 && (pts[i-1].y - pts[i].y < Math.abs(200))) {
                                let dx = pts[i].x - pts[i-1].x;
                                let dy = pts[i].y - pts[i-1].y;
                                let grad = dy/dx;
                                let esti = pts[i-1].x + (1 / grad) * (canvasHeight/2 - pts[i-1].y);
                                intercepts.push(graphFunctions.createPoint(esti, canvasHeight/2));
                            }
                        }

                        return intercepts;
                    }

                    function findInterceptY(pts) {
                        if (pts.length == 0) return [];

                        let intercepts = [];

                        if (pts[0].x == canvasWidth/2) intercepts.push(pts[0]);
                        for (let i = 1; i < pts.length; i++) {
                            if (pts[i].x == canvasWidth/2) {
                                intercepts.push(graphFunctions.createPoint(pts[i].x, pts[i].y));
                                continue;
                            }

                            if ((pts[i-1].x - canvasWidth/2) * (pts[i].x - canvasWidth/2) < 0 && (pts[i-1].x - pts[i].x < Math.abs(200))) {
                                let dx = pts[i].x - pts[i-1].x;
                                let dy = pts[i].y - pts[i-1].y;
                                let grad = dy/dx;
                                let esti = pts[i-1].y + grad * (canvasWidth/2 - pts[i-1].x);
                                intercepts.push(graphFunctions.createPoint(canvasWidth/2, esti));
                            }
                        }

                        return intercepts;
                    }

                    function findTurnPts(pts, mode) {
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
                                            turnPts.push(graphFunctions.createPoint(pts[i].x, pts[i].y, pts[i].ind));
                                        } 
                                    } else {
                                        if ((pts[i].x > pts[i-1].x && acc1 > 0 && acc2 < 0) || (pts[i].x < pts[i-1].x && acc1 < 0 && acc2 > 0)) {
                                            turnPts.push(graphFunctions.createPoint(pts[i].x, pts[i].y, pts[i].ind));
                                        } 
                                    }


                                }
                            }
                        }

                        return turnPts;
                    }

                    // given a curve, translate the curve
                    function transCurve(curve, dx, dy) {
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
                                        if (graphFunctions.getDist(inter[i], newInter[j]) < min) {
                                            min = graphFunctions.getDist(inter[i], newInter[j]);
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
                            newInterX = findInterceptX(pts);
                        curve.interX = moveInter(interX, newInterX);

                        let endPt = curve.endPt,
                            newEndPt = findEndPts(pts);
                        curve.endPt = newEndPt;


                        let interY = curve.interY,
                            newInterY = findInterceptY(pts);
                        curve.interY = moveInter(interY, newInterY);

                        return;
                    }

                    function stretchCurve(c, orx, ory, nrx, nry, baseX, baseY) {

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

                        c.endPt = findEndPts(pts)

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
                                            if (graphFunctions.getDist(inter[i], newInter[j]) < min) {
                                                min = graphFunctions.getDist(inter[i], newInter[j]);
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
                            newInterX = findInterceptX(pts);
                        c.interX = loop2(interX, newInterX);


                        let interY = c.interY,
                            newInterY = findInterceptY(pts);
                        c.interY = loop2(interY, newInterY);
                    }

                    function clone(obj) {
                        let json = JSON.stringify(obj);
                        return JSON.parse(json);
                    }

                    function encodeData(trunc) {

                        if (trunc == undefined) {
                            trunc = true;
                        }

                        if (canvasWidth > 5000 || canvasWidth <= 0) {
                            alert("Invalid canvasWidth.");
                            return;
                        }

                        if (canvasHeight > 5000 || canvasHeight <= 0) {
                            alert("Invalid canvasHeight.");
                            return;
                        }

                        let data = {};
                        data.canvasWidth = canvasWidth;
                        data.canvasHeight = canvasHeight;

                        let clonedCurves = clone(curves);

                        // sort segments according to their left most points.
                        function compare(curve1, curve2) {
                            function findMinX(pts) {
                                if (pts.length == 0) return 0;
                                let min = canvasWidth;
                                for (let i = 0; i < pts.length; i++)
                                    min = Math.min(min, pts[i].x);
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
                            let x = (pt.x - canvasWidth/2) / canvasWidth;
                            let y = (canvasHeight/2 - pt.y) / canvasHeight;
                            if (trunc) {
                                pt.x = Math.trunc(x * 1000) / 1000;
                                pt.y = Math.trunc(y * 1000) / 1000;
                            } else {
                                pt.x = x;
                                pt.y = y;
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

                            tmp = (clonedCurves[i].minX - canvasWidth/2) / canvasWidth;
                            clonedCurves[i].minX = Math.trunc(tmp * 1000) / 1000;

                            tmp = (clonedCurves[i].maxX - canvasWidth/2) / canvasWidth;
                            clonedCurves[i].maxX = Math.trunc(tmp * 1000) / 1000;

                            tmp = (canvasHeight/2 - clonedCurves[i].minY) / canvasHeight;
                            clonedCurves[i].minY = Math.trunc(tmp * 1000) / 1000;

                            tmp = (canvasHeight/2 - clonedCurves[i].maxY) / canvasHeight;
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

                        let clonedFreeSymbols = clone(freeSymbols);
                        for (let i = 0; i < clonedFreeSymbols.length; i++) {
                            let symbol = clonedFreeSymbols[i];
                            normalise(symbol);
                        }
                        data.freeSymbols = clonedFreeSymbols;

                        return data;
                    }

                    function decodeData(rawData) {

                        let data = rawData;

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

                            curves[i].minX = curves[i].minX * canvasWidth + canvasWidth/2;
                            curves[i].maxX = curves[i].maxX * canvasWidth + canvasWidth/2;
                            curves[i].minY = canvasHeight/2 - curves[i].minY * canvasHeight;
                            curves[i].maxY = canvasHeight/2 - curves[i].maxY * canvasHeight;

                            let interX = curves[i].interX;
                            denormalise1(interX);

                            let interY = curves[i].interY;
                            denormalise1(interY);

                            let maxima = curves[i].maxima;
                            denormalise2(maxima);

                            let minima = curves[i].minima;
                            denormalise2(minima);
                        }

                        freeSymbols = data.freeSymbols;
                        for (let j = 0; j < freeSymbols.length; j++) {
                            denormalise(freeSymbols[j]);
                        }

                        reDraw();
                        return;
                    }

                    scope.undo = function() {
                        if (p.checkPointsUndo.length == 0 || p.checkPointsUndo === undefined) {
                            return;
                        }

                        let checkPointRedo = {};
                        checkPointRedo.freeSymbolsJSON = JSON.stringify(freeSymbols);
                        checkPointRedo.curvesJSON = JSON.stringify(curves);
                        p.checkPointsRedo.push(checkPointRedo);

                        let checkPointUndo = p.checkPointsUndo.pop();
                        freeSymbols = JSON.parse(checkPointUndo.freeSymbolsJSON);
                        curves = JSON.parse(checkPointUndo.curvesJSON);
                        
                        clickedKnot = null;
                        clickedCurveIdx = undefined;

                        reDraw();
                    }

                    scope.redo = function() {
                        event.stopPropagation();
                        if (p.checkPointsRedo.length == 0) {
                            return;
                        }

                        let checkPointUndo = {};
                        checkPointUndo.freeSymbolsJSON = JSON.stringify(freeSymbols);
                        checkPointUndo.curvesJSON = JSON.stringify(curves);
                        p.checkPointsUndo.push(checkPointUndo);

                        let checkPointRedo = p.checkPointsRedo.pop();
                        freeSymbols = JSON.parse(checkPointRedo.freeSymbolsJSON);
                        curves = JSON.parse(checkPointRedo.curvesJSON);
                        
                        clickedKnot = null;
                        clickedCurveIdx = undefined;
                        reDraw();
                    }

                    scope.isUndoable = function() {
                        return (p.checkPointsUndo.length > 0);
                    }

                    scope.isRedoable = function() {
                        return (p.checkPointsRedo.length > 0);
                    }

                    scope.straight = function() {
                        scope.selectedLineType = linearLineType;
                    }

                    scope.poly = function() {
                        scope.selectedLineType = bezierLineType;
                    }

                    scope.clean = function() {
                        p.checkPoint = {};
                        p.checkPoint.freeSymbolsJSON = JSON.stringify(freeSymbols);
                        p.checkPoint.curvesJSON = JSON.stringify(curves);
                        p.checkPointsUndo.push(p.checkPoint);
                        p.checkPointsRedo = [];

                        curves = [];
                        clickedKnot = null;
                        clickedCurveIdx = undefined;
                        initiateFreeSymbols();
                        reDraw();
                    }

                    scope.submit = function() {
                        $("#graphModal").foundation("reveal", "close");
                    };
                }

                $rootScope.showGraphSketcher = function(initialState, questionDoc, editorMode) {
                    return new Promise(function(resolve, reject) {
                        let graphSketcherModal = $('#graphModal');
                        scope.p = new p5(scope.sketch, element.find(".graph-sketcher")[0]);
                        
                        graphSketcherModal.foundation("reveal", "open");
                        scope.state = initialState || {freeSymbols: []}
                        scope.questionDoc = questionDoc;
                        scope.editorMode = editorMode
                        
                        scope.log = {
                            type: "TEST_GRAPH_SKETCHER_LOG",
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
                        graphSketcherModal.one("close", function(e) {
                            scope.log.finalState = [];
                            scope.dat.curves.forEach(function(e) {
                                scope.log.finalState.push(e);
                            });
                            scope.log.actions.push({
                                event: "CLOSE",
                                timestamp: Date.now()
                            });
                            console.log("\nLOG: ~" + (JSON.stringify(scope.log).length / 1000).toFixed(2) + "kb\n\n", JSON.stringify(scope.log));
                            window.removeEventListener("beforeunload", scope.logOnClose);
                            api.logger.log(scope.log);
                            scope.log = null;
                            return(scope.state);
                        });

                        graphSketcherModal.one("closed.fndtn.reveal", function() {
                            scope.p.remove();
                            resolve(scope.dat);
                        });

                        // reload previous answer if there is one ////////////////////////////////////////////////
                        if (scope.state.curves != undefined && scope.state.freeSymbols != undefined) {
                            decodeData(scope.state);
                            reDraw();
                        }
                    });
                };
            }
        };
    }];
});
