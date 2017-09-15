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
import { Brackets } from './Brackets';
import { DockingPoint } from "./DockingPoint";

/**
 * Binary operations, such as plus and minus.
 *
 * BE EXTRA CAREFUL with the minus sign: use "−" (U+2212), not just a dash.
 */
export
    class BinaryOperation extends Widget {
    protected s: any;
    protected operation: string;
    protected mhchemSymbol: string;
    protected latexSymbol: string;
    protected mathmlSymbol: string;
    protected pythonSymbol: string;

    get typeAsString(): string {
        return "BinaryOperation";
    }

    /**
     * There's a thing with the baseline and all that... this sort-of fixes it.
     *
     * @returns {Vector} The position to which a Symbol is meant to be docked from.
     */
    get dockingPoint(): p5.Vector {
        let p = this.p.createVector(0, -this.s.xBox.h / 2);
        return p;
    }

    constructor(p: any, s: any, operation: string) {
        super(p, s);
        this.s = s;
        this.operation = operation;
        switch(this.operation) {
          case '±':
            this.latexSymbol = '\\pm';
            this.pythonSymbol = '±';
            this.mathmlSymbol = '±';
            this.mhchemSymbol = '\\pm';
            break;
          case '−':
            this.latexSymbol = '-';
            this.pythonSymbol = '-';
            this.mathmlSymbol = '-';
            this.mhchemSymbol = '-';
            break;
          default:
            this.latexSymbol = this.pythonSymbol = this.mathmlSymbol = this.mhchemSymbol = this.operation;
            break;
        }

        // FIXME Not sure this is entirely right. Maybe make the "type" in DockingPoint an array? Works for now.
        this.docksTo = ['exponent', 'operator', 'chemical_element', 'state_symbol', 'particle', 'operator_brackets', 'symbol', 'relation'];
    }

    /**
     * Generates all the docking points in one go and stores them in this.dockingPoints.
     * A Binary Operation has one docking point:
     *
      - _right_: Symbol
     */
    generateDockingPoints() {
        let box = this.boundingBox();
        let descent = this.position.y - (box.y + box.h);

        this.dockingPoints["right"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.s.mBox.w / 4, -this.s.xBox.h / 2), 1, "symbol", "right");
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
        let expression = " ";
        if (format == "latex") {
            expression += this.latexSymbol + " ";
            if (this.dockingPoints["right"].child != null) {
                expression += this.dockingPoints["right"].child.getExpression(format);
            }
        } else if (format == "python") {
            expression += this.pythonSymbol + " ";
            if (this.dockingPoints["right"].child != null) {
                expression += "" + this.dockingPoints["right"].child.getExpression(format);
            }
        } else if (format == "mhchem") {
          expression += this.mhchemSymbol + " ";
            if (this.dockingPoints["right"].child != null) {
                expression += " " + this.dockingPoints["right"].child.getExpression(format) + " ";
            } else {
                // This is a charge, most likely:
                expression = this.operation.replace(/−/g, "-");
            }
        } else if (format == "subscript") {
            expression = "";
            if (this.dockingPoints["right"].child != null) {
                expression += this.dockingPoints["right"].child.getExpression(format);
            }
        } else if (format == "mathml") {
            expression = '<mo>' + this.mathmlSymbol + "</mo>";
            if (this.dockingPoints["right"].child != null) {
                expression += this.dockingPoints["right"].child.getExpression(format);
            }
        }
        return expression;
    }

    properties(): Object {
        return {
            operation: this.operation
        };
    }

    token() {
        return '';
    }

    /** Paints the widget on the canvas. */
    _draw() {
        this.p.fill(this.color).strokeWeight(0).noStroke();

        this.p.textFont(this.s.font_up)
            .textSize(this.s.baseFontSize * 0.8 * this.scale)
            .textAlign(this.p.CENTER, this.p.BASELINE)
            .text(this.operation, 0, 0);
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
        let s = this.operation || "+";
        s = "+";


        let box = this.s.font_up.textBounds(s, 0, 1000, this.scale * this.s.baseFontSize * 0.8);

        return new Rect(-box.w, box.y - 1000, box.w * 2, box.h); // TODO: Assymetrical BBox
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

        _.each(this.dockingPoints, (dockingPoint, dockingPointName) => {
            if (dockingPoint.child != null) {
                dockingPoint.child.scale = this.scale * dockingPoint.scale;
                dockingPoint.child._shakeIt();
                boxes[dockingPointName] = dockingPoint.child.boundingBox(); // NB: This only looks at the direct child!
            }
        });

        // Calculate our own geometry

        // Nothing to do for BinaryOperation

        // Set position of all our children.

        let box = this.boundingBox();

        let parent_w = this.boundingBox().w;
        let right;
        if ("right" in boxes) {
            right = this.dockingPoints["right"].child;
            let isChemicalElement = right.dockingPoints["mass_number"] && right.dockingPoints["proton_number"];
            let child_w = right.boundingBox().w;
            let child_mass_w = (isChemicalElement && right.dockingPoints["mass_number"].child) ? right.dockingPoints["mass_number"].child.boundingBox().w : 0;
            let child_proton_w = (isChemicalElement && right.dockingPoints["proton_number"].child) ? right.dockingPoints["proton_number"].child.boundingBox().w : 0;
            if (isChemicalElement && child_mass_w != 0 && child_proton_w != 0) {
                child_w += (child_mass_w >= child_proton_w) ? child_mass_w : child_proton_w;
                right.position.x = 1.2 * (parent_w / 2 + child_w / 2);
                right.position.y = 0;
            }
            else {
                child_w += (child_mass_w >= child_proton_w) ? child_mass_w : child_proton_w;
                right.position.x = parent_w / 2 + child_w / 2;
                right.position.y = 0;
                // FIXME HORRIBLE BRACKETS FIX
                if (right.child instanceof Brackets) {
                    right.child.position.y = right.child.dockingPoints["argument"].child ? -right.child.dockingPoints["argument"].child.boundingBox().h/2 : 0;
                }
            }

        }
    }
}
