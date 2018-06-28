/*
Copyright 2016 Andrea Franceschini <andrea.franceschini@gmail.com>
               Andrew Wells <aw684@cam.ac.uk>

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

import { Widget, Rect } from './Widget';
import { BinaryOperation } from "./BinaryOperation";
import { Relation } from "./Relation";
import { DockingPoint } from "./DockingPoint";

export
    class Fraction extends Widget {
    public s: any;
    private width: number;

    get typeAsString(): string {
        return "Fraction";
    }

    /**
     * There's a thing with the baseline and all that... this sort-of fixes it.
     *
     * @returns {Vector} The position to which a Symbol is meant to be docked from.
     */
    get dockingPoint(): p5.Vector {
        return this.p.createVector(0, 0);
    }

    constructor(p: any, s: any) {
        super(p, s);
        this.s = s;
        this.width = 0;

        this.docksTo = ['operator', 'symbol', 'exponent', 'operator_brackets', 'relation', 'differential_argument'];
    }

    /** Generates all the docking points in one go and stores them in this.dockingPoints.
     * A Fraction has three docking point:
     *
     * - _right_: Binary operation (addition, subtraction), Symbol (multiplication)
     * - _numerator_: Symbol
     * - _denominator_: Symbol
     */
    generateDockingPoints() {
        let box = this.boundingBox();
        // FIXME That 50 is hard-coded, need to investigate when this.width gets initialized.
        this.dockingPoints["right"] = new DockingPoint(this, this.p.createVector(50 + this.scale * this.s.mBox_w/4, -box.h/2), 1, ["operator"], "right");
        this.dockingPoints["numerator"] = new DockingPoint(this, this.p.createVector(0, -(box.h + 25)), 1, ["symbol"], "numerator");
        this.dockingPoints["denominator"] = new DockingPoint(this, this.p.createVector(0, 0 + 25), 1, ["symbol"], "denominator");
    }

    /**
     * Generates the expression corresponding to this widget and its subtree.
     *
     * The `subscript` format is a special one for generating symbols that will work with the sympy checker. It squashes
     * everything together, ignoring operations and all that jazz.
     *
     * @param format A string to specify the output format. Supports: latex, python, subscript.
     * @returns {string} The expression in the specified format.
     */
    formatExpressionAs(format: string): string {
        let expression = "";
        if (format == "latex" || format == 'mhchem') {
            if (this.dockingPoints["numerator"].child != null && this.dockingPoints["denominator"].child != null) {
                expression += "\\frac{" + this.dockingPoints["numerator"].child.formatExpressionAs(format) + "}{" + this.dockingPoints["denominator"].child.formatExpressionAs(format) + "}";
                if (this.dockingPoints["right"].child != null) {
                    expression += this.dockingPoints["right"].child.formatExpressionAs(format);
                }
            }
        } else if (format == "python") {
            if (this.dockingPoints["numerator"].child != null && this.dockingPoints["denominator"].child != null) {
                expression += "(" + this.dockingPoints["numerator"].child.formatExpressionAs(format) + ")/(" + this.dockingPoints["denominator"].child.formatExpressionAs(format) + ")";
                if (this.dockingPoints["right"].child != null) {
                    if (this.dockingPoints["right"].child instanceof BinaryOperation || this.dockingPoints["right"].child instanceof Relation) {
                        expression += this.dockingPoints["right"].child.formatExpressionAs(format);
                    } else {
                        expression += " * " + this.dockingPoints["right"].child.formatExpressionAs(format);
                    }
                }
            }
        } else if (format == "subscript") {
            if (this.dockingPoints["right"].child != null) {
                expression += "[FRACTION:" + this.id + "]";
            }
        } else if (format == 'mathml') {
            expression = '';
            if (this.dockingPoints["numerator"].child != null && this.dockingPoints["denominator"].child != null) {
                expression += '<mfrac><mrow>' + this.dockingPoints['numerator'].child.formatExpressionAs(format) + '</mrow><mrow>' + this.dockingPoints['denominator'].child.formatExpressionAs(format) + '</mrow></mfrac>';
            }
            if (this.dockingPoints['right'].child != null) {
                expression += this.dockingPoints['right'].child.formatExpressionAs(format);
            }
        }
        return expression;
    }

    properties(): Object {
        return null;
    }

    token() {
        return '';
    }

    /** Paints the widget on the canvas. */
    _draw() {
        this.p.noFill().strokeCap(this.p.SQUARE).strokeWeight(4 * this.scale).stroke(this.color);

        let box = this.boundingBox();
        this.p.line(-box.w/2, 0, box.w/2, 0);

        this.p.strokeWeight(1);
    }

    /**
     * This widget's tight bounding box. This is used for the cursor hit testing.
     *
     * @returns {Rect} The bounding box
     */
    boundingBox(): Rect {
        let box = this.s.font_up.textBounds("+", 0, 0, this.scale * this.s.baseFontSize);

        let width = Math.max(box.w, this._numeratorBox.w, this._denominatorBox.w);

        return new Rect(-width/2, -box.h/2, width, box.h);
    }

    get _numeratorBox(): Rect {
        if (this.dockingPoints["numerator"] && this.dockingPoints["numerator"].child) {
            return this.dockingPoints["numerator"].child.subtreeDockingPointsBoundingBox;
        } else {
            return new Rect(0, 0, this.s.baseDockingPointSize, 0);
        }
    }

    get _denominatorBox(): Rect {
        if (this.dockingPoints["denominator"] && this.dockingPoints["denominator"].child) {
            return this.dockingPoints["denominator"].child.subtreeDockingPointsBoundingBox;
        } else {
            return new Rect(0, 0, this.s.baseDockingPointSize, 0);
        }
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

        if (this.dockingPoints["numerator"]) {
            let dp = this.dockingPoints["numerator"];
            if (dp.child) {
                let child = dp.child;
                // TODO Keep an eye on these, we might need the subtreeDockingPointsBoundingBox instead.
                child.position.x = -child.subtreeBoundingBox.x - child.subtreeBoundingBox.w/2;
                child.position.y = -dp.size - (child.subtreeDockingPointsBoundingBox.y + child.subtreeDockingPointsBoundingBox.h);
            } else {
                dp.position.x = 0;
                dp.position.y = -this.s.xBox_h/2 - dp.size;
            }
        }

        if (this.dockingPoints["denominator"]) {
            let dp = this.dockingPoints["denominator"];
            if (dp.child) {
                let child = dp.child;
                // TODO Keep an eye on these, we might need the subtreeDockingPointsBoundingBox instead.
                child.position.x = -child.subtreeBoundingBox.x - child.subtreeBoundingBox.w/2;
                child.position.y = dp.size - child.subtreeDockingPointsBoundingBox.y;
            } else {
                dp.position.x = 0;
                dp.position.y = this.s.xBox_h/2 + dp.size;
            }
        }

        if (this.dockingPoints["right"]) {
            let dp = this.dockingPoints["right"];
            if (dp.child) {
                let child = dp.child;
                child.position.x = thisBox.x + thisBox.w + child.leftBound + dp.size/2;
                child.position.y = -child.dockingPoint.y;
            } else {
                dp.position.x = this.subtreeBoundingBox.w/2 + dp.size;
                dp.position.y = 0;
            }
        }
    }
}
