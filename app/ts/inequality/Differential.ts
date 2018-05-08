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

import { Widget, Rect } from './Widget'
import { BinaryOperation } from "./BinaryOperation";
import { DockingPoint } from "./DockingPoint";
import isNumber = require("lodash/isNumber");


/** A class for representing variables and constants (aka, letters). */
export
class Differential extends Widget {

    protected s: any;
    protected letter: string;

    get typeAsString(): string {
        return "Differential";
    }

    /**
     * There's a thing with the baseline and all that... this sort-of fixes it.
     *
     * @returns {Vector} The position to which a Differential is meant to be docked from.
     */
    get dockingPoint(): p5.Vector {
        const box = this.s.font_up.textBounds("x", 0, 0, this.scale * this.s.baseFontSize);
        return this.p.createVector(0, - box.h / 2);
    }

    public constructor(p: any, s: any, letter: string) {
        super(p, s);
        this.letter = letter;
        this.s = s;
        this.docksTo = ['operator', 'differential', 'relation'];
    }

    /**
     * Prevents Differentials from being detached from Derivatives when the user is not an admin/editor.
     */
    get isDetachable() {
        const userIsPrivileged = _.includes(['ADMIN', 'CONTENT_EDITOR', 'EVENT_MANAGER'], this.s.scope.user.role);
        return document.location.pathname == '/equality' || userIsPrivileged || !this.sonOfADerivative;
    }

    get sonOfADerivative() {
        let s = false;
        let p = this.parentWidget;
        while (p != null) {
            s = s || p.typeAsString == 'Derivative';
            p = p.parentWidget;
        }
        return s;
    }

    get orderNeedsMoving() {
        let a = false;
        let n = this.dockedTo;
        let w: Widget = this;
        while (w != null) {
            a = a || n == "denominator";
            w = w.parentWidget;
            n = null == w ? "" : w.dockedTo;
        }
        return a && this.sonOfADerivative;
    }

