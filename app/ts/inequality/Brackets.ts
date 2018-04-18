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

        this.dockingPoints["argument"] = new DockingPoint(this, this.p.createVector(0, -this.s.xBox.h / 2), 1, ["symbol", "differential"], "argument");
        this.dockingPoints["right"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.scale * this.s.mBox.w / 4 + this.scale * 20, -this.s.xBox.h / 2), 1, ["operator_brackets"], "right");
        this.dockingPoints["superscript"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.scale * 20, -(box.h + descent + this.scale * 20)), 2/3, ["exponent"], "superscript");
        if (this.mode == 'chemistry') {
            this.dockingPoints["subscript"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.scale * 20, -(box.h + descent + this.scale * 20)), 2/3, ["subscript"], "subscript");
        } else {
            this.dockingPoints["subscript"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.scale * 20, -(box.h + descent + this.scale * 20)), 2/3, ["subscript_maths"], "subscript");
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

        this.p.fill(this.color).strokeWeight(0).noStroke();
        this.p.textFont(this.s.font_up)
            .textSize(this.s.baseFontSize * this.scale)
            .textAlign(this.p.LEFT, this.p.CENTER);
        this.p.text(this.glyph['lhs'], box.x, box.y + box.h/2);
        this.p.textFont(this.s.font_up)
            .textSize(this.s.baseFontSize * this.scale)
            .textAlign(this.p.RIGHT, this.p.CENTER);
        this.p.text(this.glyph['rhs'], box.x+box.w, box.y + box.h/2);
        // let argWidth = this.s.xBox.w;
        // let argHeight = this.s.xBox.h;
        // if (this.dockingPoints['argument'].child) {
        //     let subtreeBB = this.dockingPoints['argument'].child.subtreeBoundingBox();
        //     argWidth = subtreeBB.w;
        //     argHeight = subtreeBB.h;
        // }
        // this.p.push();
        // this.p.scale(1, 1 + ((argHeight / this.s.xBox.h) - 1) / 2);
        //
        // this.p.fill(this.color).strokeWeight(0).noStroke();
        //
        // this.p.textFont(this.s.font_up)
        //     .textSize(this.s.baseFontSize * this.scale)
        //     .textAlign(this.p.RIGHT, this.p.CENTER);
        //
        // this.p.text(this.glyph['lhs'], -argWidth / 2, -this.s.xBox.h / 4);
        //
        // this.p.textFont(this.s.font_up)
        //     .textSize(this.s.baseFontSize * this.scale)
        //     .textAlign(this.p.LEFT, this.p.CENTER);
        // this.p.text(this.glyph['rhs'], argWidth / 2 + this.scale * 40, -this.s.xBox.h / 4); // FIXME This 40 is hard-coded
        // this.p.pop();
        this.p.strokeWeight(1);
    }

    /**
     * This widget's tight bounding box. This is used for the cursor hit testing.
     *
     * @returns {Rect} The bounding box
     */
    boundingBox(): Rect {
        let box = this.s.font_up.textBounds("()", 0, 1000, this.scale * this.s.baseFontSize);

        let argBox = new Rect(0, 0, this.dockingPointSize, 0);
        let flag = 1;
        if (this.dockingPoints["argument"] && this.dockingPoints["argument"].child) {
            argBox = this.dockingPoints["argument"].child.subtreeDockingPointsBoundingBox();
            flag = 2;
        }
        // FIXME thinner boxes than m-boxes don't work as well as m-boxes.
        let width = flag * box.w + argBox.w;
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

        if (this.dockingPoints["argument"] && this.dockingPoints["argument"].child) {
            let child = this.dockingPoints["argument"].child;
            let sdpBox = child.subtreeDockingPointsBoundingBox();
            this.dockingPoints["argument"].child.position.x = -sdpBox.w/2;
            this.dockingPoints["argument"].child.position.y = -child.dockingPoint.y;
        } else {
            this.dockingPoints["argument"].position.x = 0;
            this.dockingPoints["argument"].position.y = 0;
        }

    }
}
