/*
Copyright 2016 Andrea Franceschini <andrea.franceschini@gmail.com>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

///// <reference path="../../typings/p5.d" />
///// <reference path="../../typings/lodash.d" />

/* tslint:disable: no-unused-variable */
/* tslint:disable: comment-format */

import { DockingPoint } from './DockingPoint';

// This is meant to be a static global thingie for uniquely identifying widgets/symbols
// This may very well be a relic of my C++ multi-threaded past, but it served me well so far...
export let wId = 0;

export
    class Rect {
    x: number;
    y: number;
    w: number;
    h: number;

    constructor(x: number, y: number, w: number, h: number) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

	/**
	 * Re-positions this Rect with the TL corner in the new position
	 *
	 * @param newOrigin The new TL corner's position
	 * @returns {Rect} This Rect post hoc.
     */
    setOrigin(newOrigin: p5.Vector) {
        this.x = this.x - newOrigin.x;
        this.y = this.y - newOrigin.y;
        return this;
    }

	/**
	 * Checks whether this Rect contains point p in canvas coordinates.
	 * @param p The point to be tested for containment.
	 * @returns {boolean} Whether the point is contained or not.
     */
    contains(p: p5.Vector): boolean {
        return (p.x >= this.x) && (p.y >= this.y) && (p.x <= this.x + this.w) && (p.y <= this.y + this.h);
    }

	/**
	 * @returns {Vector} The centre of this Rect, in canvas coordinates.
     */
    get center() {
        return new p5.Vector(this.x + this.w / 2, this.y + this.h / 2);
    }
}