    /**
     * Generates all the docking points in one go and stores them in this.dockingPoints.
     * A Differential has three docking points:
     *
     * - _right_: Binary operation (addition, subtraction), Differential (multiplication)
     * - _order_: Exponent
     * - _subscript_: Subscript (duh?)
     */
    generateDockingPoints() {
        let box = this.boundingBox();
        // let descent = this.position.y - (box.y + box.h);

        this.dockingPoints["argument"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.s.mBox_w / 4, -this.s.xBox_h / 2), 1, ["differential_argument"], "argument");
        this.dockingPoints["order"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.scale * 20, -this.scale * this.s.mBox_h), 2/3, ["differential_order"], "order");
        this.dockingPoints["right"] = new DockingPoint(this, this.p.createVector(box.w / 2 + 1.25*this.s.mBox_w, -this.s.xBox_h / 2), 1, ["differential", "operator"], "right");
    }

    /**
     * Generates the expression corresponding to this widget and its subtree.
     *
     * The `subscript` format is a special one for generating Differentials that will work with the sympy checker. It squashes
     * everything together, ignoring operations and all that jazz.
     *
     * @param format A string to specify the output format. Supports: latex, python, subscript.
     * @returns {string} The expression in the specified format.
     */
    getExpression(format: string): string {
        let expression = "";
        if (format == "latex") {
            if (this.letter == "δ") {
                expression = "\\mathrm{\\delta}";
            } else if (this.letter == "∆") {
                expression = "\\mathrm{\\Delta}";
            } else {
                expression = "\\mathrm{" + this.letter + "}";
            }
            
            if (this.dockingPoints["order"].child != null && !this.orderNeedsMoving) {
                expression += "^{" + this.dockingPoints["order"].child.getExpression(format) + "}";
            }
            if (this.dockingPoints["argument"].child != null) {
                if (this.dockingPoints["argument"].child instanceof BinaryOperation) {
                    expression += this.dockingPoints["argument"].child.getExpression(format);
                } else {
                    // WARNING This assumes it's a Differential, hence produces a multiplication
                    expression += this.dockingPoints["argument"].child.getExpression(format);
                }
            }
            // AAARGH! Curses, you Leibniz!
            if (this.dockingPoints["order"].child != null && this.orderNeedsMoving) {
                expression += "^{" + this.dockingPoints["order"].child.getExpression(format) + "}";
            }
            if (this.dockingPoints["right"].child != null) {
                expression += this.dockingPoints["right"].child.getExpression(format);
            }
        } else if (format == "python") {
            if (this.letter == "δ") {
                expression = "delta";
            } else if (this.letter == "∆") {
                expression = "Delta";
            } else {
                expression = "d";
            }
            let args = [];
            if (this.dockingPoints["argument"].child != null) {
                args.push(this.dockingPoints["argument"].child.getExpression(format));
            }
            expression += args.join("");

            // FIXME We need to decide what to do with orders.
            if (this.dockingPoints["order"].child != null) {
                var n = parseInt(this.dockingPoints["order"].child.getExpression(format));
                if (!isNaN(n) && n > 1) {
                    expression += _.repeat(" * " + expression, n-1);
                }
            }
            if (this.dockingPoints["right"].child != null) {
                let op = (this.dockingPoints["right"].child.typeAsString == 'Relation' ||
                      this.dockingPoints["right"].child.typeAsString == 'BinaryOperation')
                      ? '' : ' * ';
                expression += op + this.dockingPoints["right"].child.getExpression(format);
            }

        } else if (format == "mathml") {
            expression = '';
            if (this.dockingPoints["order"].child == null && this.dockingPoints["argument"].child != null) {
                expression += "<mi>" + this.letter  + "</mi>" + this.dockingPoints["argument"].child.getExpression(format);
            } else if (this.dockingPoints["order"].child != null && this.dockingPoints["argument"].child != null) {
                if (this.orderNeedsMoving) {
                    expression += '<msup><mrow><mi>' + this.letter + '</mi>' + this.dockingPoints["argument"].child.getExpression(format) + '</mrow><mrow>' + this.dockingPoints["order"].child.getExpression(format) + '</mrow></msup>';
                } else {
                    expression += '<msup><mi>' + this.letter + '</mi><mrow>' + this.dockingPoints["order"].child.getExpression(format) + '</mrow></msup>' + this.dockingPoints["argument"].child.getExpression(format);
                }
            }
            if (this.dockingPoints['right'].child != null) {
                expression += this.dockingPoints['right'].child.getExpression(format);
            }
        }
        return expression;
    }

    properties(): Object {
        return {
            letter: this.letter
        };
    }

    token() {
        // DRY this out.
        var expression;
        if (this.letter == "δ") {
            expression = "delta";
        } else if (this.letter == "∆") {
            expression = "Delta";
        } else {
            expression = "d";
        }
        let args = [];
        if (this.dockingPoints["argument"].child != null) {
            args.push(this.dockingPoints["argument"].child.getExpression("python"));
        }
        expression += args.join(" ");

        return expression;
    }

    /** Paints the widget on the canvas. */
    _draw() {
        this.p.fill(this.color).strokeWeight(0).noStroke();

        this.p.textFont(this.s.font_up)
              .textSize(this.s.baseFontSize * this.scale)
              .textAlign(this.p.CENTER, this.p.BASELINE)
              .text(this.letter, 0, 0);
        this.p.strokeWeight(1);
    }

    /**
     * This widget's tight bounding box. This is used for the cursor hit testing.
     *
     * @returns {Rect} The bounding box
     */
    boundingBox(): Rect {
        let box = this.s.font_up.textBounds(this.letter || "D", 0, 0, this.scale * this.s.baseFontSize);
        return new Rect(-box.w / 2, box.y, box.w, box.h);
    }

    /**
     * Internal companion method to shakeIt(). This is the one that actually does the work, and the one that should be
     * overridden by children of this class.
     *
     * @private
     */
    _shakeIt() {
        this._shakeItDown();

        let thisBox = this.boundingBox();

        // order
        let orderWidth = this.dockingPointSize;
        if (this.dockingPoints["order"]) {
            let dp = this.dockingPoints["order"];
            if (dp.child) {
                let child = dp.child;
                child.position.x = thisBox.x + thisBox.w + child.leftBound + this.dockingPointSize*child.scale/2;
                child.position.y = -this.scale*this.s.xBox_h - (child.subtreeDockingPointsBoundingBox().y + child.subtreeDockingPointsBoundingBox().h);
                orderWidth = Math.max(this.dockingPointSize, child.subtreeDockingPointsBoundingBox().w);
            } else {
                dp.position.x = thisBox.x + thisBox.w + this.dockingPointSize/2;
                dp.position.y = -this.scale*this.s.mBox_h;
            }
        }

        // argument
        if (this.dockingPoints["argument"]) {
            let dp = this.dockingPoints["argument"];
            if (dp.child) {
                let child = dp.child;
                child.position.x = thisBox.x + thisBox.w + child.leftBound + orderWidth + this.dockingPointSize/2;
                child.position.y = this.dockingPoint.y - child.dockingPoint.y;
            } else {
                dp.position.x = thisBox.x + thisBox.w + orderWidth + this.dockingPointSize;
                dp.position.y = -this.scale*this.s.xBox_h/2;
            }
        }

        // right
        if (this.dockingPoints["right"]) {
            let dp = this.dockingPoints["right"];
            if (dp.child) {
                let child = dp.child;
                child.position.x = thisBox.x + thisBox.w + child.leftBound + orderWidth + this.dockingPointSize/2;
                child.position.y = this.dockingPoint.y - child.dockingPoint.y;
            } else {
                dp.position.x = thisBox.x + thisBox.w + orderWidth + this.dockingPointSize;
                dp.position.y = -this.scale*this.s.xBox_h/2;
            }
        }
    }

    /**
     * @returns {Widget[]} A flat array of the children of this widget, as widget objects
     */
    getChildren(): Array<Widget> {
        return _.compact(_.map(_.values(this.dockingPoints), "child"));
    }
}
