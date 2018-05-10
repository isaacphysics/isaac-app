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
import {BASE_DOCKING_POINT_SIZE} from "./Inequality";

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
        return this.p.createVector(0, 0);
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
        this.dockingPoints["right"] = new DockingPoint(this, this.p.createVector(50 + this.scale * this.s.mBox_w/4, -box.h/2), 1, ["operator"], "right");
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
    formatExpressionAs(format: string): string {
        let expression = "";
        if (format == "latex") {
            if (this.dockingPoints["numerator"].child != null && this.dockingPoints["denominator"].child != null) {
                expression += "\\frac{" + this.dockingPoints["numerator"].child.formatExpressionAs(format) + "}{" + this.dockingPoints["denominator"].child.formatExpressionAs(format) + "}";
                if (this.dockingPoints["right"].child != null) {
                    expression += this.dockingPoints["right"].child.formatExpressionAs(format);
                }
            }
        } else if (format == "python") {
            if (this.dockingPoints["numerator"].child != null && this.dockingPoints["denominator"].child != null &&
                this.dockingPoints["numerator"].child.typeAsString == "Differential" && this.dockingPoints["denominator"].child.typeAsString == "Differential") {
                expression += "Derivative(";
                if (this.dockingPoints["numerator"].child.dockingPoints["argument"].child != null) {
                    expression += this.dockingPoints["numerator"].child.dockingPoints["argument"].child.formatExpressionAs(format) + ", ";
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
                            o = parseInt((o_child as Num).getFullText());
                        }
                        do {
                            if (e.dockingPoints["argument"].child != null) {
                                list.push(e.dockingPoints["argument"].child.formatExpressionAs(format));
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
                    expression += this.dockingPoints["right"].child.formatExpressionAs(format);
                }
            }
        } else if (format == "subscript") {
            if (this.dockingPoints["right"].child != null) {
                expression += "[Derivative:" + this.id + "]";
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
        return this.formatExpressionAs("python");
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
        let numeratorBox = new Rect(0, 0, BASE_DOCKING_POINT_SIZE, BASE_DOCKING_POINT_SIZE);
        if (this.dockingPoints["numerator"] && this.dockingPoints["numerator"].child) {
            numeratorBox = this.dockingPoints["numerator"].child.subtreeDockingPointsBoundingBox;
        }
        return numeratorBox;
    }

    get _denominatorBox(): Rect {
        let denominatorBox = new Rect(0, 0, BASE_DOCKING_POINT_SIZE, BASE_DOCKING_POINT_SIZE);
        if (this.dockingPoints["denominator"] && this.dockingPoints["denominator"].child) {
            denominatorBox = this.dockingPoints["denominator"].child.subtreeDockingPointsBoundingBox;
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
