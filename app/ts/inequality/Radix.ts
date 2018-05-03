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
import { Symbol } from "./Symbol";
import { BinaryOperation } from "./BinaryOperation";
import { Relation } from "./Relation";
import { DockingPoint } from "./DockingPoint";
import { Brackets } from "./Brackets";

/** Radix. Or, as they say, the _nth_ principal root of its argument. */
export
    class Radix extends Widget {

    protected s: any;

    private baseHeight: number;

    get typeAsString(): string {
        return "Radix";
    }

    /**
     * There's a thing with the baseline and all that... this sort-of fixes it.
     *
     * @returns {Vector} The position to which a Symbol is meant to be docked from.
     */
    get dockingPoint(): p5.Vector {
        let box = this.s.font_it.textBounds("x", 0, 0, this.scale * this.s.baseFontSize);
        let p = this.p.createVector(0, - box.h / 2);
        return p;
    }

    constructor(p: any, s: any) {
        super(p, s);
        this.s = s;

        this.docksTo = ['symbol', 'operator', 'exponent', 'operator_brackets', 'relation', 'differential_argument'];
        this.baseHeight = this.s.font_up.textBounds("\u221A", 0, 0, this.scale * this.s.baseFontSize).h;
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
        let pBox = this.s.font_it.textBounds("(", 0, 0, this.scale * this.s.baseFontSize);

        this.dockingPoints["argument"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.scale * this.s.xBox.w / 2, -this.s.xBox.h / 2), 1, ["symbol"], "argument");
        this.dockingPoints["right"] = new DockingPoint(this, this.p.createVector(box.w + this.scale * this.s.xBox.w / 2, -this.s.xBox.h / 2), 1, ["operator"], "right");
        this.dockingPoints["superscript"] = new DockingPoint(this, this.p.createVector(box.w + this.scale * this.s.xBox.w / 2, -(box.h + descent + this.scale * 20)), 2/3, ["exponent"], "superscript");
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
        if (format == "latex") {
            if ('argument' in this.dockingPoints && this.dockingPoints['argument'].child) {
                expression += '\\sqrt{' + this.dockingPoints['argument'].child.getExpression(format) + '}';
            }
            if ('superscript' in this.dockingPoints && this.dockingPoints['superscript'].child) {
                expression += '^{' + this.dockingPoints['superscript'].child.getExpression(format) + '}';
            }
            if ('right' in this.dockingPoints && this.dockingPoints['right'].child) {
                expression += this.dockingPoints['right'].child.getExpression(format);
            }
        } else if (format == "python") {
            if ('argument' in this.dockingPoints && this.dockingPoints['argument'].child) {
                expression += 'sqrt(' + this.dockingPoints['argument'].child.getExpression(format) + ')';
            }
            if ('superscript' in this.dockingPoints && this.dockingPoints['superscript'].child) {
                expression += '**(' + this.dockingPoints['superscript'].child.getExpression(format) + ')';
            }
            if (this.dockingPoints["right"].child != null) {
                if (this.dockingPoints["right"].child instanceof BinaryOperation || this.dockingPoints["right"].child instanceof Relation) {
                    expression += this.dockingPoints["right"].child.getExpression(format);
                } else {
                    expression += " * " + this.dockingPoints["right"].child.getExpression(format);
                }
            }
        } else if (format == "subscript") {
            expression += "{SQRT}";
        } else if (format == "mathml") {
            expression = '';
            // TODO Include indexes when they will be implemented
            if ('argument' in this.dockingPoints && this.dockingPoints['argument'].child) {
                let sqrt = '<msqrt>' + this.dockingPoints['argument'].child.getExpression(format) + '</msqrt>';
                if ('superscript' in this.dockingPoints && this.dockingPoints['superscript'].child) {
                    expression += '<msup>' + sqrt + '<mrow>' + this.dockingPoints['superscript'].child.getExpression(format) + '</mrow></msup>';
                } else {
                    expression += sqrt;
                }
            }
            if (this.dockingPoints['right'].child != null) {
                expression += this.dockingPoints['right'].child.getExpression('mathml');
            }
        }
        return expression;
    }

    properties(): Object {
        return null;
    }

    token() {
        return '';//'sqrt';
    }

    /** Paints the widget on the canvas. */
    _draw() {
        let b = new Rect(this.boundingBox().x, this.boundingBox().y, this._radixCharacterBox.w, this.boundingBox().h);

        this.p.fill(this.color).noStroke();
        this.p.beginShape();
        this.p.vertex(
            b.x,                            b.y+b.h-this.s.xBox.h*0.8);
        this.p.bezierVertex(
            b.x+b.w*(1/6),                  b.y+b.h-this.s.xBox.h-this.scale*5,
            b.x+b.w*(0.8/6),                b.y+b.h-this.s.xBox.h-this.scale*5,
            b.x+b.w*(3/6),                  b.y+b.h);
        this.p.vertex(
            b.x+b.w+this.scale*2,           b.y+this.scale*4);
        this.p.vertex(
            b.x+b.w+this._argumentBox.w,    b.y+this.scale*4);
        this.p.vertex(
            b.x+b.w+this._argumentBox.w,    b.y);
        this.p.vertex(
            b.x+b.w,                        b.y);
        this.p.vertex(
            b.x+b.w-this.scale*1,           b.y);
        this.p.vertex(
            b.x+b.w*(3/6),                  b.y+b.h-this.scale*12);
        this.p.vertex(
            b.x+b.w*(1/6)+this.scale*2,     b.y+b.h-this.s.xBox.h-this.scale*10);
        this.p.vertex(
            b.x-this.scale*2,               b.y+b.h-this.s.xBox.h*0.8-this.scale*2);
        this.p.endShape();
    }

    /**
     * This widget's tight bounding box. This is used for the cursor hit testing.
     *
     * @returns {Rect} The bounding box
     */
    boundingBox(): Rect {
        let width = this._radixCharacterBox.w + this._argumentBox.w + this.s.xBox.w/2;
        let height = Math.max(this._radixCharacterBox.h, this._argumentBox.h);
        return new Rect(-this._radixCharacterBox.w, -height/2 + this.dockingPoint.y, width, height);
    }

    get _radixCharacterBox(): Rect {
        return Rect.fromObject(this.s.font_up.textBounds("\u221A", 0, 0, this.scale * this.s.baseFontSize));
    }

    get _argumentBox(): Rect {
        let argumentBox: Rect = null;
        try {
            argumentBox = this.dockingPoints["argument"].child.subtreeDockingPointsBoundingBox();
        } catch (e) {
            argumentBox = new Rect(0, 0, this.dockingPointSize, this.dockingPointSize);
        }
        return argumentBox;
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
                // Half the x-box width is a nice beautification addition, but requires expanding the bounding box.
                child.position.x = child.leftBound + this.s.xBox.w/2;
                child.position.y = this.dockingPoint.y - child.dockingPoint.y + child.topBound - this._argumentBox.h/2;
            } else {
                dp.position.x = this._argumentBox.center.x;
                dp.position.y = this.dockingPoint.y;
            }
        }

        let superscriptWidth = this.dockingPointSize;
        if (this.dockingPoints["superscript"]) {
            let dp = this.dockingPoints["superscript"];
            if (dp.child) {
                let child = dp.child;
                child.position.x = this._argumentBox.w + child.leftBound + this.dockingPointSize / 2;
                child.position.y = this.boundingBox().y - child.dockingPoint.y - (child.subtreeDockingPointsBoundingBox().h+child.subtreeDockingPointsBoundingBox().y);
                superscriptWidth = Math.max(this.dockingPointSize, child.subtreeDockingPointsBoundingBox().w);
            } else {
                dp.position.x = this.boundingBox().x + this.boundingBox().w + this.dockingPointSize;
                dp.position.y = this.boundingBox().y;
            }
        }

        if (this.dockingPoints["right"]) {
            let dp = this.dockingPoints["right"];
            if (dp.child) {
                let child = dp.child;
                child.position.x = this.boundingBox().x + this.boundingBox().w + superscriptWidth + child.leftBound;
                child.position.y = this.dockingPoint.y - child.dockingPoint.y;
            } else {
                dp.position.x = this.boundingBox().x + this.boundingBox().w + superscriptWidth + this.dockingPointSize;
                dp.position.y = (-this.scale * this.s.xBox.h / 2);
            }
        }

    }
}
