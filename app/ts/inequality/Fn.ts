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
import { Relation } from "./Relation";
import { DockingPoint } from "./DockingPoint";
import { Brackets } from "./Brackets";

/** Functions. */
export
    class Fn extends Widget {

    protected s: any;
    protected name: string;
    protected custom: boolean;
    protected innerSuperscript: boolean;
    protected allowSubscript: boolean;
    protected latexSymbol: string;
    protected pythonSymbol: string;

    get typeAsString(): string {
        return "Fn";
    }

    /**
     * There's a thing with the baseline and all that... this sort-of fixes it.
     *
     * @returns {Vector} The position to which a Symbol is meant to be docked from.
     */
    get dockingPoint(): p5.Vector {
        return this.p.createVector(0, -this.scale*this.s.xBox_h/2);
    }

    constructor(p: any, s: any, name: string, custom: boolean, allowSubscript: boolean, innerSuperscript: boolean) {
        super(p, s);
        this.name = name;
        this.custom = custom;
        this.s = s;
        this.allowSubscript = allowSubscript;
        this.innerSuperscript = innerSuperscript;

        switch (name) {
            case "arccosec":
                this.latexSymbol = 'text{cosec}',
                this.pythonSymbol = this.name;
                break;
            case "sech":
                this.latexSymbol = 'text{sech}',
                this.pythonSymbol = this.name;
                break;
            case "arcsech":
                this.latexSymbol = "text{sech}",
                this.pythonSymbol = this.name;
                break;
            case "cosec":
                this.latexSymbol = 'text{cosec}',
                this.pythonSymbol = this.name;
                break;
            case "cosech":
                this.latexSymbol = 'text{cosech}',
                this.pythonSymbol = this.name;
                break;
            default:
                this.latexSymbol = this.name;
                this.pythonSymbol = this.name;
                break;
        }

        // Override docking points created in super constructor
        this.dockingPoints = {};
        this.generateDockingPoints();
        this.docksTo = ['symbol', 'operator', 'exponent', "operator_brackets", 'differential_argument'];
    }

    /**
     * Generates all the docking points in one go and stores them in this.dockingPoints.
     * A Function has four docking points, although some may be disabled.
     *
     * - _right_: Binary operation (addition, subtraction), Symbol (multiplication)
     * - _subscript_: Subscript, or base, for \log
     * - _superscript_: Exponent
     * - _argument_: Argument (duh?)
     */
    generateDockingPoints() {
        let box = this.s.font_up.textBounds(this.name || '', 0, 0, this.scale * this.s.baseFontSize);
        let bracketBox = this.s.font_up.textBounds('(', 0, 0, this.scale * this.s.baseFontSize);

        this.dockingPoints["argument"] = new DockingPoint(this, this.p.createVector(box.w/2 + bracketBox.w, -this.s.xBox_h/2), 1, ["symbol", "differential"], "argument");
        this.dockingPoints["right"] = new DockingPoint(this, this.p.createVector(box.w/2 + this.scale * this.s.mBox_w / 4, -this.s.xBox_h/2), 1, ["operator"], "right");

        if (this.allowSubscript) {
            this.dockingPoints["subscript"] = new DockingPoint(this, this.p.createVector(box.w/2, 0), 2/3, ["symbol"], "subscript");
        }
        if (this.innerSuperscript) {
            this.dockingPoints["superscript"] = new DockingPoint(this, this.p.createVector(box.w/2, -bracketBox.h), 2/3, ["symbol"], "superscript");
        } else {
            // This is where we would generate the 'outer' superscript docking point, should we ever need it.
            // If we ever do this, we'll need to change all the Math.max calls below.
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
        let expression = "";
        if (format == "latex") {
            if ('argument' in this.dockingPoints && this.dockingPoints['argument'].child) {
                let sub = '';
                if ('subscript' in this.dockingPoints && this.dockingPoints['subscript'].child) {
                    sub += '_{' + this.dockingPoints['subscript'].child.getExpression(format) + '}';
                }
                let sup = '';
                if ('superscript' in this.dockingPoints && this.dockingPoints['superscript'].child) {
                    sup += '^{' + this.dockingPoints['superscript'].child.getExpression(format) + '}';
                }

                let esc = this.custom ? "" : "\\";

                expression += esc + this.latexSymbol + sup + sub + '(' + this.dockingPoints['argument'].child.getExpression(format) + ')';
                if ('right' in this.dockingPoints && this.dockingPoints['right'].child) {
                    expression += this.dockingPoints['right'].child.getExpression(format);
                }
            }
        } else if (format == "python") {
            if ('argument' in this.dockingPoints && this.dockingPoints['argument'].child) {
                if (this.pythonSymbol == 'ln' || this.pythonSymbol == 'log') {
                    if ('subscript' in this.dockingPoints && this.dockingPoints['subscript'].child) {
                        // Logarithm with base
                        expression += this.pythonSymbol + '(' + this.dockingPoints['argument'].child.getExpression(format) + ', ' + this.dockingPoints['subscript'].child.getExpression(format) + ')';
                    } else if (this.pythonSymbol == 'log') {
                        expression += this.pythonSymbol + '(' + this.dockingPoints['argument'].child.getExpression(format) + ', 10)'; // Python assumes log is base e (i.e. ln) otherwise!
                    } else {
                        expression += this.pythonSymbol + '(' + this.dockingPoints['argument'].child.getExpression(format) + ')';
                    }
                } else {
                    if ('subscript' in this.dockingPoints && this.dockingPoints['subscript'].child) {
                        // Function with subscript
                        expression += this.pythonSymbol + '_' + this.dockingPoints['subscript'].child.getExpression(format) + '(' + this.dockingPoints['argument'].child.getExpression(format) + ')';
                    } else {
                        expression += this.pythonSymbol + '(' + this.dockingPoints['argument'].child.getExpression(format) + ')';
                    }
                }
                if ('superscript' in this.dockingPoints && this.dockingPoints['superscript'].child) {
                    let supExp = this.dockingPoints['superscript'].child.getExpression(format);
                    if (Number(supExp) == -1 && this.innerSuperscript) {
                        expression = 'arc' + expression;
                    } else {
                        expression += '**(' + this.dockingPoints['superscript'].child.getExpression(format) + ')';
                    }
                }
                if (this.dockingPoints["right"].child != null) {
                    if (this.dockingPoints["right"].child instanceof BinaryOperation || this.dockingPoints["right"].child instanceof Relation) {
                        expression += this.dockingPoints["right"].child.getExpression(format);
                    } else {
                        expression += " * " + this.dockingPoints["right"].child.getExpression(format);
                    }
                }
            }
        } else if (format == 'mathml') {
            if ('argument' in this.dockingPoints && this.dockingPoints['argument'].child) {
                let right = ('right' in this.dockingPoints && this.dockingPoints['right'].child) ? this.dockingPoints['right'].child.getExpression(format) : '';
                if ('subscript' in this.dockingPoints && this.dockingPoints['subscript'].child && 'superscript' in this.dockingPoints && this.dockingPoints['superscript'].child) {
                    expression += '<mrow><msubsup><mi>' + this.name + '</mi><mrow>' + this.dockingPoints['subscript'].child.getExpression(format) + '</mrow><mrow>' + this.dockingPoints['superscript'].child.getExpression(format) + '</mrow></msubsup><mfenced open="(" close=")"><mrow>' + this.dockingPoints['argument'].child.getExpression(format) + '</mrow></mfenced>' + right + '</mrow>';
                } else if ('subscript' in this.dockingPoints && this.dockingPoints['subscript'].child) {
                    expression += '<mrow><msub><mi>' + this.name + '</mi><mrow>' + this.dockingPoints['subscript'].child.getExpression(format) + '</mrow></msub><mfenced open="(" close=")"><mrow>' + this.dockingPoints['argument'].child.getExpression(format) + '</mrow></mfenced>' + right + '</mrow>';
                } else if ('superscript' in this.dockingPoints && this.dockingPoints['superscript'].child) {
                    expression += '<mrow><msup><mi>' + this.name + '</mi><mrow>' + this.dockingPoints['superscript'].child.getExpression(format) + '</mrow></msup><mfenced open="(" close=")"><mrow>' + this.dockingPoints['argument'].child.getExpression(format) + '</mrow></mfenced>' + right + '</mrow>';
                } else {
                    expression += '<mrow><mi>' + this.name + '</mi><mfenced open="(" close=")"><mrow>' + this.dockingPoints['argument'].child.getExpression(format) + '</mrow></mfenced>' + right + '</mrow>';
                }
            }
        }
        return expression;
    }

    properties(): Object {
        return {
            name: this.name,
            custom: this.custom,
            innerSuperscript: this.innerSuperscript,
            allowSubscript: this.allowSubscript,
        };
    }

    token() {
        if ("superscript" in this.dockingPoints && this.dockingPoints["superscript"].child && Number(this.dockingPoints["superscript"].child.getExpression("python")) == -1 && this.innerSuperscript) {
            return "arc" + this.name + "()";
        } else {
            return this.name + "()";
        }
    }

    /** Paints the widget on the canvas. */
    _draw() {
        this.p.fill(this.color).strokeWeight(0).noStroke();
        this.p.textFont(this.custom ? this.s.font_it : this.s.font_up)
              .textSize(this.s.baseFontSize * this.scale)
              .textAlign(this.p.RIGHT, this.p.BASELINE);
        this.p.text(this.name, 0, 0);

        this._drawBracketsInBox(this._bracketsBox);
    }

    _drawBracketsInBox(box: Rect) {
        // FIXME Consolidate this with the _drawBracketsInBox(Rect) function in Brackets
        this.p.fill(this.color).noStroke().strokeJoin(this.s.ROUND);

        // FIXME Scale the hardcoded numbers
        // LHS
        this.p.beginShape();
        this.p.vertex(       box.x         + 21*this.scale,      box.y         +    this.scale );
        this.p.bezierVertex( box.x         +  4*this.scale,      box.y         + 20*this.scale  ,
                             box.x         +  4*this.scale,      box.y + box.h - 20*this.scale  ,
                             box.x         + 21*this.scale,      box.y + box.h -    this.scale );
        this.p.vertex(       box.x         + 20*this.scale,      box.y + box.h                 );
        this.p.bezierVertex( box.x         -  4*this.scale,      box.y + box.h - 20*this.scale  ,
                             box.x         -  4*this.scale,      box.y         + 20*this.scale  ,
                             box.x         + 20*this.scale,      box.y                         );
        this.p.endShape();

        // box.w = 42;

        // RHS
        this.p.beginShape();
        this.p.vertex(       box.x + box.w - 21*this.scale,      box.y         +    this.scale );
        this.p.bezierVertex( box.x + box.w -  4*this.scale,      box.y         + 20*this.scale  ,
                             box.x + box.w -  4*this.scale,      box.y + box.h - 20*this.scale  ,
                             box.x + box.w - 21*this.scale,      box.y + box.h -    this.scale );
        this.p.vertex(       box.x + box.w - 20*this.scale,      box.y + box.h                 );
        this.p.bezierVertex( box.x + box.w +  4*this.scale,      box.y + box.h - 20*this.scale  ,
                             box.x + box.w +  4*this.scale,      box.y         + 20*this.scale  ,
                             box.x + box.w - 20*this.scale,      box.y                         );
        this.p.endShape();
    }

    /**
     * This widget's tight bounding box. This is used for the cursor hit testing.
     *
     * @returns {Rect} The bounding box
     */
    boundingBox(): Rect {
        let argumentBox = this._argumentBox;
        let superscriptBox = this._superscriptBox;
        let subscriptBox = this._subscriptBox;

        let width = this._nameBox.w + Math.max(superscriptBox.w, subscriptBox.w) + 40*this.scale + argumentBox.w + this.dockingPointSize;
        let height = Math.max(this._baseBox.h, argumentBox.h);

        return new Rect(-this._nameBox.w, -height/2 + this.dockingPoint.y, width, height);
    }

    get _baseBox(): Rect {
        return Rect.fromObject(this.s.font_up.textBounds(this.name + '()', 0, 0, this.scale * this.s.baseFontSize));
    }

    get _nameBox(): Rect {
        return Rect.fromObject(this.s.font_up.textBounds(this.name, 0, 0, this.scale * this.s.baseFontSize));
    }

    get _argumentBox(): Rect {
        let argumentBox = new Rect(0, 0, this.dockingPointSize, this.dockingPointSize);
        if (this.dockingPoints["argument"] && this.dockingPoints["argument"].child) {
            argumentBox = this.dockingPoints["argument"].child.subtreeDockingPointsBoundingBox();
        }
        return argumentBox;
    }

    get _bracketsBox(): Rect {
        let argumentBox = this._argumentBox;
        let superscriptBox = this._superscriptBox;
        let subscriptBox = this._subscriptBox;

        // See Fn::boundingBox()
        // The Math.min() here is to limit how much the brackets expand vertically.
        let height = Math.min(Math.max(this._baseBox.h, argumentBox.h), this.s.mBox_h*3);

        let bracketsX = Math.max(superscriptBox.w, subscriptBox.w);
        let bracketsW = 40*this.scale + argumentBox.w + this.dockingPointSize;

        return new Rect(bracketsX, this.boundingBox().y + this.boundingBox().h/2 - height/2, bracketsW, height);
    }

    get _superscriptBox(): Rect {
        let superscriptBox: Rect = null;
        try {
            superscriptBox = this.dockingPoints["superscript"].child.subtreeDockingPointsBoundingBox();
        } catch (e) {
            superscriptBox = new Rect(0, 0, this.dockingPointSize, this.dockingPointSize);
        }
        return superscriptBox;
    }

    get _subscriptBox(): Rect {
        let subscriptBox: Rect = null;
        try {
            subscriptBox = this.dockingPoints["subscript"].child.subtreeDockingPointsBoundingBox();
        } catch (e) {
            subscriptBox = new Rect(0, 0, this.dockingPointSize, this.dockingPointSize);
        }
        return subscriptBox;
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

        if (this.dockingPoints["superscript"]) {
            let dp = this.dockingPoints["superscript"];
            if (dp.child) {
                let child = dp.child;
                child.position.x = child.leftBound;
                child.position.y = -this.scale*this.s.xBox_h - (child.subtreeDockingPointsBoundingBox().y + child.subtreeDockingPointsBoundingBox().h);
            } else {
                dp.position.x = thisBox.x + this._nameBox.w + this.dockingPointSize/2;
                dp.position.y = -this.scale * this.s.mBox_h;
            }
        }

        if (this.dockingPoints["subscript"]) {
            let dp = this.dockingPoints["subscript"];
            if (dp.child) {
                let child = dp.child;
                child.position.x = child.leftBound;
                child.position.y = child.topBound;
            } else {
                dp.position.x = thisBox.x + this._nameBox.w + this.dockingPointSize/2;
                dp.position.y = 0;
            }
        }

        if (this.dockingPoints["argument"]) {
            let dp = this.dockingPoints["argument"];
            if (dp.child) {
                let child = dp.child;
                child.position.x = this._bracketsBox.x + child.leftBound + this.dockingPointSize;
                child.position.y = this.dockingPoint.y - child.dockingPoint.y;
            } else {
                dp.position.x = this._bracketsBox.center.x;
                dp.position.y = this.dockingPoint.y;
            }
        }

        if (this.dockingPoints["right"]) {
            let dp = this.dockingPoints["right"];
            if (dp.child) {
                let child = dp.child;
                child.position.x = this._bracketsBox.x + this._bracketsBox.w + child.leftBound + this.dockingPointSize;
                child.position.y = this.dockingPoint.y - child.dockingPoint.y;
            } else {
                dp.position.x = this._bracketsBox.x + this._bracketsBox.w + this.dockingPointSize;
                dp.position.y = this.dockingPoint.y;
            }
        }
    }
}
