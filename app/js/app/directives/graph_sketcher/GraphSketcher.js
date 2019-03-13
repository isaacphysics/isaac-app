'use strict';
define(["p5", "./GraphView.js", "./GraphUtils.js", "/partials/graph_sketcher/graph_sketcher.html"],
    function(p5, graphViewBuilder, graphUtils, templateUrl) {
    return ["$rootScope", "api", function($rootScope, api) {
        return {
            restrict: "A",
            templateUrl: templateUrl,

            link: function(scope, element, _attrs) {

                scope.title = "Sketcher";
                scope.selectedLineType = "bezier";

                // objects which are shared between sketch and the ui buttons
                let colorSelect = element.find(".color-select")[0];
                let encodeData;
                let reDraw;
                let curves = [];
                let clickedKnot = null;
                let clickedCurveIdx;

                element.on("touchstart touchmove", "canvas", function(e) {
                    e.preventDefault();
                });

                // undo-ing, record history
                scope.undo = function() {
                    if (scope.p.checkPointsUndo.length == 0 || scope.p.checkPointsUndo === undefined) {
                        return;
                    }

                    let checkPointRedo = {};
                    checkPointRedo.curvesJSON = JSON.stringify(curves);
                    scope.p.checkPointsRedo.push(checkPointRedo);

                    let checkPointUndo = scope.p.checkPointsUndo.pop();
                    curves = JSON.parse(checkPointUndo.curvesJSON);
                    clickedKnot = null;
                    clickedCurveIdx = undefined;

                    reDraw();
                }

                //redo-ing, record history
                scope.redo = function() {
                    event.stopPropagation();
                    if (scope.p.checkPointsRedo.length == 0) {
                        return;
                    }

                    let checkPointUndo = {};
                    checkPointUndo.curvesJSON = JSON.stringify(curves);
                    scope.p.checkPointsUndo.push(checkPointUndo);

                    let checkPointRedo = scope.p.checkPointsRedo.pop();
                    curves = JSON.parse(checkPointRedo.curvesJSON);

                    clickedKnot = null;
                    clickedCurveIdx = undefined;
                    reDraw();
                }

                // Check if undo/redo should be made available, if so the respective option will be shown
                scope.isUndoable = function() {
                    return scope.p && scope.p.checkPointsUndo.length > 0;
                }

                scope.isRedoable = function() {
                    return scope.p && scope.p.checkPointsRedo.length > 0;
                }

                // Want to distinguish straight vs curved (poly) lines
                scope.straight = function() {
                    scope.selectedLineType = "linear";
                }

                scope.poly = function() {
                    scope.selectedLineType = "bezier";
                }

                // The ability to wipe the canvas, deletion for example
                scope.clean = function() {
                    scope.p.checkPoint = {};
                    scope.p.checkPoint.curvesJSON = JSON.stringify(curves);
                    scope.p.checkPointsUndo.push(scope.p.checkPoint);
                    scope.p.checkPointsRedo = [];

                    curves = [];
                    clickedKnot = null;
                    clickedCurveIdx = undefined;
                    reDraw();
                }

                // Want to get out of the sketcher/ send answer
                scope.submit = function() {
                    $("#graphModal").foundation("reveal", "close");
                };

                // Keep mouse methods together
                scope.sketch = function(p) {

                    // canvas coefficients
                    let canvasProperties = {width: window.innerWidth, height: window.innerHeight};

                    const MOVE_SYMBOL_COLOR = [151];
                    const CURVE_LIMIT = 3;
                    const MOUSE_DETECT_RADIUS = 10;
                    const DEFAULT_KNOT_COLOR = [77,77,77];

                    // action recorder
                    let action = undefined;
                    let isMouseDragged;
                    let releasePt;
                    let drawMode;
                    let key = undefined;

                    // for drawing curve
                    let drawnPts = [];
                    let drawnColorIdx;
                    let lineStart;
                    let lineEnd;

                    let prevMousePt;

                    // for moving and stretching curve
                    let movedCurveIdx;
                    let stretchMode;
                    let isMaxima = undefined;


                    // for moving symbols
                    let movedSymbol;
                    let bindedKnot;
                    let symbolType;

                    let clickedKnotId;
                    let clickedCurve;

                    // for redo and undo
                    p.checkPoint;
                    p.checkPointsUndo = [];
                    p.checkPointsRedo = [];

                    function isOverButton(pt, button) {
                        if (button.position() == undefined) {
                            return false;
                        }

                        let left = button.position().left;
                        let top = button.position().top;
                        let width = button.width();
                        let height = button.height();
                        return (pt[0] > left && pt[0] < left + width && pt[1] > top && pt[1] < top + height);
                    }

                    // Mouse is inactive if over buttons - stops curves being drawn where they can't be seen
                    function isActive(pt) {

                        if (!(pt[0] > 0 && pt[0] < canvasProperties.width && pt[1] > 0 && pt[1] < canvasProperties.height)) {
                            return false;
                        }

                        let elements = [];
                        elements.push(element.find(".redo"));
                        elements.push(element.find(".undo"));
                        elements.push(element.find(".poly"));
                        elements.push(element.find(".straight"));
                        elements.push(element.find(".trash-button"));
                        elements.push(element.find(".submit"));
                        elements.push(element.find(".color-select"));

                        for (let i = 0; i < elements.length; i++) {
                            if (isOverButton(pt, elements[i])) {
                                return false;
                            }
                        }

                        return true;
                    }

                    // For visualisation using GraphView.js methods
                    scope.graphView = new graphViewBuilder.graphView(p);

                    // run in the beginning by p5 library
                    p.setup = function() {
                        p.createCanvas(canvasProperties.width, canvasProperties.height);
                        p.noLoop();
                        p.cursor(p.ARROW);
                        reDraw();
                    }

                    // Check if movement to new position is over an actionable object, so can render appropriately
                    p.mouseMoved = function(e) {
                        let mousePosition = graphUtils.getMousePt(e);

                        function detect(x, y) {
                            return (Math.abs(mousePosition[0] - x) < 5 && Math.abs(mousePosition[1] - y) < 5);
                        }

                        // this function does not react if the mouse is over buttons or outside the canvas.
                        if (!isActive(mousePosition)) {
                            return;
                        }

                        let found = "notFound";

                        if (found == "notFound") {
                            found = graphUtils.overItem(curves, e, MOUSE_DETECT_RADIUS, found);
                            if (found == "overKnot") {
                                p.cursor(p.HAND);
                                return;
                            } else if ((found == "overAttachedSymbol") || (found == "overFreeSymbol") || (found == "overCurve")) {
                                p.cursor(p.MOVE);
                                return;
                            } else if (found == "notFound") {
                                p.cursor(p.CROSS);
                                reDraw();
                            }
                        }

                        // stretch box
                        if (clickedCurveIdx != undefined) {
                            let c = curves[clickedCurveIdx];
                            if (mousePosition[0] >= c.minX && mousePosition[0] <= c.maxX && mousePosition[1] >= c.minY && mousePosition[1] <= c.maxY) {
                                found = true;
                                p.cursor(p.MOVE);
                            } else if (detect(c.minX, c.minY) || detect(c.maxX, c.minY) || detect(c.minX, c.maxY) || detect(c.maxX, c.maxY)) {
                                p.push();
                                p.fill(graphViewBuilder.graphView.KNOT_DETECT_COLOR);
                                if (detect(c.minX, c.minY)) {
                                    p.rect(c.minX - 4, c.minY - 4, 8, 8);
                                } else if (detect(c.maxX, c.minY)) {
                                    p.rect(c.maxX - 4, c.minY - 4, 8, 8);
                                } else if (detect(c.minX, c.maxY)) {
                                    p.rect(c.minX - 4, c.maxY - 4, 8, 8);
                                } else {
                                    p.rect(c.maxX - 4, c.maxY - 4, 8, 8);
                                }

                                p.pop;

                                found = true;
                                p.cursor(p.MOVE);
                            } else if (detect((c.minX + c.maxX) / 2, c.minY - 3) || detect((c.minX + c.maxX) / 2, c.maxY + 3)
                                || detect(c.minX - 3, (c.minY + c.maxY) / 2) || detect(c.maxX + 3, (c.minY + c.maxY) / 2)) {

                                p.push();
                                p.fill(graphViewBuilder.graphView.KNOT_DETECT_COLOR);
                                if (detect((c.minX + c.maxX) / 2, c.minY - 3)) {
                                    p.triangle((c.minX + c.maxX) / 2 - 5, c.minY - 2, (c.minX + c.maxX) / 2 + 5, c.minY - 2, (c.minX + c.maxX) / 2, c.minY - 7);
                                } else if (detect((c.minX + c.maxX) / 2, c.maxY + 3)) {
                                    p.triangle((c.minX + c.maxX) / 2 - 5, c.maxY + 2, (c.minX + c.maxX) / 2 + 5, c.maxY + 2, (c.minX + c.maxX) / 2, c.maxY + 7);
                                } else if (detect(c.minX - 3, (c.minY + c.maxY) / 2)) {
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

                    // Determines type of action when clicking on something within the canvas
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


                        let mousePosition = graphUtils.getMousePt(e);
                        releasePt = mousePosition;

                        // this function does not react if the mouse is over buttons or outside the canvas.
                        if (!isActive(mousePosition)) {
                            return;
                        }

                        function detect(x, y) {
                            return (Math.abs(mousePosition[0] - x) < 5 && Math.abs(mousePosition[1] - y) < 5);
                        }
                        // record down mousePosition status, may be used later for undo.
                        p.checkPoint = {};
                        p.checkPoint.curvesJSON = JSON.stringify(curves);

                        let found = false;

                        // check if stretching curve
                        if (clickedCurveIdx != undefined) {
                            let c = curves[clickedCurveIdx];

                            if (detect(c.minX, c.minY) || detect(c.maxX, c.minY) || detect(c.minX, c.maxY) || detect(c.maxX, c.maxY)
                                || detect((c.minX + c.maxX)/2, c.minY - 3) || detect((c.minX + c.maxX)/2, c.maxY + 3)
                                || detect(c.minX - 3, (c.minY + c.maxY)/2) || detect(c.maxX + 3, (c.minY + c.maxY)/2)) {

                                if (detect(c.minX, c.minY)) {
                                    stretchMode = "bottomLeft";
                                } else if (detect(c.maxX, c.minY)) {
                                    stretchMode = "bottomRight";
                                } else if (detect(c.maxX, c.maxY)) {
                                    stretchMode = "topRight";
                                } else if (detect(c.minX, c.maxY)) {
                                    stretchMode = "topLeft";
                                } else if (detect((c.minX + c.maxX)/2, c.minY - 3)) {
                                    stretchMode = "bottomMiddle";
                                } else if (detect((c.minX + c.maxX)/2, c.maxY + 3)) {
                                    stretchMode = "topMiddle";
                                } else if (detect(c.minX - 3, (c.minY + c.maxY)/2)) {
                                    stretchMode = "leftMiddle";
                                } else {
                                    stretchMode = "rightMiddle";
                                }


                                action = "STRETCH_CURVE";
                                clickedKnot = null;
                                prevMousePt = mousePosition;
                                return;
                            }
                        }

                        if (curves != []) {
                            for (let i = 0; i < curves.length; i++) {
                                let maxima = curves[i].maxima;
                                let minima = curves[i].minima;
                                for (let j = 0; j < maxima.length; j++) {
                                    let knot = maxima[j];
                                    if (graphUtils.getDist(mousePosition, knot) < MOUSE_DETECT_RADIUS + 10){
                                        clickedCurve = i;
                                        action = "STRETCH_POINT";
                                        clickedKnotId = j;
                                        prevMousePt = mousePosition;
                                        isMaxima = true;
                                        return;
                                    }
                                }
                                for (let j = 0; j < minima.length; j++) {
                                    let knot = minima[j];
                                    if (graphUtils.getDist(mousePosition, knot) < MOUSE_DETECT_RADIUS + 10){
                                        clickedCurve = i;
                                        action = "STRETCH_POINT";
                                        clickedKnotId = j;
                                        prevMousePt = mousePosition;
                                        isMaxima = false;
                                        return;
                                    }
                                }
                            }
                            let tc = [];
                            for (let i = 0; i < curves.length; i++) {
                                for (let j = 0; j < curves[i].pts.length; j++) {
                                    if (graphUtils.getDist(mousePosition, curves[i].pts[j]) < MOUSE_DETECT_RADIUS) {
                                        clickedCurveIdx = i;
                                        tc = curves[clickedCurveIdx];
                                        break;
                                    }
                                }
                            }
                            if (tc != undefined) {
                                // && graphUtils.getDist(mousePosition, knot) > MOUSE_DETECT_RADIUS + 10
                                if (mousePosition[0] >= tc.minX && mousePosition[0] <= tc.maxX && mousePosition[1] >= tc.minY && mousePosition[1] <= tc.maxY) {
                                    movedCurveIdx = clickedCurveIdx;
                                    action = "MOVE_CURVE";
                                    clickedKnot = null;
                                    prevMousePt = mousePosition;
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
                            lineStart = mousePosition;
                            drawMode = "line";
                        } else {
                            drawMode = "curve";
                        }

                        if (key === 46) {
                            // delete key pressed
                            if (clickedCurveIdx != undefined) {
                                let curve = (curves.splice(movedCurveIdx, 1))[0];

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

                    // Keep actions for curve manipulation together
                    p.mouseDragged = function(e) {
                        isMouseDragged = true;
                        let mousePosition = graphUtils.getMousePt(e);
                        releasePt = mousePosition;

                        if (action == "STRETCH_POINT") {
                            let selectedCurve = curves[clickedCurve];
                            // we need to know the (important) ordered end and turning points
                            let importantPoints = [];
                            if (selectedCurve.pts[0][0] > selectedCurve.pts[selectedCurve.pts.length - 1][0]) {
                                selectedCurve.pts.reverse();
                            }
                            selectedCurve.endPt = graphUtils.findEndPts(selectedCurve.pts);
                            selectedCurve.maxima = graphUtils.findTurnPts(selectedCurve.pts, 'maxima');
                            selectedCurve.minima = graphUtils.findTurnPts(selectedCurve.pts, 'minima');
                            importantPoints.push.apply(importantPoints, selectedCurve.endPt);
                            importantPoints.push.apply(importantPoints, selectedCurve.maxima);
                            importantPoints.push.apply(importantPoints, selectedCurve.minima);
                            importantPoints.sort(function(a, b){return a[0] - b[0]});

                            // maxima and minima are treated in slightly different ways
                            if (isMaxima !== undefined) {
                                curves[clickedCurve] = graphUtils.stretchTurningPoint(importantPoints, e, selectedCurve, isMaxima, clickedKnotId, prevMousePt, canvasProperties);
                            }

                            reDraw();
                            prevMousePt = mousePosition;

                        } else if (action == "MOVE_CURVE") {
                            p.cursor(p.MOVE);

                            scope.trashActive = isOverButton(mousePosition, element.find(".trash-button"));
                            scope.$apply();

                            let dx = mousePosition[0] - prevMousePt[0];
                            let dy = mousePosition[1] - prevMousePt[1];
                            prevMousePt = mousePosition;
                            graphUtils.translateCurve(curves[movedCurveIdx], dx, dy, canvasProperties);
                            reDraw();

                        } else if (action == "STRETCH_CURVE") {
                            p.cursor(p.MOVE);

                            let dx = mousePosition[0] - prevMousePt[0];
                            let dy = mousePosition[1] - prevMousePt[1];
                            prevMousePt = mousePosition;

                            let currentCurve = curves[clickedCurveIdx];

                            // calculate old x,y range
                            let orx = currentCurve.maxX - currentCurve.minX;
                            let ory = currentCurve.maxY - currentCurve.minY;

                            scope.graphView.drawCorner(stretchMode, currentCurve);

                            // update the position of stretched vertex
                            switch (stretchMode) {
                                case "bottomLeft": {
                                    if (orx < 30 && dx > 0  || ory < 30 && dy > 0) {
                                        return;
                                    }
                                    currentCurve.minX += dx;
                                    currentCurve.minY += dy;
                                    break;
                                }
                                case "bottomRight": {
                                    if (orx < 30 && dx < 0 || ory < 30 && dy > 0) {
                                        return;
                                    }
                                    currentCurve.maxX += dx;
                                    currentCurve.minY += dy;
                                    break;
                                }
                                case "topRight": {
                                    if (orx < 30 && dx < 0 || ory < 30 && dy < 0) {
                                        return;
                                    }
                                    currentCurve.maxX += dx;
                                    currentCurve.maxY += dy;
                                    break;
                                }
                                case "topLeft": {
                                    if (orx < 30 && dy > 0 || ory < 30 && dy < 0) {
                                        return;
                                    }
                                    currentCurve.minX += dx;
                                    currentCurve.maxY += dy;
                                    break;
                                }
                                case "bottomMiddle": {
                                    if ( ory < 30 && dy > 0) {
                                        return;
                                    }
                                    currentCurve.minY += dy;
                                    break;
                                }
                                case "topMiddle": {
                                    if (ory < 30 && dy < 0) {
                                        return;
                                    }
                                    currentCurve.maxY += dy;
                                    break;
                                }
                                case "leftMiddle": {
                                    if (orx < 30 && dx > 0) {
                                        return;
                                    }
                                    currentCurve.minX += dx;
                                    break;
                                }
                                case "rightMiddle": {
                                    if (orx < 30 && dx < 0) {
                                        return;
                                    }
                                    currentCurve.maxX += dx;
                                    break;
                                }
                            }

                            // calculate the new range
                            let nrx = currentCurve.maxX - currentCurve.minX;
                            let nry = currentCurve.maxY - currentCurve.minY;

                            // stretch the curve
                            switch (stretchMode) {
                                case "bottomLeft": {
                                    graphUtils.stretchCurve(currentCurve, orx, ory, nrx, nry, currentCurve.maxX, currentCurve.maxY, canvasProperties);
                                    break;
                                }
                                case "bottomRight": {
                                    graphUtils.stretchCurve(currentCurve, orx, ory, nrx, nry, currentCurve.minX, currentCurve.maxY, canvasProperties);
                                    break;
                                }
                                case "topRight": {
                                    graphUtils.stretchCurve(currentCurve, orx, ory, nrx, nry, currentCurve.minX, currentCurve.minY, canvasProperties);
                                    break;
                                }
                                case "topLeft": {
                                    graphUtils.stretchCurve(currentCurve, orx, ory, nrx, nry, currentCurve.maxX, currentCurve.minY, canvasProperties);
                                    break;
                                }
                                case "bottomMiddle": {
                                    graphUtils.stretchCurve(currentCurve, orx, ory, orx, nry, (currentCurve.minX + currentCurve.maxX)/2, currentCurve.maxY, canvasProperties);
                                    break;
                                }
                                case "topMiddle": {
                                    graphUtils.stretchCurve(currentCurve, orx, ory, orx, nry, (currentCurve.minX + currentCurve.maxX)/2, currentCurve.minY, canvasProperties);
                                    break;
                                }
                                case "leftMiddle": {
                                    graphUtils.stretchCurve(currentCurve, orx, ory, nrx, ory, currentCurve.maxX, (currentCurve.minY + currentCurve.maxY)/2, canvasProperties);
                                    break;
                                }
                                case "rightMiddle": {
                                    graphUtils.stretchCurve(currentCurve, orx, ory, nrx, ory, currentCurve.minX, (currentCurve.minY + currentCurve.maxY)/2, canvasProperties);
                                    break;
                                }
                            }
                            reDraw();
                            scope.graphView.drawCorner(stretchMode, currentCurve);

                        } else if (action == "DRAW_CURVE") {
                            p.cursor(p.CROSS);
                            if (curves.length < CURVE_LIMIT) {
                                if (drawMode == "curve") {
                                    p.push();
                                    p.stroke(graphViewBuilder.graphView.CURVE_COLORS[drawnColorIdx]);
                                    p.strokeWeight(graphViewBuilder.graphView.CURVE_STRKWEIGHT);
                                    if (drawnPts.length > 0) {
                                        let precedingPoint = drawnPts[drawnPts.length - 1];
                                        p.line(precedingPoint[0], precedingPoint[1], mousePosition[0], mousePosition[1]);
                                    }
                                    p.pop();
                                    drawnPts.push(mousePosition);
                                } else {
                                    reDraw();

                                    p.push();
                                    p.stroke(graphViewBuilder.graphView.CURVE_COLORS[drawnColorIdx]);
                                    p.strokeWeight(graphViewBuilder.graphView.CURVE_STRKWEIGHT);
                                    p.line(lineStart[0], lineStart[1], mousePosition[0], mousePosition[1]);
                                    p.pop();

                                    lineEnd = mousePosition;
                                }
                            }
                        }
                    }

                    // Need to know where to update points to - gives final position
                    p.mouseReleased = function(_e) {
                        let mousePosition = releasePt;

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
                            if (!isActive(mousePosition)) {
                                return;
                            }


                            // check if show stretch box
                            for (let i = 0; i < curves.length; i++) {
                                let pts = curves[i].pts;
                                for (let j = 0; j < pts.length; j++) {
                                    if (graphUtils.getDist(pts[j], mousePosition) < MOUSE_DETECT_RADIUS) {
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

                                clickedCurveIdx = undefined;
                            }

                            scope.trashActive = false;
                            scope.$apply();
                            reDraw();

                        } else if (action == "STRETCH_CURVE") {
                            p.checkPointsUndo.push(p.checkPoint);
                            p.checkPointsRedo = [];

                            // let c = curves[clickedCurveIdx];

                        } else if (action == "STRETCH_POINT") {
                            p.checkPointsUndo.push(p.checkPoint);
                            p.checkPointsRedo = [];

                            // let c = curves[clickedCurveIdx];

                        } else if (action == "DRAW_CURVE") {

                            if (curves.length < CURVE_LIMIT){

                                let curve;

                                if (drawMode == "curve") {
                                    // reject if curve drawn is too short
                                    if (graphUtils.sample(drawnPts).length < 3) {
                                        return;
                                    }

                                    p.checkPointsUndo.push(p.checkPoint);
                                    p.checkPointsRedo = [];
                                    scope.$apply();

                                    // adjustment of start and end to attach to the axis automatically.
                                    if (Math.abs(drawnPts[0][1] - canvasProperties.height/2) < 3) {
                                        drawnPts[0][1] = canvasProperties.height/2;
                                    }
                                    if (Math.abs(drawnPts[0][0] - canvasProperties.width/2) < 3) {
                                        drawnPts[0][0] = canvasProperties.width/2;
                                    }
                                    if (Math.abs(drawnPts[drawnPts.length - 1][1] - canvasProperties.height/2) < 3) {
                                        drawnPts[drawnPts.length - 1][1] = canvasProperties.height/2;
                                    }
                                    if (Math.abs(drawnPts[drawnPts.length - 1][0] - canvasProperties.width/2) < 3) {
                                        drawnPts[drawnPts.length - 1][0] = canvasProperties.width/2;
                                    }

                                    // sampler.sample, bezier.genericBezier
                                    let pts = [];
                                    if (scope.selectedLineType == "bezier") {
                                        pts = graphUtils.bezierLineStyle(graphUtils.sample(drawnPts));
                                    } else if (scope.selectedLineType == "linear") {
                                        // pts = graphUtils.linearLineStyle(graphUtils.sample(drawnPts));
                                        pts = graphUtils.linearLineStyle([drawnPts[0],drawnPts[drawnPts.length-1]])
                                    }
                                    curve = {};
                                    curve.pts = pts;

                                    let minX = pts[0][0];
                                    let maxX = pts[0][0];
                                    let minY = pts[0][1];
                                    let maxY = pts[0][1];
                                    for (let i = 1; i < pts.length; i++) {
                                        minX = Math.min(pts[i][0], minX);
                                        maxX = Math.max(pts[i][0], maxX);
                                        minY = Math.min(pts[i][1], minY);
                                        maxY = Math.max(pts[i][1], maxY);
                                    }
                                    curve.minX = minX;
                                    curve.maxX = maxX;
                                    curve.minY = minY;
                                    curve.maxY = maxY;

                                    curve.endPt = graphUtils.findEndPts(pts);
                                    curve.interX = graphUtils.findInterceptX(canvasProperties.height, pts);
                                    curve.interY = graphUtils.findInterceptY(canvasProperties.width, pts);
                                    if (scope.selectedLineType == "bezier") {
                                        curve.maxima = graphUtils.findTurnPts(pts, 'maxima');
                                        curve.minima = graphUtils.findTurnPts(pts, 'minima');
                                    } else {
                                        curve.maxima = [];
                                        curve.minima = [];
                                    }
                                    curve.colorIdx = drawnColorIdx;

                                } else {
                                    p.checkPointsUndo.push(p.checkPoint);
                                    p.checkPointsRedo = [];
                                    scope.$apply();

                                    let n = 100;
                                    let rx = lineEnd[0] - lineStart[0];
                                    let ry = lineEnd[1] - lineStart[1];
                                    let sx = rx / n;
                                    let sy = ry / n;
                                    let pts = [];
                                    for (let i = 0; i < n-1; i++) {
                                        let x = lineStart[0] + i * sx;
                                        let y = lineStart[1] + i * sy;
                                        pts.push(graphUtils.createPoint(x, y));
                                    }

                                    curve = {};
                                    curve.pts = pts;

                                    curve.minX = Math.min(lineStart[0], lineEnd[0]);
                                    curve.maxX = Math.max(lineStart[0], lineEnd[0]);
                                    curve.minY = Math.min(lineStart[1], lineEnd[1]);
                                    curve.maxY = Math.max(lineStart[1], lineEnd[1]);

                                    curve.endPt = graphUtils.findEndPts(pts);
                                    curve.interX = graphUtils.findInterceptX(canvasProperties.height, pts);
                                    curve.interY = graphUtils.findInterceptY(canvasProperties.width, pts);
                                    curve.maxima = [];
                                    curve.minima = [];
                                    curve.colorIdx = drawnColorIdx;
                                }

                                curves.push(curve);
                                reDraw();
                            }

                            return;
                        }
                    }

                    // Would like to be used on touch screen devices, this simply facilitates it
                    p.touchStarted = function(e) {
                        p.mousePressed(e.touches[0]);
                    }

                    p.touchMoved = function(e) {
                        p.mouseDragged(e.touches[0]);
                    }

                    p.touchEnded = function(e) {
                        p.mouseReleased(e);
                    }

                    // TODO BH remember to properly resize curves for continuous resizing - i.e. undo/redo correctly
                    p.windowResized = function() {
                        let data = encodeData(false);
                        canvasProperties.width = window.innerWidth;
                        canvasProperties.height = window.innerHeight;
                        p.resizeCanvas(window.innerWidth, window.innerHeight);
                        graphUtils.decodeData(data, canvasProperties.width, canvasProperties.height);
                        reDraw();
                    }

                    window.onkeydown = function(event) {
                        if (event.keyCode == 46) { // delete key
                            p.checkPointsUndo.push(p.checkPoint);
                            p.checkPointsRedo = [];
                            if (clickedCurveIdx != undefined) {
                                let curve = (curves.splice(clickedCurveIdx, 1))[0];

                                clickedCurveIdx = undefined;
                                reDraw();
                            }
                        }
                    }

                    // equivalent to 'locally' refreshing the canvas
                    reDraw = function() {
                        if (curves.length < 4) {
                            scope.graphView.drawBackground(canvasProperties.width, canvasProperties.height);
                            scope.graphView.drawCurves(curves);
                            scope.graphView.drawStretchBox(clickedCurveIdx, curves);
                            scope.state = encodeData();
                        }
                    };

                    // enables data to be encoded/decoded to input on reload (2nd attempt at a question etc)
                    encodeData = function(trunc) {

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

                        let clonedCurves = graphUtils.clone(curves);

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
                                pt[0] = Math.trunc(x * 1000) / 1000;
                                pt[1] = Math.trunc(y * 1000) / 1000;
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
                    };
                }

                // Log event for people leaving abbruptly
                scope.logOnClose = function(_event) {
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
                    return new Promise(function(resolve, _reject) {
                        let graphSketcherModal = $('#graphModal');
                        // initialise our canvas
                        scope.p = new p5(scope.sketch, element.find(".graph-sketcher")[0]);
                        graphSketcherModal.foundation("reveal", "open");
                        if (initialState.curves == undefined) {
                            scope.state = {freeSymbols: [], curves: []};
                        } else {
                            scope.state = initialState;
                        }
                        curves = scope.state.curves;
                        scope.questionDoc = questionDoc;
                        scope.editorMode = editorMode;
                        // when answered submit a log with the curve details
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
                        graphSketcherModal.one("closed.fndtn.reveal", function() {
                            scope.log.finalState = [];
                            scope.state.curves.forEach(function(e) {
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
                            scope.p.remove();
                            curves = [];
                            resolve(scope.state);
                            return(scope.state);
                        });

                        // reload previous answer if there is one ////////////////////////////////////////////////
                        if (scope.state.curves != undefined) {
                            graphUtils.decodeData(scope.state, window.innerWidth, window.innerHeight);
                            clickedCurveIdx = undefined
                            reDraw();
                        }
                    });
                };
            }
        };
    }];
});