/*
Copyright 2017 Andrea Franceschini <andrea.franceschini@gmail.com>

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

///// <reference path="../../typings/p5.d.ts" />
///// <reference path="../../typings/lodash.d.ts" />

/* tslint:disable: no-unused-variable */
/* tslint:disable: comment-format */
/* tslint:disable:  */

import { Widget, Rect } from './Widget';
import { BinaryOperation } from "./BinaryOperation";
import { Relation } from "./Relation";
import { DockingPoint } from "./DockingPoint";
import { Brackets } from "./Brackets";
import { Differential } from "./Differential";
import { Num } from "./Num";

export
    class Derivative extends Widget {
    protected s: any;
    private width: number;

    get typeAsString(): string {
        return "Derivative";
    }

    /**
     * There's a thing with the baseline and all that... this sort-of fixes it.
     *
     * @returns {Vector} The position to which a Symbol is meant to be docked from.
     */
    get dockingPoint(): p5.Vector {
        let p = this.p.createVector(0, 0);
        return p;
    }

    constructor(p: any, s: any) {
        super(p, s);
        this.s = s;
        this.width = 0;

        this.docksTo = ['operator', 'symbol', 'operator_brackets', 'relation'];
    }

    /** Generates all the docking points in one go and stores them in this.dockingPoints.
     * A Derivative has three docking point:
     *
     * - _right_: Binary operation (addition, subtraction), Symbol (multiplication)
     * - _numerator_: Differential
     * - _denominator_: Differential
     */
    generateDockingPoints() {
        let box = this.boundingBox();
        // FIXME That 50 is hard-coded, need to investigate when this.width gets initialized.
        this.dockingPoints["right"] = new DockingPoint(this, this.p.createVector(50 + this.scale * this.s.mBox.w / 4, -box.h / 2), 1, ["operator"], "right");
        this.dockingPoints["numerator"] = new DockingPoint(this, this.p.createVector(0, -(box.h + 25)), 1, ["differential"], "numerator");
        this.dockingPoints["denominator"] = new DockingPoint(this, this.p.createVector(0, 0 + 25), 1, ["differential"], "denominator");
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
    getExpression(format: string): string {
        let expression = "";
        if (format == "latex") {
            if (this.dockingPoints["numerator"].child != null && this.dockingPoints["denominator"].child != null) {
                expression += "\\frac{" + this.dockingPoints["numerator"].child.getExpression(format) + "}{" + this.dockingPoints["denominator"].child.getExpression(format) + "}";
                if (this.dockingPoints["right"].child != null) {
                    expression += this.dockingPoints["right"].child.getExpression(format);
                }
            }
        } else if (format == "python") {
            if (this.dockingPoints["numerator"].child != null && this.dockingPoints["denominator"].child != null &&
                this.dockingPoints["numerator"].child.typeAsString == "Differential" && this.dockingPoints["denominator"].child.typeAsString == "Differential") {
                expression += "Derivative(";
                if (this.dockingPoints["numerator"].child.dockingPoints["argument"].child != null) {
                    expression += this.dockingPoints["numerator"].child.dockingPoints["argument"].child.getExpression(format) + ", ";
                } else {
                    expression += "_, ";
                }
                let stack: Array<Widget> = [this.dockingPoints["denominator"].child];
                let list = [];
                while(stack.length > 0) {
                    let e = stack.shift();
                    if (e.typeAsString == "Differential") {
                        // WARNING: This stops at the first non-Differential, which is kinda OK, but may confuse people.
                        let o = 1;
                        let o_child: Widget = e.dockingPoints["order"].child;
                        if (o_child != null && o_child.typeAsString == "Num") {
                            o = parseInt(o_child.getFullText());
                        }
                        do {
                            if (e.dockingPoints["argument"].child != null) {
                                list.push(e.dockingPoints["argument"].child.getExpression(format));
                            } else {
                                list.push("?");
                            }
                            o -= 1;
                        } while(o > 0);
                        if (e.dockingPoints["right"].child != null) {
                            stack.push(e.dockingPoints["right"].child);
                        }
                    }
                }
                expression += list.join(", ") + ")";
                if(this.dockingPoints["right"].child != null) {
                    expression += this.dockingPoints["right"].child.getExpression(format);
                }
            }
        } else if (format == "subscript") {
            if (this.dockingPoints["right"].child != null) {
                expression += "[Derivative:" + this.id + "]";
            }
        } else if (format == 'mathml') {
            expression = '';
            if (this.dockingPoints["numerator"].child != null && this.dockingPoints["denominator"].child != null) {
                expression += '<mfrac><mrow>' + this.dockingPoints['numerator'].child.getExpression(format) + '</mrow><mrow>' + this.dockingPoints['denominator'].child.getExpression(format) + '</mrow></mfrac>';
            }
            if (this.dockingPoints['right'].child != null) {
                expression += this.dockingPoints['right'].child.getExpression(format);
            }
        }
        return expression;
    }

    properties(): Object {
        return null;
    }

    token() {
        return this.getExpression("python");
    }

    /** Paints the widget on the canvas. */
    _draw() {
        this.p.noFill().strokeCap(this.p.SQUARE).strokeWeight(4 * this.scale).stroke(this.color);

        let box = this.boundingBox();
        this.p.line(-box.w / 2, 0, box.w / 2, 0);

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
        let numeratorBox: Rect = null;
        try {
            numeratorBox = this.dockingPoints["numerator"].child.subtreeDockingPointsBoundingBox();
        } catch (e) {
            numeratorBox = new Rect(0, 0, this.dockingPointSize, this.dockingPointSize);
        }
        return numeratorBox;
    }

    get _denominatorBox(): Rect {
        let denominatorBox: Rect = null;
        try {
            denominatorBox = this.dockingPoints["denominator"].child.subtreeDockingPointsBoundingBox();
        } catch (e) {
            denominatorBox = new Rect(0, 0, this.dockingPointSize, this.dockingPointSize);
        }
        return denominatorBox;
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
            try {
                let child = this.dockingPoints["numerator"].child;
                // TODO Keep an eye on these, we might need the subtreeDockingPointsBoundingBox instead.
                child.position.x = - child.subtreeBoundingBox().x - child.subtreeBoundingBox().w/2;
                child.position.y = -(this.dockingPointSize + child.subtreeDockingPointsBoundingBox().y + child.subtreeDockingPointsBoundingBox().h);
            } catch (e) {
                this.dockingPoints["numerator"].position.x = 0;
                this.dockingPoints["numerator"].position.y = -(this.dockingPointSize + this.s.xBox.h/2);
            }
        }

        if (this.dockingPoints["denominator"]) {
            try {
                let child = this.dockingPoints["denominator"].child;
                // TODO Keep an eye on these, we might need the subtreeDockingPointsBoundingBox instead.
                child.position.x = - child.subtreeBoundingBox().x - child.subtreeBoundingBox().w/2;
                child.position.y = this.dockingPointSize - child.subtreeDockingPointsBoundingBox().y;
            } catch (e) {
                this.dockingPoints["denominator"].position.x = 0;
                this.dockingPoints["denominator"].position.y = this.dockingPointSize + this.s.xBox.h/2;
            }
        }

        if (this.dockingPoints["right"]) {
            try {
                let child = this.dockingPoints["right"].child;
                child.position.x = thisBox.w/2 + child.leftBound + this.dockingPointSize/2;
                child.position.y = - child.dockingPoint.y;
            } catch (e) {
                this.dockingPoints["right"].position.x = this.subtreeBoundingBox().w/2 + this.dockingPointSize;
                this.dockingPoints["right"].position.y = 0;
            }
        }
    }
}
