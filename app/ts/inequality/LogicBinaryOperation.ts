/*
Copyright 2019 Andrea Franceschini <andrea.franceschini@gmail.com>

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
import { DockingPoint } from "./DockingPoint";

/**
 * Boolean Logic Binary operations, such as ANDs and ORs.
 *
 * BE EXTRA CAREFUL with the minus sign: use "−" (U+2212), not just a dash.
 */
export
    class LogicBinaryOperation extends Widget {
    public s: any;
    protected operation: string;
    protected latexSymbol: string;
    protected mathmlSymbol: string;
    protected pythonSymbol: string;

    get typeAsString(): string {
        return "LogicBinaryOperation";
    }

    /**
     * There's a thing with the baseline and all that... this sort-of fixes it.
     *
     * @returns {p5.Vector} The position to which a Symbol is meant to be docked from.
     */
    get dockingPoint(): p5.Vector {
        return this.p.createVector(0, -this.scale*this.s.xBox_h/2);
    }

    // TODO: Add support for BinarySyntax
    constructor(p: any, s: any, operation: string) {
        super(p, s);
        this.s = s;
        this.operation = operation;
        switch(this.operation) {
          case 'and':
            this.latexSymbol = '\\land';
            this.pythonSymbol = '&';
            this.mathmlSymbol = '∧';
            break;
          case 'or':
            this.latexSymbol = '\\lor';
            this.pythonSymbol = '|';
            this.mathmlSymbol = '∨';
            break;
          default:
            this.latexSymbol = this.pythonSymbol = this.mathmlSymbol = this.operation;
            break;
        }

        this.docksTo = ['operator'];
    }

    /**
     * Generates all the docking points in one go and stores them in this.dockingPoints.
     * A Binary Operation has one docking point:
     *
      - _right_: Symbol
     */
    generateDockingPoints() {
        let box = this.boundingBox();
        this.dockingPoints["right"] = new DockingPoint(this, this.p.createVector(box.w/2 + this.s.mBox_w/4, -this.s.xBox_h/2), 1, ["symbol"], "right");
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
        let expression = " ";
        if (format == "latex") {
            expression += this.latexSymbol + " ";
            if (this.dockingPoints["right"].child != null) {
                expression += this.dockingPoints["right"].child.formatExpressionAs(format);
            }
        } else if (format == "python") {
            expression += this.pythonSymbol + " ";
            if (this.dockingPoints["right"].child != null) {
                expression += "" + this.dockingPoints["right"].child.formatExpressionAs(format);
            }
        } else if (format == "subscript") {
            expression = "";
            if (this.dockingPoints["right"].child != null) {
                expression += this.dockingPoints["right"].child.formatExpressionAs(format);
            }
        } else if (format == "mathml") {
            expression = '<mo>' + this.mathmlSymbol + "</mo>";
            if (this.dockingPoints["right"].child != null) {
                expression += this.dockingPoints["right"].child.formatExpressionAs(format);
            }
        }
        return expression;
    }

    properties(): Object {
        return {
            operation: this.operation
        };
    }

    token(): string {
        return '';
    }

    /** Paints the widget on the canvas. */
    _draw() {
        this.p.fill(this.color).strokeWeight(0).noStroke();

        this.p.textFont(this.s.font_up)
            .textSize(this.s.baseFontSize * 0.8 * this.scale)
            .textAlign(this.p.CENTER, this.p.BASELINE)
            .text(this.mathmlSymbol, 0, 0);
        this.p.strokeWeight(1);
    }

    /**
     * This widget's tight bounding box. This is used for the cursor hit testing.
     *
     * @returns {Rect} The bounding box
     */
    boundingBox(): Rect {
        let s = "+";
        let box = this.s.font_up.textBounds(s, 0, 0, this.scale*this.s.baseFontSize*0.8);
        return new Rect(-box.w/2, box.y, box.w, box.h);
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

        if (this.dockingPoints["right"]) {
            let dp = this.dockingPoints["right"];
            if (dp.child) {
                let child = dp.child;
                child.position.x = thisBox.x + thisBox.w + child.leftBound + dp.size/2;
                child.position.y = this.dockingPoint.y - child.dockingPoint.y;
            } else {
                dp.position.x = thisBox.x + thisBox.w + dp.size;
                dp.position.y = -this.scale*this.s.xBox_h/2;
            }
        }
    }
}
