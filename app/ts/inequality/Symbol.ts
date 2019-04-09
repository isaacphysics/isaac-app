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
import { DockingPoint } from "./DockingPoint";
import { Relation } from "./Relation";
import { Num } from "./Num";
import { LogicBinaryOperation } from "./LogicBinaryOperation";

/** A class for representing variables and constants (aka, letters). */
export
    class Symbol extends Widget {

    public s: any;
    protected letter: string;
    protected modifier: string;

    get typeAsString(): string {
        return "Symbol";
    }

    /**
     * There's a thing with the baseline and all that... this sort-of fixes it.
     *
     * @returns {p5.Vector} The position to which a Symbol is meant to be docked from.
     */
    get dockingPoint(): p5.Vector {
        return this.p.createVector(0, -this.scale*this.s.xBox_h/2);
    }

    // FIXME Executive decision: this goes for now because otherwise derivative
    //       text entry breaks royally. We may want to revisit this later, but
    //       I think it's not necessary with the new usability improvements to
    //       the editor. (af599)
    //
    // get dockingPoints(): { [key: string]: DockingPoint; } {
    //     // BIG FAT FIXME: This needs to climb up the family tree to see if any ancestor is a Differential, otherwise
    //     // stuff like d(xy^2) are allowed, where y is squared, not d nor x.
    //     if (this.sonOfADifferential) {
    //         let predicate = ["superscript"];
    //         if (this.dockedTo != "right") {
    //             predicate.push("right");
    //         }
    //         return _.omit(this._dockingPoints, predicate);
    //     } else {
    //         return this._dockingPoints;
    //     }
    // }
    
    /**
     *  Checks if this symbol is the direct child of a differential.
     * 
     * @returns {boolean} True if this symbol is the direct child of a differential but not multiplied to it.
     */
    get sonOfADifferential(): boolean {
        let p = this.parentWidget;
        return p && p.typeAsString == 'Differential' && this != p.dockingPoints["right"].child;
    }

    public constructor(p: any, s: any, letter: string, modifier = "") {
        super(p, s);
        this.letter = letter;
        this.s = s;
        this.modifier = modifier;
        this.docksTo = ['relation', 'exponent', 'symbol_subscript', 'symbol', 'differential_argument'];
        if (this.s.editorMode != 'logic') {
            this.docksTo.push('operator');
            this.docksTo.push('operator_brackets');
        }
    }

    /**
     * Prevents Symbols from being detached from Differentials when the user is not an admin/editor.
     * 
     * @returns {boolean} True if this symbol is detachable from its parent, false otherwise.
     */
    get isDetachable(): boolean {
        const userIsPrivileged = this.s.isUserPrivileged();
        return document.location.pathname == '/equality' || userIsPrivileged || !this.sonOfADifferential;
    }

	/**
	 * Generates all the docking points in one go and stores them in this.dockingPoints.
	 * A Symbol has three docking points:
	 *
	 * - _right_: Binary operation (addition, subtraction), Symbol (multiplication)
	 * - _superscript_: Exponent (unless it's the argument of a Differential (heh...))
	 * - _subscript_: Subscript (duh?)
	 */
    generateDockingPoints() {
        let box = this.boundingBox();
        let descent = this.position.y - (box.y + box.h); // TODO Check that `descent` is necessary...

        this.dockingPoints["right"] = new DockingPoint(this, this.p.createVector(box.w/2 + this.s.mBox_w/4, -this.s.xBox_h/2), 1, ["operator"], "right");
        if (this.s.editorMode != 'logic') {
            this.dockingPoints["superscript"] = new DockingPoint(this, this.p.createVector(box.w/2 + this.scale * 20, -this.scale * this.s.mBox_h), 2/3, ["exponent"], "superscript");
            this.dockingPoints["subscript"] = new DockingPoint(this, this.p.createVector(box.w/2 + this.scale * 20, descent), 2/3, ["symbol_subscript"], "subscript");
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
    formatExpressionAs(format: string): string {
        let expression = "";
        if (format == "latex") {
            expression = this.letter;
            if(this.modifier == "prime") {
                expression += "'"
            }
            if (this.dockingPoints["superscript"] && this.dockingPoints["superscript"].child != null) {
                expression += "^{" + this.dockingPoints["superscript"].child.formatExpressionAs(format) + "}";
            }
            if (this.dockingPoints["subscript"] && this.dockingPoints["subscript"].child != null) {
                expression += "_{" + this.dockingPoints["subscript"].child.formatExpressionAs(format) + "}";
            }
            if (this.dockingPoints["right"] && this.dockingPoints["right"].child != null) {
                if (this.dockingPoints["right"].child instanceof BinaryOperation) {
                    expression += this.dockingPoints["right"].child.formatExpressionAs(format);
                } else {
                    // WARNING This assumes it's a Symbol, hence produces a multiplication
                    expression += this.dockingPoints["right"].child.formatExpressionAs(format);
                }
            }
        } else if (format == "python") {
            expression = "" + this.letter;
            if(this.modifier == "prime") {
                expression += "_prime"
            }
            if (this.dockingPoints["subscript"] && this.dockingPoints["subscript"].child != null) {
                expression += "_" + this.dockingPoints["subscript"].child.formatExpressionAs("subscript");
            }
            if (this.dockingPoints["superscript"] && this.dockingPoints["superscript"].child != null) {
                expression += "**(" + this.dockingPoints["superscript"].child.formatExpressionAs(format) + ")";
            }
            if (this.dockingPoints["right"] && this.dockingPoints["right"].child != null) {
                if (this.dockingPoints["right"].child instanceof BinaryOperation ||
                    this.dockingPoints["right"].child instanceof Relation ||
                    this.dockingPoints["right"].child instanceof LogicBinaryOperation) {
                    expression += this.dockingPoints["right"].child.formatExpressionAs(format);
                } else if (this.dockingPoints["right"] && this.dockingPoints["right"].child instanceof Num && (<Num>this.dockingPoints["right"].child).isNegative()) {
                    expression += this.dockingPoints["right"].child.formatExpressionAs(format);
                } else {
                    // WARNING This assumes it's a Symbol by default, hence produces a multiplication (with a star)
                    expression += "*" + this.dockingPoints["right"].child.formatExpressionAs(format);
                }
            }
        } else if (format == "subscript") {
            expression = "" + this.letter;
            if(this.modifier == "prime") {
                expression += "_prime"
            }
            if (this.dockingPoints["subscript"] && this.dockingPoints["subscript"].child != null) {
                expression += this.dockingPoints["subscript"].child.formatExpressionAs(format);
            }
            if (this.dockingPoints["superscript"] && this.dockingPoints["superscript"].child != null) {
                expression += this.dockingPoints["superscript"].child.formatExpressionAs(format);
            }
            if (this.dockingPoints["right"] && this.dockingPoints["right"].child != null) {
                expression += this.dockingPoints["right"].child.formatExpressionAs(format);
            }
        } else if (format == "mathml") {
            expression = '';
            let l = this.letter;
            if(this.modifier == "prime") {
                l += "_prime"
            }
            if (this.dockingPoints['subscript'] && this.dockingPoints['subscript'].child == null && this.dockingPoints["superscript"] && this.dockingPoints['superscript'].child == null) {
                expression += '<mi>' + l + '</mi>';

            } else if (this.dockingPoints['subscript'] && this.dockingPoints['subscript'].child != null && this.dockingPoints["superscript"] && this.dockingPoints['superscript'].child == null) {
                expression += '<msub><mi>' + l + '</mi><mrow>' + this.dockingPoints['subscript'].child.formatExpressionAs(format) + '</mrow></msub>';

            } else if (this.dockingPoints['subscript'] && this.dockingPoints['subscript'].child == null && this.dockingPoints["superscript"] && this.dockingPoints['superscript'].child != null) {
                expression += '<msup><mi>' + l + '</mi><mrow>' + this.dockingPoints['superscript'].child.formatExpressionAs(format) + '</mrow></msup>';

            } else if (this.dockingPoints['subscript'] && this.dockingPoints['subscript'].child != null && this.dockingPoints["superscript"] && this.dockingPoints['superscript'].child != null) {
                expression += '<msubsup><mi>' + l + '</mi><mrow>' + this.dockingPoints['subscript'].child.formatExpressionAs(format) + '</mrow><mrow>' + this.dockingPoints['superscript'].child.formatExpressionAs(format) + '</mrow></msubsup>';
            }

            if (this.dockingPoints["right"] && this.dockingPoints['right'].child != null) {
                expression += this.dockingPoints['right'].child.formatExpressionAs('mathml');
            }
        }
        return expression;
    }

    properties(): Object {
        return {
            letter: this.letter,
            modifier: this.modifier
        };
    }

    token(): string {
        let e = this.letter;
        if(this.modifier == "prime") {
            e += "_prime"
        }
        if (this.dockingPoints['subscript'] && this.dockingPoints['subscript'].child) {
            e += '_' + this.dockingPoints['subscript'].child.formatExpressionAs('subscript');
        }
        return e;
    }

    /** Paints the widget on the canvas. */
    _draw() {
        this.p.fill(this.color).strokeWeight(0).noStroke();

        this.p.textFont(this.s.font_it)
            .textSize(this.s.baseFontSize * this.scale)
            .textAlign(this.p.CENTER, this.p.BASELINE)
            .text(this.letter + (this.modifier == "prime" ? "'" : ""), 0, 0);
        this.p.strokeWeight(1);
    }

	/**
	 * This widget's tight bounding box. This is used for the cursor hit testing.
	 *
	 * @returns {Rect} The bounding box
	 */
    boundingBox(): Rect {
        let text = (this.letter || "x") + (this.modifier == "prime" ? "''" : "");
        let box = this.s.font_it.textBounds(text, 0, 0, this.scale * this.s.baseFontSize);
        return new Rect(-box.w/2 - this.s.xBox.w/4, box.y, box.w, box.h);
    }

	/**
	 * Internal companion method to shakeIt(). This is the one that actually does the work, and the one that should be
	 * overridden.
	 *
	 * @private
	 */
    _shakeIt() {
        this._shakeItDown();

        let thisBox = this.boundingBox();

        let superscriptWidth = 0;
        if (this.dockingPoints["superscript"]) {
            let dp = this.dockingPoints["superscript"];
            if (dp.child) {
                let child = dp.child;
                child.position.x = thisBox.x + thisBox.w + child.leftBound + child.scale*dp.size/2;
                child.position.y = -this.scale * this.s.xBox_h - (child.subtreeDockingPointsBoundingBox.y + child.subtreeDockingPointsBoundingBox.h);
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
                child.position.x = thisBox.x + thisBox.w + child.leftBound + child.scale*dp.size/3; // 3 is a prettyfication factor to make the subscript follow the letter's slant.
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
                dp.position.y = -this.scale*this.s.xBox_h/2;
            }
        }
    }

    /**
     * @returns {Widget[]} A flat array of the children of this widget, as widget objects
     */
    get children(): Array<Widget> {
        return _.compact(_.map(_.values(_.omit(this.dockingPoints, "subscript")), "child"));
    }
}
