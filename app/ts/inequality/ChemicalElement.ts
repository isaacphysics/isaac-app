/*
Copyright 2016 Andrew Wells <aw684@cam.ac.uk>

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

/* tslint:disable: no-`unused-variable */
/* tslint:disable: comment-format */

import { Widget, Rect } from './Widget'
import { BinaryOperation } from "./BinaryOperation";
import { DockingPoint } from "./DockingPoint";
import { Relation } from "./Relation";

/** A class for representing chemical elements. */
export
    class ChemicalElement extends Widget {

    public s: any;
    protected element: string;

    get typeAsString(): string {
        return "ChemicalElement";
    }

    /**
     * There's a thing with the baseline and all that... this sort-of fixes it.
     *
     * @returns {p5.Vector} The position to which a ChemicalElement is meant to be docked from.
     */
    get dockingPoint(): p5.Vector {
        return this.p.createVector(0, -this.scale*this.s.xBox_h/2);
    }

    constructor(p: any, s: any, element: string) {
        super(p, s);
        this.element = element;
        this.s = s;
        this.docksTo = ['ChemicalElement', 'operator', 'relation', 'symbol', 'chemical_element', "operator_brackets"];
    }

    /**
     * Generates all the docking points in one go and stores them in this.dockingPoints.
     * A ChemicalElement has five docking points:
     *
     * - _right_: Binary operation (addition, subtraction), ChemicalElement (multiplication)
     * - _superscript_: Exponent
     * - _subscript_: Subscript (duh?)
     * - mass_number: the number of protons and neutrons the element has
     * - proton_number: the number of protons the element has (crazy, right?)
     */
    generateDockingPoints() {
        let box = this.boundingBox();
        let descent = this.position.y - (box.y + box.h);

        // Create the docking points
        this.dockingPoints["right"] = new DockingPoint(this, this.p.createVector(box.w/2 + this.s.mBox_w / 4, -this.s.xBox_h/2), 1, ["chemical_element"], "right");
        this.dockingPoints["superscript"] = new DockingPoint(this, this.p.createVector(box.w/2 + this.scale * 20, -this.scale * this.s.mBox_h), 2/3, ["exponent"], "superscript");
        this.dockingPoints["subscript"] = new DockingPoint(this, this.p.createVector(box.w/2 + this.scale * 20, descent), 2/3, ["subscript"], "subscript");
        this.dockingPoints["mass_number"] = new DockingPoint(this, this.p.createVector(0, 0), 2/3, ["top-left"], "mass_number");
        this.dockingPoints["proton_number"] = new DockingPoint(this, this.p.createVector(0, 0), 2/3, ["bottom-left"], "proton_number");
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
        let expression = "\\text{" + this.element + "}";

        let isParticle = (this.element[0] != '\\');
        if (format == "latex") {
            expression = "\\text{" + this.element + "}";
            // Need to remove this so that we can append the element to mass/proton numbers
            // Renders the mass number first if present, otherwise just renders the element.
            // KaTeX doesn't support the mhchem package so padding is used to display nuclear equations correctly.
            if (this.dockingPoints["mass_number"].child != null || this.dockingPoints["proton_number"].child != null) {
                expression = "";
                let mass_number_length = 0;
                let proton_number_length = 0;
                if (this.dockingPoints["proton_number"].child != null && this.dockingPoints["mass_number"].child != null) {
                    proton_number_length = this.dockingPoints["proton_number"].child.formatExpressionAs(format).length;
                    mass_number_length = this.dockingPoints["mass_number"].child.formatExpressionAs(format).length;
                    let number_of_spaces = Math.abs(proton_number_length - mass_number_length);
                    let padding = "";
                    // Temporary hack to align mass number and proton number correctly.
                    for (let _i = 0; _i < number_of_spaces; _i++) {
                        padding += "\\enspace";
                    }
                    expression = (mass_number_length <= proton_number_length) ? "{}^{" + padding + this.dockingPoints["mass_number"].child.formatExpressionAs(format) + "}_{" + this.dockingPoints["proton_number"].child.formatExpressionAs(format) + "}\\text{" + this.element + "}" : "{}^{" + this.dockingPoints["mass_number"].child.formatExpressionAs(format) + "}_{" + padding + this.dockingPoints["proton_number"].child.formatExpressionAs(format) + "}\\text{" + this.element + "}";
                } else if (this.dockingPoints["mass_number"].child != null) {
                    expression = "{}^{" + this.dockingPoints["mass_number"].child.formatExpressionAs(format) + "}_{}\\text{" + this.element + "}";
                } else if (this.dockingPoints["proton_number"].child != null) {
                    expression = "{}^{}_{" + this.dockingPoints["proton_number"].child.formatExpressionAs(format) + "}\\text{" + this.element + "}";
                }
            }

            if (this.dockingPoints["superscript"].child != null) {
                expression += "^{" + this.dockingPoints["superscript"].child.formatExpressionAs(format) + "}";
            }
            if (this.dockingPoints["subscript"].child != null) {
                expression += "_{" + this.dockingPoints["subscript"].child.formatExpressionAs(format) + "}";
            }
            if (this.dockingPoints["right"].child != null) {
                if (this.dockingPoints["right"].child instanceof BinaryOperation) {
                    expression += this.dockingPoints["right"].child.formatExpressionAs(format);
                }
                else if (this.dockingPoints["right"].child instanceof Relation) {
                    expression += this.dockingPoints["right"].child.formatExpressionAs(format);
                }
                else {
                    // WARNING This assumes it's a ChemicalElement, hence produces a multiplication
                    expression += this.dockingPoints["right"].child.formatExpressionAs(format);
                }
            }
        } else if (format == "subscript") {
            expression = "" + this.element;
            if (this.dockingPoints["subscript"].child != null) {
                expression += this.dockingPoints["subscript"].child.formatExpressionAs(format);
            }
            if (this.dockingPoints["superscript"].child != null) {
                expression += this.dockingPoints["superscript"].child.formatExpressionAs(format);
            }
            if (this.dockingPoints["right"].child != null) {
                expression += this.dockingPoints["right"].child.formatExpressionAs(format);
            }
        // } else if (format == "python") {
        //     expression = "";
        } else if (format == "mathml") {
            let m_superscript = this.dockingPoints['superscript'].child != null ? "<mrow>" + this.dockingPoints['superscript'].child.formatExpressionAs(format) + "</mrow>" : "<none />";
            let m_subscript = this.dockingPoints['subscript'].child != null ? "<mrow>" + this.dockingPoints['subscript'].child.formatExpressionAs(format) + "</mrow>" : "<none />";
            let m_mass_number = this.dockingPoints['mass_number'].child != null ? "<mrow>" + this.dockingPoints['mass_number'].child.formatExpressionAs(format) + "</mrow>" : "<none />";
            let m_proton_number = this.dockingPoints['proton_number'].child != null ? "<mrow>" + this.dockingPoints['proton_number'].child.formatExpressionAs(format) + "</mrow>" : "<none />";
            expression = '';
            if (m_subscript == "<none />" && m_superscript == "<none />" && m_mass_number == "<none />" && m_proton_number == "<none />") {
                expression += '<mi>' + this.element + '</mi>';
            } else  {
                expression += "<mmultiscripts>" + "<mi>" + this.element + "</mi>" + m_subscript + m_superscript;
                expression += "<mprescripts />" + m_proton_number + m_mass_number + "</mmultiscripts>"
            }
            if (this.dockingPoints['right'].child != null) {
                expression += this.dockingPoints['right'].child.formatExpressionAs('mathml');
            }
        } else if (format == "mhchem") {
            expression = this.element;
            if (this.dockingPoints["mass_number"].child != null && this.dockingPoints["proton_number"].child != null) {
                expression = "";
                expression += "{}^{" + this.dockingPoints["mass_number"].child.formatExpressionAs(format) + "}_{" + this.dockingPoints["proton_number"].child.formatExpressionAs(format) + "}" + this.element;
            }
            if (this.dockingPoints["subscript"].child != null) {
                expression += this.dockingPoints["subscript"].child.formatExpressionAs(format);
            }
            if (this.dockingPoints["superscript"].child != null) {
                expression += "^{" + this.dockingPoints["superscript"].child.formatExpressionAs(format) + "}";
            }
            if (this.dockingPoints["right"].child != null) {
                if (this.dockingPoints["right"].child instanceof BinaryOperation) {
                    expression += this.dockingPoints["right"].child.formatExpressionAs(format);
                }
                else if (this.dockingPoints["right"].child instanceof Relation) {
                    expression += this.dockingPoints["right"].child.formatExpressionAs(format);
                } else {
                    // WARNING This assumes it's a ChemicalElement, hence produces a multiplication
                    expression += this.dockingPoints["right"].child.formatExpressionAs(format);
                }
            }
        }
        return expression;
    }

    properties(): Object {
        return {
            element: this.element
        };
    }

    token(): string {
        let e = this.element;
        return e;
    }

    /** Paints the widget on the canvas. */
    _draw() {
        this.p.fill(this.color).strokeWeight(0).noStroke();

        this.p.textFont(this.s.font_up)
            .textSize(this.s.baseFontSize * this.scale)
            .textAlign(this.p.CENTER, this.p.BASELINE)
            .text(this.element, 0, 0);
        this.p.strokeWeight(1);
    }

    /**
     * This widget's tight bounding box. This is used for the cursor hit testing.
     *
     * @returns {Rect} The bounding box
     */
    boundingBox(): Rect {
        let text = (this.element || "X");
        let box = this.s.font_it.textBounds(text, 0, 0, this.scale * this.s.baseFontSize);

        return new Rect(-box.w/2, box.y, box.w, box.h);
    }

    /**
     * Internal companion method to shakeIt(). This is the one that actually does the work, and the one that should be
     * overridden by children of this class.
     *
     * @private
     */
    _shakeIt() {
        // This is how Chemistry works:
        // ----------------------------------
        //   mass_number       superscript
        //              Element            right
        // proton_number       subscript

        this._shakeItDown();
        let thisBox = this.boundingBox();

        if (this.dockingPoints["mass_number"]) {
            let dp = this.dockingPoints["mass_number"];
            if (dp.child) {
                let child = dp.child;
                // FIXME The commented variant is horrible with regard to spacing.
                // FIXME The issue is likely to go away once I rewrite the docking code, if I can make the flexible spacing thing work.
                // FIXME I'm keeping it like this for now because it's easier on the eyes.
                // child.position.x = thisBox.x + child.rightBound;
                child.position.x = thisBox.x + child.rightBound + child.subtreeDockingPointsBoundingBox.w - child.subtreeBoundingBox.w;
                child.position.y = -this.scale*this.s.xBox_h - (child.subtreeDockingPointsBoundingBox.y + child.subtreeDockingPointsBoundingBox.h);
            } else {
                dp.position.x = thisBox.x - dp.size/2;
                dp.position.y = (-this.scale * this.s.mBox_h);
            }
        }

        if (this.dockingPoints["proton_number"]) {
            let dp = this.dockingPoints["proton_number"];
            if (dp.child) {
                let child = dp.child;
                // FIXME The commented variant is horrible with regard to spacing.
                // FIXME The issue is likely to go away once I rewrite the docking code, if I can make the flexible spacing thing work.
                // FIXME I'm keeping it like this for now because it's easier on the eyes.
                // child.position.x = thisBox.x + child.rightBound;
                child.position.x = thisBox.x + child.rightBound + child.subtreeDockingPointsBoundingBox.w - child.subtreeBoundingBox.w;
                child.position.y = child.topBound;
            } else {
                dp.position.x = thisBox.x - dp.size/2;
                dp.position.y = 0;
            }
        }

        let superscriptWidth = 0;
        if (this.dockingPoints["superscript"]) {
            let dp = this.dockingPoints["superscript"];
            if (dp.child) {
                let child = dp.child;
                child.position.x = thisBox.x + thisBox.w + child.leftBound + child.scale*dp.size/2;
                child.position.y = -this.scale*this.s.xBox_h - (child.subtreeDockingPointsBoundingBox.y + child.subtreeDockingPointsBoundingBox.h);
                superscriptWidth = Math.max(dp.size, child.subtreeDockingPointsBoundingBox.w);
            } else {
                dp.position.x = thisBox.x + thisBox.w + dp.size/2;
                dp.position.y = -this.scale * this.s.mBox_h;
                superscriptWidth = dp.size;
            }
        }

        let subscriptWidth = 0;
        if (this.dockingPoints["subscript"]) {
            let dp = this.dockingPoints["subscript"];
            if (dp.child) {
                let child = dp.child;
                child.position.x = thisBox.x + thisBox.w + child.leftBound + child.scale*dp.size/2;
                child.position.y = child.topBound;
                subscriptWidth = Math.max(dp.size, child.subtreeDockingPointsBoundingBox.w);
            } else {
                dp.position.x = thisBox.x + thisBox.w + dp.size/2;
                dp.position.y = 0;
                subscriptWidth = dp.size;
            }
        }

        if (this.dockingPoints["right"]) {
            let dp = this.dockingPoints["right"];
            if (dp.child) {
                let child = dp.child;
                child.position.x = thisBox.x + thisBox.w + child.leftBound + Math.max(superscriptWidth, subscriptWidth) + dp.size/2;
                child.position.y = this.dockingPoint.y - child.dockingPoint.y;
            } else {
                dp.position.x = thisBox.x + thisBox.w + Math.max(superscriptWidth, subscriptWidth) + dp.size;
                dp.position.y = -this.scale * this.s.xBox_h/2;
            }
        }
    }

    /**
     * @returns {Array<Widget>} A flat array of the children of this widget, as widget objects
     */
    get children(): Array<Widget> {
        return _.compact(_.map(_.values(_.omit(this.dockingPoints, "subscript")), "child"));
    }
}
