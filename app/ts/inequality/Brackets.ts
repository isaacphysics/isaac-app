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
        return this.p.createVector(0, 0);
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

        this.dockingPoints["argument"] = new DockingPoint(this, this.p.createVector(0, -this.s.xBox_h/2), 1, ["symbol", "differential"], "argument");
        this.dockingPoints["right"] = new DockingPoint(this, this.p.createVector(box.w/2 + this.scale * this.s.mBox_w / 4 + this.scale * 20, -this.s.xBox_h/2), 1, ["operator_brackets"], "right");
        this.dockingPoints["superscript"] = new DockingPoint(this, this.p.createVector(box.w/2 + this.scale * 20, -(box.h + descent + this.scale * 20)), 2/3, ["exponent"], "superscript");
        if (this.mode == 'chemistry') {
            this.dockingPoints["subscript"] = new DockingPoint(this, this.p.createVector(box.w/2 + this.scale * 20, -(box.h + descent + this.scale * 20)), 2/3, ["subscript"], "subscript");
        } else {
            this.dockingPoints["subscript"] = new DockingPoint(this, this.p.createVector(box.w/2 + this.scale * 20, -(box.h + descent + this.scale * 20)), 2/3, ["symbol_subscript", "subscript_maths"], "subscript");
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
            } else {
                expression += lhs + rhs;
            }
            if (this.dockingPoints['right'].child) {
                expression += this.dockingPoints['right'].child.getExpression(format);
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
            } else {
                expression += lhs + rhs;
            }
            if (this.dockingPoints['right'].child) {
                expression += this.dockingPoints['right'].child.getExpression(format);
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
            } else {
                expression += lhs + rhs;
            }
            if (this.dockingPoints["right"].child != null) {
                if (this.dockingPoints["right"].child instanceof BinaryOperation || this.dockingPoints["right"].child instanceof Relation) {
                    expression += this.dockingPoints["right"].child.getExpression(format);
                } else {
                    expression += " * " + this.dockingPoints["right"].child.getExpression(format);
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
            }
            if (this.dockingPoints['right'].child) {
                expression += this.dockingPoints['right'].child.getExpression(format);
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
        let box = this.boundingBox();

        this.p.fill(this.color).noStroke().strokeJoin(this.s.ROUND);

        // FIXME Consolidate this with the _drawBracketsInBox(Rect) function in Fn
        let m = Math.sqrt(Math.max(1, box.h / this.s.mBox_h));
        let a = 20 * m;
        let b = 21 * m;
        let c = Math.sqrt(4 * m + 1);
        // LHS
        this.p.beginShape();
        this.p.vertex(      box.x + b, -box.h/2 + m);
        this.p.bezierVertex(box.x + c, -box.h/2 + a,
                            box.x + c,  box.h/2 - a,
                            box.x + b,  box.h/2 - m);
        this.p.vertex(      box.x + a,  box.h/2);
        this.p.bezierVertex(box.x - c,  box.h/2 - a,
                            box.x - c, -box.h/2 + a,
                            box.x + a, -box.h/2);
        this.p.endShape();

        // RHS
        this.p.beginShape();
        this.p.vertex(      box.w/2 - b, -box.h/2 + m);
        this.p.bezierVertex(box.w/2 - c, -box.h/2 + a,
                            box.w/2 - c,  box.h/2 - a,
                            box.w/2 - b,  box.h/2 - m);
        this.p.vertex(      box.w/2 - a,  box.h/2);
        this.p.bezierVertex(box.w/2 + c,  box.h/2 - a,
                            box.w/2 + c, -box.h/2 + a,
                            box.w/2 - a, -box.h/2);
        this.p.endShape();


        this.p.strokeWeight(1);
    }

    /**
     * This widget's tight bounding box. This is used for the cursor hit testing.
     *
     * @returns {Rect} The bounding box
     */
    boundingBox(): Rect {
        let box = this.s.font_up.textBounds("()", 0, 0, this.scale * this.s.baseFontSize);

        let argBox = new Rect(0, 0, this.dockingPointSize, 0);
        if (this.dockingPoints["argument"] && this.dockingPoints["argument"].child) {
            argBox = this.dockingPoints["argument"].child.subtreeDockingPointsBoundingBox();
        }
        let width = box.w + argBox.w;
        let height = Math.max(box.h, argBox.h);

        return new Rect(-width/2, -height/2, width, height);
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

        if (this.dockingPoints["argument"]) {
            let dp = this.dockingPoints["argument"];
            if (dp.child) {
                let child = dp.child;
                child.position.x = this.boundingBox().x + child.leftBound + this.dockingPointSize;
                child.position.y = -child.dockingPoint.y;
            } else {
                dp.position.x = 0;
                dp.position.y = 0;
            }
        }

        let superscriptWidth = 0;
        if (this.dockingPoints["superscript"]) {
            let dp = this.dockingPoints["superscript"];
            if (dp.child) {
                let child = dp.child;
                child.position.x = thisBox.x + thisBox.w + child.leftBound;
                child.position.y = -(thisBox.h + child.subtreeBoundingBox().h)/2 + this.dockingPointSize;
                superscriptWidth = child.subtreeDockingPointsBoundingBox().w;
            } else {
                dp.position.x = (thisBox.w + this.dockingPointSize)/2;
                dp.position.y = -thisBox.h/2;
            }
        }

        let subscriptWidth = 0;
        if (this.dockingPoints["subscript"]) {
            let dp = this.dockingPoints["subscript"];
            if (dp.child) {
                let child = dp.child;
                child.position.x = thisBox.x + thisBox.w + child.leftBound;
                child.position.y = (thisBox.h + child.subtreeBoundingBox().h)/2;
                subscriptWidth = child.subtreeDockingPointsBoundingBox().w;
            } else {
                dp.position.x = (thisBox.w + this.dockingPointSize)/2;
                dp.position.y = thisBox.h/2;
            }
        }

        if (this.dockingPoints["right"]) {
            let dp = this.dockingPoints["right"];
            if (dp.child) {
                let child = dp.child;
                let sBoxWidth = Math.max(superscriptWidth, subscriptWidth);
                child.position.x = thisBox.x + thisBox.w + sBoxWidth + child.leftBound + (sBoxWidth > 0 ? 0 : this.dockingPointSize);
                child.position.y = -child.dockingPoint.y;
            } else {
                dp.position.x = Math.max(superscriptWidth, subscriptWidth) + thisBox.x + thisBox.w + this.dockingPointSize;
                dp.position.y = 0;
            }
        }
    }
}