/** A base class for anything visible, draggable, and dockable. */
export
    /**
    Methods to be implemented:
        - draw()
        - boundingBox()
        - token()
        - properties()
        - _shakeIt()
    */

    abstract class Widget {
    /** p5 instance, I guess? */
    protected p: any;
    /** Unique ID */
    id: number = -1;


    /** Scaling factor for this widget (affected by where a widget is docked, typically) */
    scale: number = 1.0;

    /** Position of this widget */
    position: p5.Vector;

    /** Points to which other widgets can dock */
    _dockingPoints: { [key: string]: DockingPoint; } = {};

    /** An array of the types of docking points that this widget can dock to */
    docksTo: Array<string> = [];

    dockedTo: string = "";

    mode: string;

    /** Convenience pointer to this widget's parent */
    parentWidget: Widget = null;

    isHighlighted = false;
    color = null;
    isMainExpression = false;
    currentPlacement = "";

    get isDetachable() {
        return true;
    }

    get dockingPoints() {
        return this._dockingPoints;
    }

    set dockingPoints(a) {
        this._dockingPoints = a;
    }

    get typeAsString(): string {
        return "Widget";
    }

    constructor(p: any, protected s: any, mode: string = 'maths') {
        // Take a new unique id for this symbol
        this.id = ++wId;
        // This is weird but necessary: this.p will be the sketch function
        this.p = p;
        // Default position is [0, 0]
        this.position = p.createVector(0, 0);

        this.color = this.p.color(0);
        this.mode = mode;
        this.generateDockingPoints();
    }

    /** Generates all the docking points in one go and stores them in this.dockingPoints. */
    generateDockingPoints() { };

	/**
	 * Generates the expression corresponding to this widget and its subtree. **This function is a stub and will not
	 * traverse the subtree.**
	 *
	 * @param format A string to specify the output format. Supports: latex, python.
	 * @returns {string} The expression in the specified format.
     */
    getExpression(format: string): string {
        return "";
    }

    /** Paints the widget on the canvas. */
    draw() {
        this.p.translate(this.position.x, this.position.y);
        let alpha = 255;
        if (this.s.movingSymbol != null && this.id == this.s.movingSymbol.id) {
            alpha = 127;
        }

        _.each(this.dockingPoints, (dockingPoint, key) => {
            if (dockingPoint.child) {
                dockingPoint.child.draw();
            } else {
                // There is no child to paint, let's paint an empty docking point
                //if (this.depth() < 2) { // This stops docking points from being shown, but not from being used.
                let idx = -1;
                for (let d of this.s.visibleDockingPointTypes) {
                    idx = Math.max(idx, _.findIndex(dockingPoint.type, (x) => {
                        return x == d
                    }));
                }
                let drawThisOne = idx > -1;
                let highlightThisOne = this.s.activeDockingPoint == dockingPoint;

                if (drawThisOne || window.location.hash === "#debug") {
                    let ptAlpha = window.location.hash === "#debug" && !drawThisOne ? alpha * 0.5 : alpha;// * 0.5;
                    this.p.stroke(0, 127, 255, ptAlpha);
                    this.p.strokeWeight(1);
                    if (highlightThisOne && drawThisOne) {
                        this.p.fill(127, 192, 255);
                    } else {
                        this.p.noFill();
                    }
                    let dpSize = this.s.baseFontSize/3;
                    this.p.ellipse(dockingPoint.position.x, dockingPoint.position.y, this.scale * dpSize, this.scale * dpSize);
                    // this.p.ellipse(this.scale * dockingPoint.position.x, this.scale * dockingPoint.position.y, this.scale * 20, this.scale * 20);
                }
                //}
            }
        });

        this.p.noFill();
        if (window.location.hash === "#debug") {
            let box = this.boundingBox();
            this.p.stroke(255, 0, 0, 64);
            this.p.rect(box.x, box.y, box.w, box.h);

            let subtreeBox = this.subtreeBoundingBox();
            this.p.stroke(0, 0, 255, 64);
            this.p.rect(subtreeBox.x, subtreeBox.y, subtreeBox.w, subtreeBox.h);
        }

        this._draw();
        this.p.translate(-this.position.x, -this.position.y);
    }

    abstract _draw();

	/**
	 * This widget's tight bounding box. This is used for the cursor hit testing.
	 *
	 * @returns {Rect} The bounding box
     */
    abstract boundingBox(): Rect;

    abstract token(): string;

    // ************ //

	/**
	 * Retrieves the abstract tree representation having this widget as root.
	 *
	 * @param processChildren This stops it from traversing children.
	 * @param includeIds Include symbol IDs
	 * @param minimal Only include essential information
	 * @returns {{type: string}}
	 */
    subtreeObject(processChildren = true, includeIds = false, minimal = false): Object {
        let p = this.getAbsolutePosition();
        let o = {
            type: this.typeAsString
        };
        if (includeIds) {
            o["id"] = this.id;
        }
        if (!this.parentWidget && !minimal) {
            o["position"] = { x: p.x, y: p.y };
            o["expression"] = {
                latex: this.getExpression("latex"),
                python: this.getExpression("python")
            };
        }
        if (processChildren) {
            let dockingPoints = {};
            _.each(this.dockingPoints, (dockingPoint, key) => {
                if (dockingPoint.child != null) {
                    dockingPoints[key] = dockingPoint.child.subtreeObject(processChildren, includeIds, minimal);
                }
            });
            if (!_.isEmpty(dockingPoints)) {
                o["children"] = dockingPoints;
            }
        }
        let properties = this._properties();
        if (properties) {
            o["properties"] = properties;
        }
        return o;
    }

    abstract properties();

    _properties(): Object {
        return this.properties();
    }

	/**
	 * The bounding box including this widget's whole subtree.
	 *
	 * @returns {Rect}
     */
    subtreeBoundingBox(): Rect {

        let box = this.boundingBox();

        let subtree = _.map(this.getChildren(), c => {
            let b = c.subtreeBoundingBox();
            b.x += c.position.x;
            b.y += c.position.y;
            return b;
        });

        let left = box.x;
        let right = box.x + box.w;
        let top = box.y;
        let bottom = box.y + box.h;

        _.each(subtree, c => {
            if (left > c.x) { left = c.x; }
            if (top > c.y) { top = c.y; }
            if (right < c.x + c.w) { right = c.x + c.w; }
            if (bottom < c.y + c.h) { bottom = c.y + c.h; }
        });

        return new Rect(left, top, this.getExpressionWidth(), bottom - top);
    }

    /** Removes this widget from its parent. Also, shakes it. */
    removeFromParent() {
        let oldParent = this.parentWidget;
        this.currentPlacement = "";
        _.each(this.parentWidget.dockingPoints, (dockingPoint) => {
            if (dockingPoint.child == this) {
                this.s.scope.log.actions.push({
                    event: "UNDOCK_SYMBOL",
                    symbol: this.subtreeObject(false, true, true),
                    parent: this.parentWidget.subtreeObject(false, true, true),
                    dockingPoint: dockingPoint.name,
                    timestamp: Date.now()
                });
                dockingPoint.child = null;
                // this.dockedTo = "";
                this.parentWidget = null;
            }
        });
        this.shakeIt(); // Our size may have changed. Shake it.
        oldParent.shakeIt(); // Our old parent should update. Shake it.
    }

	/**
	 * Hit test. Detects whether a point is hitting the tight bounding box of this widget. This is used for dragging.
	 * Propagates down to children.
	 *
	 * @param p The hit point
	 * @returns {Widget} This widget, if hit; null if not.
     */
    hit(p: p5.Vector): Widget {
        let w: Widget = null;
        _.some(this.dockingPoints, dockingPoint => {
            if (dockingPoint.child != null) {
                w = dockingPoint.child.hit(p5.Vector.sub(p, this.position));
                return w != null;
            }
        });
        if (w != null) {
            return w;
        } else if (this.boundingBox().contains(p5.Vector.sub(p, this.position))) {
            return this;
        } else {
            return null;
        }
    }

	/**
	 * Turns on and off highlight recursively.
	 */
    highlight(on = true) {
        let mainColor = this.isMainExpression ? this.p.color(0) : this.p.color(0, 0, 0, 127);
        this.isHighlighted = on;
        this.color = on ? this.p.color(72, 123, 174) : mainColor;
        _.each(this.dockingPoints, dockingPoint => {
            if (dockingPoint.child != null) {
                dockingPoint.child.highlight(on);
                dockingPoint.child.isMainExpression = this.isMainExpression;
            }
        });
    }

	/**
	 * Overlapping test for this widget's docking points.
	 *
	 * @param w The overlapping Widget
	 * @return {DockingPoint} The best overlapped candidate DockingPoint, or null if no docking point was selected.
	 */
    dockingPointsHit(w: Widget): DockingPoint {
        let hitPoint: DockingPoint = null;

        _.some(this.getChildren(), child => {
            hitPoint = child.dockingPointsHit(w);
            return hitPoint != null;
        });

        // FIXME hic sunt leones. This works, but the code could be a bit clearer (if not better/more efficient)
        let wAP = w.getAbsolutePosition();
        let wBox = w.subtreeBoundingBox();
        let testRect = new Rect(wBox.x + wAP.x, wBox.y + wAP.y, wBox.w, wBox.h);
        let thisAP = this.getAbsolutePosition();

        let hitPoints: Array<DockingPoint> = [];
        if (!hitPoint) {
            _.each(this.dockingPoints, point => {
                if (point.child == null) {
                    let dp = p5.Vector.add(thisAP, p5.Vector.mult(point.position, this.scale));
                    if (testRect.contains(dp)) {
                        hitPoints.push(point);
                    }
                }
            });
        }
        if (!_.isEmpty(hitPoints)) {
            [hitPoint, ...hitPoints] = hitPoints;
            _.each(hitPoints, hp => {
                let hpAP = p5.Vector.add(thisAP, p5.Vector.mult(hp.position, this.scale));
                let currentHpAP = p5.Vector.add(thisAP, p5.Vector.mult(hitPoint.position, this.scale));
                if (p5.Vector.dist(testRect.center, hpAP) <= p5.Vector.dist(testRect.center, currentHpAP)) {
                    hitPoint = hp;
                }
            });
        }
        return hitPoint;
    }

	/**
	 * @returns {Widget[]} A flat array of the children of this widget, as widget objects
     */
    getChildren(): Array<Widget> {
        return _.compact(_.map(_.values(this.dockingPoints), "child"));
    }

    getTotalSymbolCount(): number {
        let total = 1;
        for (let i in this.dockingPoints) {
            let c = this.dockingPoints[i].child;
            if (c != null) {
                total += c.getTotalSymbolCount();
            }
        }
        return total;
    }

	/**
	 * @returns {Vector} The absolute position of this widget relative to the canvas.
     */
    getAbsolutePosition(): p5.Vector {
        if (this.parentWidget) {
            return p5.Vector.add(this.parentWidget.getAbsolutePosition(), this.position);
        } else {
            return this.position;
        }
    }

	/**
	 * Shakes up the subtree to make everything look nicer.
	 * (*The only way this could be better is if I was writing this in Swift.*)
	 */
    shakeIt() {
        if (this.parentWidget == null) {
            this._shakeIt();
        } else {
            this.parentWidget.shakeIt();
        }
    }

	/**
	 * Internal companion method to shakeIt(). This is the one that actually does the work, and the one that should be
	 * overridden by children of this class.
	 *
	 * @private
     */
    abstract _shakeIt();

	/**
	 * Internal aid for placing stuff as children.
	 */
    offsetBox(): Rect {
        return this.boundingBox();
    }

	/**
	 * Computes this widget's depth in the tree.
	 */
    depth(): number {
        let depth = 0;
        let n: Widget = this;
        while (n.parentWidget) {

          if (this.currentPlacement == "subscript" || this.currentPlacement == "superscript") {
            depth += 1;
            n = n.parentWidget;
          }
          else {

            n = n.parentWidget;
          }

        }
        return depth;
    }
		/*
		Finds the width of the bounding box around an entire expression.
		*/
    getExpressionWidth(): number {
        let current_element: any = this;
        let expressionWidth = this.boundingBox().w;

        // Find the bounding box width for an entire expression.
        if (current_element.dockingPoints.hasOwnProperty("right") && current_element.dockingPoints["right"].child != undefined && current_element.dockingPoints["right"].child != null) {
            expressionWidth += current_element.dockingPoints["right"].child.getExpressionWidth();
            if (this.typeAsString == "Differential") { // TODO This is HORRIBLE beyond belief and needs fixing, but derivatives are kind of an all-around hack, so...
                expressionWidth += current_element.dockingPoints["right"].position.x;
            }
        }
        if (current_element.dockingPoints.hasOwnProperty("argument") && current_element != undefined && current_element.dockingPoints["argument"].child != null) {
            expressionWidth += current_element.dockingPoints["argument"].child.getExpressionWidth();
        }
        if (current_element.dockingPoints.hasOwnProperty("order") && current_element != undefined && current_element.dockingPoints["order"].child != null) {
            expressionWidth += current_element.dockingPoints["order"].child.getExpressionWidth();
        }
        if (current_element.dockingPoints.hasOwnProperty("subscript") && current_element.dockingPoints["subscript"].child != undefined && current_element.dockingPoints["subscript"].child != null) {
            expressionWidth += current_element.dockingPoints["subscript"].child.getExpressionWidth();
        }
        if (current_element.dockingPoints.hasOwnProperty("superscript") && current_element != undefined && current_element.dockingPoints["superscript"].child != null) {
            expressionWidth += current_element.dockingPoints["superscript"].child.getExpressionWidth();
        }
        if (current_element.dockingPoints.hasOwnProperty("mass_number") && current_element != undefined && current_element.dockingPoints["mass_number"].child != null) {
            expressionWidth += current_element.dockingPoints["mass_number"].child.getExpressionWidth();
        }
        if (current_element.dockingPoints.hasOwnProperty("proton_number") && current_element != undefined && current_element.dockingPoints["proton_number"].child != null) {
            expressionWidth += current_element.dockingPoints["proton_number"].child.getExpressionWidth();
        }
        return expressionWidth;
    }
    getExpressionHeight(): number {
        let current_element: any = this;
        let expressionHeight = this.boundingBox().h;
        let subscript_height;
        let superscript_height;
        // Find the bounding box width for an entire expression.
        if (current_element.dockingPoints.hasOwnProperty("subscript") && current_element.dockingPoints["subscript"].child != undefined && current_element.dockingPoints["subscript"].child != null) {
            subscript_height += current_element.dockingPoints["subscript"].child.getExpressionHeight();
        }
        if (current_element.dockingPoints.hasOwnProperty("superscript") &&  current_element != undefined && current_element.dockingPoints["superscript"].child != null) {
            subscript_height += current_element.dockingPoints["superscript"].child.getExpressionHeight();
        }
        return (subscript_height >= superscript_height) ? (expressionHeight + subscript_height) : (expressionHeight + superscript_height);
    }
}
