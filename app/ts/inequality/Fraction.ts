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

///// <reference path="../../typings/p5.d.ts" />
///// <reference path="../../typings/lodash.d.ts" />

/* tslint:disable: no-unused-variable */
/* tslint:disable: comment-format */

import { Widget, Rect } from './Widget.ts';
import { BinaryOperation } from "./BinaryOperation.ts";
import { Relation } from "./Relation.ts";
import { DockingPoint } from "./DockingPoint.ts";
import { Brackets } from "./Brackets.ts";

export
    class Fraction extends Widget {
    protected s: any;
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
        let p = this.p.createVector(-this.boundingBox().w / 2, 0);
        return p;
    }

    constructor(p: any, s: any) {
        super(p, s);
        this.s = s;
        this.width = 0;

        this.docksTo = ['operator', 'symbol', 'exponent', 'operator_brackets', 'relation', 'symbol_subscript', 'differential_argument'];
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
        this.dockingPoints["right"] = new DockingPoint(this, this.p.createVector(50 + this.scale * this.s.mBox.w / 4, -box.h / 2), 1, "operator", "right");
        this.dockingPoints["numerator"] = new DockingPoint(this, this.p.createVector(0, -(box.h + 25)), 1, "symbol", "numerator");
        this.dockingPoints["denominator"] = new DockingPoint(this, this.p.createVector(0, 0 + 25), 1, "symbol", "denominator");
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
        if (format == "latex" || format == 'mhchem') {
            if (this.dockingPoints["numerator"].child != null && this.dockingPoints["denominator"].child != null) {
                expression += "\\frac{" + this.dockingPoints["numerator"].child.getExpression(format) + "}{" + this.dockingPoints["denominator"].child.getExpression(format) + "}";
                if (this.dockingPoints["right"].child != null) {
                    expression += this.dockingPoints["right"].child.getExpression(format);
                }
            }
        } else if (format == "python") {
            if (this.dockingPoints["numerator"].child != null && this.dockingPoints["denominator"].child != null) {
                expression += "(" + this.dockingPoints["numerator"].child.getExpression(format) + ")/(" + this.dockingPoints["denominator"].child.getExpression(format) + ")";
                if (this.dockingPoints["right"].child != null) {
                    if (this.dockingPoints["right"].child instanceof BinaryOperation || this.dockingPoints["right"].child instanceof Relation) {
                        expression += this.dockingPoints["right"].child.getExpression(format);
                    } else {
                        expression += " * " + this.dockingPoints["right"].child.getExpression(format);
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
        return '';
    }

    /** Paints the widget on the canvas. */
    _draw() {
        this.p.noFill().strokeWeight(5 * this.scale).stroke(this.color);

        let box = this.boundingBox();
        this.p.line(-box.w / 2, -box.h / 2, box.w / 2, -box.h / 2);

        this.p.strokeWeight(1);

        if (window.location.hash === "#debug") {
            this.p.stroke(255, 0, 0).noFill();
            this.p.ellipse(0, 0, 10, 10);
            this.p.ellipse(0, 0, 5, 5);

            this.p.stroke(0, 0, 255).noFill();
            this.p.ellipse(this.dockingPoint.x, this.dockingPoint.y, 10, 10);
            this.p.ellipse(this.dockingPoint.x, this.dockingPoint.y, 5, 5);
        }
    }

    /**
     * This widget's tight bounding box. This is used for the cursor hit testing.
     *
     * @returns {Rect} The bounding box
     */
    boundingBox(): Rect {
        let box = this.s.font_up.textBounds("+", 0, 1000, this.scale * this.s.baseFontSize);
        this.width = 50;
        let numerator_width = (this.dockingPoints["numerator"] != undefined && this.dockingPoints["numerator"].child != null) ? this.dockingPoints["numerator"].child.getExpressionWidth() : this.width;
        let denominator_width = (this.dockingPoints["denominator"] != undefined && this.dockingPoints["denominator"].child != null) ? this.dockingPoints["denominator"].child.getExpressionWidth() : this.width;
        this.width = (this.width >= numerator_width && this.width >= denominator_width) ? this.width : ((numerator_width >= denominator_width) ? numerator_width : denominator_width);
        return new Rect(-this.width * this.scale / 2, -box.h * this.scale, this.width * this.scale, box.h * this.scale);
    }

    /**
     * Internal companion method to shakeIt(). This is the one that actually does the work, and the one that should be
     * overridden by children of this class.
     *
     * @private
     */
    _shakeIt() {
        // Work out the size of all our children
        let boxes: { [key: string]: Rect } = {};
        let subtreeBoxes: { [key: string]: Rect } = {};

        _.each(this.dockingPoints, (dockingPoint, dockingPointName) => {
            if (dockingPoint.child != null) {
                dockingPoint.child.scale = this.scale * dockingPoint.scale;
                dockingPoint.child._shakeIt();
                boxes[dockingPointName] = dockingPoint.child.boundingBox(); // NB: This only looks at the direct child!
                subtreeBoxes[dockingPointName] = dockingPoint.child.subtreeBoundingBox();
            }
        });

        // Calculate our own geometry
        this.width = Math.max(100, _.max(_.map(_.values(_.pick(subtreeBoxes, ["numerator", "denominator"])), "w")) || 0);

        let bbox = this.boundingBox();
        // Set position of all our children.

        if ("numerator" in boxes) {
            let p = this.dockingPoints["numerator"].child.position;
            let fullNumeratorWidth = subtreeBoxes["numerator"].w;
            let numeratorRootWidth = this.dockingPoints["numerator"].child.offsetBox().w;
            let numeratorFullDescent = subtreeBoxes["numerator"].y + subtreeBoxes["numerator"].h;

            p.x = numeratorRootWidth / 2 - fullNumeratorWidth / 2;
            p.y = -bbox.h / 2 - this.scale * this.s.mBox.w / 4 - numeratorFullDescent;
        }

        if ("denominator" in boxes) {
            let p = this.dockingPoints["denominator"].child.position;
            let fullDenominatorWidth = subtreeBoxes["denominator"].w;
            let denominatorRootWidth = this.dockingPoints["denominator"].child.offsetBox().w;
            let denominatorFullAscent = subtreeBoxes["denominator"].y;

            p.x = denominatorRootWidth / 2 - fullDenominatorWidth / 2;
            p.y = -bbox.h / 2 + this.scale * this.s.mBox.w / 4 - denominatorFullAscent;
        }

        if ("right" in boxes) {
            let p = this.dockingPoints["right"].child.position;
            p.x = this.width / 2 + this.dockingPoints["right"].child.offsetBox().w / 2 + this.scale * this.s.mBox.w / 4; // TODO: Tweak this with kerning.
            p.y = 0;
            // FIXME HORRIBLE BRACKETS FIX
            let docking_right = this.dockingPoints["right"];
            if (docking_right.child instanceof Brackets) {
                docking_right.child.position.y = docking_right.child.dockingPoints["argument"].child ? -docking_right.child.dockingPoints["argument"].child.boundingBox().h/2 : 0;
            }
        } else {
            let p = this.dockingPoints["right"].position;
            if ("denominator" in boxes) {
                p.x = this.width / 2 + this.scale * this.s.mBox.w / 2;
            } else {
                p.x = this.width / 2 + this.scale * this.s.mBox.w / 4;
            }
            p.y = -this.boundingBox().h / 2;
        }
    }
}
