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

/* tslint:disable: all */
/* tslint:disable: comment-format */

import { Widget, Rect } from './Widget'
import { Symbol } from "./Symbol";
import { BinaryOperation } from "./BinaryOperation";
import { Relation } from "./Relation";
import { DockingPoint } from "./DockingPoint";

/** Brackets. "We got both kinds, we got country and western". */
export
    class Brackets extends Widget {

    protected s: any;
    private type: string;
    private latexSymbol: Object;
    private pythonSymbol: Object;
    private mhchemSymbol: Object;
    private mathmlSymbol: Object;
    private glyph: Object;

    get typeAsString(): string {
        return "Brackets";
    }

    /**
     * There's a thing with the baseline and all that... this sort-of fixes it.
     *
     * @returns {Vector} The position to which a Symbol is meant to be docked from.
     */
    get dockingPoint(): p5.Vector {
        let box = this.s.font_it.textBounds("()", 0, 1000, this.scale * this.s.baseFontSize);
        let p = this.p.createVector(0, 0);
        return p;
    }

    constructor(p: any, s: any, type: string, mode:string) {
        super(p, s, mode);
        this.type = type;
        this.s = s;
        switch (this.type) {
            case 'round':
                this.latexSymbol = {
                    'lhs': '\\left(',
                    'rhs': '\\right)'
                };
                this.mhchemSymbol = this.pythonSymbol = this.mathmlSymbol = this.glyph = {
                    'lhs': '(',
                    'rhs': ')'
                }
                break;
            case "square":
                this.latexSymbol = {
                    'lhs': '\\left[',
                    'rhs': '\\right]'
                };
                this.mhchemSymbol = this.pythonSymbol = this.mathmlSymbol = this.glyph = {
                    'lhs': '[',
                    'rhs': ']'
                }
                break;
            case "curly":
                this.latexSymbol = {
                    'lhs': '\\left{',
                    'rhs': '\\right}'
                };
                this.mhchemSymbol = this.pythonSymbol = this.mathmlSymbol = this.glyph = {
                    'lhs': '{',
                    'rhs': '}'
                };
                break;
            default:
                this.latexSymbol = {};
                this.mhchemSymbol = this.pythonSymbol = this.mathmlSymbol = this.glyph = {};
        }
        this.docksTo = ['symbol', 'operator', 'exponent', 'subscript', 'chemical_element', 'operator_brackets', 'relation', 'differential_argument'];
    }


    /**
     * Generates all the docking points in one go and stores them in this.dockingPoints.
     * A Symbol has three docking points:
     *
     * - _right_: Binary operation (addition, subtraction), Symbol (multiplication)
     * - _superscript_: Exponent
     * - _subscript_: Subscript (duh?)
     */
    generateDockingPoints() {
        let box = this.boundingBox();
        let descent = this.position.y - (box.y + box.h);
        let pBox = this.s.font_it.textBounds("(", 0, 1000, this.scale * this.s.baseFontSize);

        this.dockingPoints["argument"] = new DockingPoint(this, this.p.createVector(0, -this.s.xBox.h / 2), 1, "symbol", "argument");
        this.dockingPoints["right"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.scale * this.s.mBox.w / 4 + this.scale * 20, -this.s.xBox.h / 2), 1, "operator_brackets", "right");
        this.dockingPoints["superscript"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.scale * 20, -(box.h + descent + this.scale * 20)), 0.666, "exponent", "superscript");
        if (this.mode == 'chemistry') {
          this.dockingPoints["subscript"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.scale * 20, -(box.h + descent + this.scale * 20)), 0.666, "subscript", "subscript");
        }
        else {
          this.dockingPoints["subscript"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.scale * 20, -(box.h + descent + this.scale * 20)), 0.666, "subscript_maths", "subscript");
        }
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
        // TODO Triple check
        let expression = "";
        let lhs = '(', rhs = ')';
        if (format == "latex") {
            lhs = this.latexSymbol['lhs'];
            rhs = this.latexSymbol['rhs'];
            if (this.dockingPoints['argument'].child) {
                expression += lhs + this.dockingPoints['argument'].child.getExpression(format) + rhs;
                if (this.dockingPoints['superscript'].child) {
                    expression += '^{' + this.dockingPoints['superscript'].child.getExpression(format) + '}';
                }
                if (this.dockingPoints['subscript'].child) {
                    expression += '_{' + this.dockingPoints['subscript'].child.getExpression(format) + '}';
                }
                if (this.dockingPoints['right'].child) {
                    expression += this.dockingPoints['right'].child.getExpression(format);
                }
            }
        }
        if (format == "mhchem") {
            lhs = this.mhchemSymbol['lhs'];
            rhs = this.mhchemSymbol['rhs'];
            if (this.dockingPoints['argument'].child) {
                expression += lhs + this.dockingPoints['argument'].child.getExpression(format) + rhs;
                if (this.dockingPoints['subscript'].child) {
                    expression += this.dockingPoints['subscript'].child.getExpression(format);
                }
                if (this.dockingPoints['superscript'].child) {
                    expression += '^{' + this.dockingPoints['superscript'].child.getExpression(format) + '}';
                }
                if (this.dockingPoints['right'].child) {
                    expression += this.dockingPoints['right'].child.getExpression(format);
                }
            }
        } else if (format == "python") {
            lhs = this.pythonSymbol['lhs'];
            rhs = this.pythonSymbol['rhs'];
            if (this.dockingPoints['argument'].child) {
                expression += lhs + this.dockingPoints['argument'].child.getExpression(format) + rhs;
                if (this.dockingPoints['superscript'].child) {
                    expression += '**(' + this.dockingPoints['superscript'].child.getExpression(format) + ')';
                }
                if (this.dockingPoints['subscript'].child) {
                    expression += '_(' + this.dockingPoints['subscript'].child.getExpression(format) + ')';
                }
                if (this.dockingPoints["right"].child != null) {
                    if (this.dockingPoints["right"].child instanceof BinaryOperation || this.dockingPoints["right"].child instanceof Relation) {
                        expression += this.dockingPoints["right"].child.getExpression(format);
                    } else {
                        expression += " * " + this.dockingPoints["right"].child.getExpression(format);
                    }
                }
            }
        } else if (format == "subscript") {
            expression += "{BRACKETS}";
        } else if (format == 'mathml') {
            lhs = this.mathmlSymbol['lhs'];
            rhs = this.mathmlSymbol['rhs'];
            if (this.dockingPoints['argument'].child) {
                let brackets = '<mfenced open="' + lhs + '" close="' + rhs + '"><mrow>' + this.dockingPoints['argument'].child.getExpression(format) + '</mrow></mfenced>';
                if (this.dockingPoints['superscript'].child != null && this.dockingPoints["subscript"].child != null) {
                    expression += '<msubsup>' + brackets + '<mrow>' + this.dockingPoints['subscript'].child.getExpression(format) + '</mrow><mrow>' + this.dockingPoints['superscript'].child.getExpression(format) + '</mrow></msubsup>';
                } else if (this.dockingPoints['superscript'].child != null && this.dockingPoints["subscript"].child == null) {
                    expression = '<msup>' + brackets + '<mrow>' + this.dockingPoints['superscript'].child.getExpression(format) + '</mrow></msup>';
                } else if (this.dockingPoints['superscript'].child == null && this.dockingPoints["subscript"].child != null) {
                    expression = '<msub>' + brackets + '<mrow>' + this.dockingPoints['subscript'].child.getExpression(format) + '</mrow></msub>';
                } else {
                    expression = brackets;
                }
                if (this.dockingPoints['right'].child) {
                    expression += this.dockingPoints['right'].child.getExpression(format);
                }
            }
        }
        return expression;
    }

    properties(): Object {
        return {
            type: this.type
        };
    }

    token() {
        return '';
    }

    /** Paints the widget on the canvas. */
    _draw() {
        let argWidth = this.s.xBox.w;
        let argHeight = this.s.xBox.h;
        if (this.dockingPoints['argument'].child) {
            let subtreeBB = this.dockingPoints['argument'].child.subtreeBoundingBox();
            argWidth = subtreeBB.w;
            argHeight = subtreeBB.h;
        }
        this.p.push();
        this.p.scale(1, 1 + ((argHeight / this.s.xBox.h) - 1) / 2);

        this.p.fill(this.color).strokeWeight(0).noStroke();

        this.p.textFont(this.s.font_up)
            .textSize(this.s.baseFontSize * this.scale)
            .textAlign(this.p.RIGHT, this.p.CENTER);

        this.p.text(this.glyph['lhs'], -argWidth / 2, -this.s.xBox.h / 4);

        this.p.textFont(this.s.font_up)
            .textSize(this.s.baseFontSize * this.scale)
            .textAlign(this.p.LEFT, this.p.CENTER);
        this.p.text(this.glyph['rhs'], argWidth / 2 + this.scale * 40, -this.s.xBox.h / 4); // FIXME This 40 is hard-coded
        this.p.pop();
        this.p.strokeWeight(1);

        //this.p.rect(-argWidth/2, -argHeight/2 - this.s.xBox.h/2, argWidth, argHeight);


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
        let box = this.s.font_up.textBounds("()", 0, 1000, this.scale * this.s.baseFontSize);
        let argWidth = this.s.xBox.w;
        let argHeight = box.h;// this.s.xBox.h;
        if ('argument' in this.dockingPoints && this.dockingPoints['argument'].child) {
            let subtreeBB = this.dockingPoints['argument'].child.subtreeBoundingBox();
            argWidth = subtreeBB.w;
            argHeight = _.max([argHeight, subtreeBB.h]);
        }
        let scale = 1 + ((argHeight / box.h) - 1) / 2;
        argHeight *= scale; // Vertical scale factor (???)
        let width = box.w + argWidth;
        return new Rect(-width / 2, -argHeight/2, width + this.scale * 40, argHeight);  // FIXME This 40 is hard-coded
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

        // Nothing to do for Symbol

        // Set position of all our children.

        let box = this.boundingBox();
        let descent = (box.y + box.h);

        let widest = 0;

        let box = this.boundingBox();
        let parent_position = (box.y + box.h);
        let parent_superscript_width = (this.dockingPoints["superscript"].child != null) ? (this.dockingPoints["superscript"].child.getExpressionWidth()) : 0;
        let parent_subscript_width = (this.dockingPoints["subscript"].child != null) ? (this.dockingPoints["subscript"].child.getExpressionWidth()) : 0;
        let parent_width = box.w;
        let parent_height = box.h;
        let child_height;
        let child_width;
        let docking_right = this.dockingPoints["right"];
        let docking_superscript = this.dockingPoints["superscript"];
        let docking_subscript = this.dockingPoints["subscript"];
        let docking_mass = this.dockingPoints["mass_number"];
        let docking_proton_number = this.dockingPoints["proton_number"];

        if ("argument" in boxes) {
            let p = this.dockingPoints["argument"].child.position;
            let w = this.dockingPoints["argument"].child.offsetBox().w;
            p.x = -this.dockingPoints["argument"].child.subtreeBoundingBox().w / 2 + w / 2;
            p.y = this.scale*15;
            widest += w;
        } else {
            this.dockingPoints["argument"].position = this.p.createVector(0, 0);
        }

        if ("superscript" in boxes) {
            child_width = docking_superscript.child.boundingBox().w;
            child_height = docking_superscript.child.boundingBox().h;
            docking_superscript.child.position.x = (parent_width / 2 + this.scale * (40) + child_width / 2);
            docking_superscript.child.position.y = - parent_height / 2 - docking_superscript.child.subtreeBoundingBox().h / 2; // this.scale * this.s.mBox.h/2; // -0.7 * (parent_height / 2 + child_height / 2);
        } else { // FIXME This kind of works, but could use some improvements on the constants side (af599)
            docking_superscript.position.x = (parent_width == this.boundingBox().w) ? (parent_width / 2 + this.scale * (40 + 20)) : (parent_width - this.boundingBox().w / 2 + this.scale * 40);
            docking_superscript.position.y = -parent_height / 2 - this.scale * this.s.mBox.h / 2;
        }

        if ("superscript" in boxes) {
            child_width = docking_superscript.child.boundingBox().w;
            child_height = docking_superscript.child.boundingBox().h;
            docking_superscript.child.position.x = (parent_width / 2 + this.scale * (40) + child_width / 2);
            docking_superscript.child.position.y = - parent_height / 2 - docking_superscript.child.subtreeBoundingBox().h / 2; // this.scale * this.s.mBox.h/2; // -0.7 * (parent_height / 2 + child_height / 2);
        } else { // FIXME This kind of works, but could use some improvements on the constants side (af599)
            docking_superscript.position.x = (parent_width == this.boundingBox().w) ? (parent_width / 2 + this.scale * (40 + 20)) : (parent_width - this.boundingBox().w / 2 + this.scale * 40);
            docking_superscript.position.y = -parent_height / 2 - this.scale * this.s.mBox.h / 2;
        }

        if ("subscript" in boxes) {
            child_width = docking_subscript.child.boundingBox().w;
            child_height = docking_subscript.child.boundingBox().h;
            docking_subscript.child.position.x = (parent_width / 2 + this.scale * (40) + child_width / 2);
            docking_subscript.child.position.y =  parent_height / 2 + docking_subscript.child.subtreeBoundingBox().h / 2; // this.scale * this.s.mBox.h/2; // -0.7 * (parent_height / 2 + child_height / 2);
        } else {
            docking_subscript.position.x = (parent_width == this.boundingBox().w) ? (parent_width / 2 + this.scale * (40 + 20)) : (parent_width - this.boundingBox().w / 2 + this.scale * 40);
            docking_subscript.position.y = parent_height / 2 + this.scale * this.s.mBox.h / 2;
        }

        parent_width += (parent_subscript_width >= parent_superscript_width) ? parent_subscript_width : parent_superscript_width;

        if ("right" in boxes) {
            child_width = docking_right.child.boundingBox().w;
            docking_right.child.position.x = (parent_width == this.boundingBox().w) ? (parent_width / 2 + this.scale * (40 + 20) + docking_right.child.offsetBox().w / 2) : (parent_width - this.boundingBox().w / 2 + docking_right.child.offsetBox().w);
            docking_right.child.position.y = 0;
        } else {
            docking_right.position.x = (parent_width == this.boundingBox().w) ? (parent_width / 2 + this.scale * (40 + 20)) : (parent_width - this.boundingBox().w / 2 + this.scale * 40);
            docking_right.position.y = 0;
        }

    }
}
