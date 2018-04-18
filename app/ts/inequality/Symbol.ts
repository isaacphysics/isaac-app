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
import { Brackets } from "./Brackets";
import { StateSymbol } from "./StateSymbol";


/** A class for representing variables and constants (aka, letters). */
export
    class Symbol extends Widget {

    protected s: any;
    protected letter: string;
    protected modifier: string;

    get typeAsString(): string {
        return "Symbol";
    }

    /**
     * There's a thing with the baseline and all that... this sort-of fixes it.
     *
     * @returns {Vector} The position to which a Symbol is meant to be docked from.
     */
    get dockingPoint(): p5.Vector {
        let box = this.s.font_it.textBounds("x", 0, 1000, this.scale * this.s.baseFontSize);
        return this.p.createVector(0, - box.h / 2);
    }

    get dockingPoints(): { [key: string]: DockingPoint; } {
        // BIG FAT FIXME: This needs to climb up the family tree to see if any ancestor is a Differential, otherwise
        // stuff like d(xy^2) are allowed, where y is squared, not d nor x.
        if (this.sonOfADifferential) {
            let predicate = ["superscript"];
            if (this.dockedTo != "right") {
                predicate.push("right");
            }
            return _.omit(this._dockingPoints, predicate);
        } else {
            return this._dockingPoints;
        }
    }

    public constructor(p: any, s: any, letter: string, modifier = "") {
        super(p, s);
        this.letter = letter;
        this.s = s;
        this.modifier = modifier;
        this.docksTo = ['relation', 'operator', 'exponent', 'symbol_subscript', 'symbol', 'operator_brackets', 'differential_argument'];
    }

    /**
     * Prevents Symbols from being detached from Differentials when the user is not an admin/editor.
     */
    get isDetachable() {
        const userIsPrivileged = _.includes(['ADMIN', 'CONTENT_EDITOR', 'EVENT_MANAGER'], this.s.scope.user.role);
        return document.location.pathname == '/equality' || userIsPrivileged || !this.sonOfADifferential;
    }

    /**
     *  Checks if this symbol is the direct child of a differential.
     */
    get sonOfADifferential() {
        let p = this.parentWidget;
        return p && p.typeAsString == 'Differential' && this != p.dockingPoints["right"].child;
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

        this.dockingPoints["right"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.s.mBox.w / 4, -this.s.xBox.h / 2), 1, ["operator"], "right");
        this.dockingPoints["superscript"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.scale * 20, -this.scale * this.s.mBox.h), 2/3, ["exponent"], "superscript");
        this.dockingPoints["subscript"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.scale * 20, descent), 2/3, ["symbol_subscript"], "subscript");
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
            expression = this.letter;
            if(this.modifier == "prime") {
                expression += "'"
            }
            if (!this.sonOfADifferential && this.dockingPoints["superscript"] && this.dockingPoints["superscript"].child != null) {
                expression += "^{" + this.dockingPoints["superscript"].child.getExpression(format) + "}";
            }
            if (this.dockingPoints["subscript"].child != null) {
                expression += "_{" + this.dockingPoints["subscript"].child.getExpression(format) + "}";
            }
            if (this.dockingPoints["right"] && this.dockingPoints["right"].child != null) {
                if (this.dockingPoints["right"].child instanceof BinaryOperation) {
                    expression += this.dockingPoints["right"].child.getExpression(format);
                } else {
                    // WARNING This assumes it's a Symbol, hence produces a multiplication
                    expression += this.dockingPoints["right"].child.getExpression(format);
                }
            }
        } else if (format == "python") {
            expression = "" + this.letter;
            if(this.modifier == "prime") {
                expression += "_prime"
            }
            if (this.dockingPoints["subscript"].child != null) {
                expression += "_" + this.dockingPoints["subscript"].child.getExpression("subscript");
            }
            if (!this.sonOfADifferential && this.dockingPoints["superscript"] && this.dockingPoints["superscript"].child != null) {
                expression += "**(" + this.dockingPoints["superscript"].child.getExpression(format) + ")";
            }
            if (this.dockingPoints["right"] && this.dockingPoints["right"].child != null) {
                if (this.dockingPoints["right"].child instanceof BinaryOperation ||
                    this.dockingPoints["right"].child instanceof Relation) {
                    expression += this.dockingPoints["right"].child.getExpression(format);
                } else if (this.dockingPoints["right"] && this.dockingPoints["right"].child instanceof Num && (<Num>this.dockingPoints["right"].child).isNegative()) {
                    expression += this.dockingPoints["right"].child.getExpression(format);
                } else {
                    // WARNING This assumes it's a Symbol by default, hence produces a multiplication (with a star)
                    expression += "*" + this.dockingPoints["right"].child.getExpression(format);
                }
            }
        } else if (format == "subscript") {
            expression = "" + this.letter;
            if(this.modifier == "prime") {
                expression += "_prime"
            }
            if (this.dockingPoints["subscript"].child != null) {
                expression += this.dockingPoints["subscript"].child.getExpression(format);
            }
            if (!this.sonOfADifferential && this.dockingPoints["superscript"] && this.dockingPoints["superscript"].child != null) {
                expression += this.dockingPoints["superscript"].child.getExpression(format);
            }
            if (this.dockingPoints["right"] && this.dockingPoints["right"].child != null) {
                expression += this.dockingPoints["right"].child.getExpression(format);
            }
        } else if (format == "mathml") {
            expression = '';
            let l = this.letter;
            if(this.modifier == "prime") {
                l += "_prime"
            }
            if (this.sonOfADifferential) {
                if (this.dockingPoints['subscript'].child == null) {
                    expression += '<mi>' + l + '</mi>';

                } else if (this.dockingPoints['subscript'].child != null) {
                    expression += '<msub><mi>' + l + '</mi><mrow>' + this.dockingPoints['subscript'].child.getExpression(format) + '</mrow></msub>';
                }
            } else {
                if (this.dockingPoints['subscript'].child == null && this.dockingPoints["superscript"] && this.dockingPoints['superscript'].child == null) {
                    expression += '<mi>' + l + '</mi>';

                } else if (this.dockingPoints['subscript'].child != null && this.dockingPoints["superscript"] && this.dockingPoints['superscript'].child == null) {
                    expression += '<msub><mi>' + l + '</mi><mrow>' + this.dockingPoints['subscript'].child.getExpression(format) + '</mrow></msub>';

                } else if (this.dockingPoints['subscript'].child == null && this.dockingPoints["superscript"] && this.dockingPoints['superscript'].child != null) {
                    expression += '<msup><mi>' + l + '</mi><mrow>' + this.dockingPoints['superscript'].child.getExpression(format) + '</mrow></msup>';

                } else if (this.dockingPoints['subscript'].child != null && this.dockingPoints["superscript"] && this.dockingPoints['superscript'].child != null) {
                    expression += '<msubsup><mi>' + l + '</mi><mrow>' + this.dockingPoints['subscript'].child.getExpression(format) + '</mrow><mrow>' + this.dockingPoints['superscript'].child.getExpression(format) + '</mrow></msubsup>';
                }
            }

            if (this.dockingPoints["right"] && this.dockingPoints['right'].child != null) {
                expression += this.dockingPoints['right'].child.getExpression('mathml');
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

    token() {
        let e = this.letter;
        if(this.modifier == "prime") {
            e += "_prime"
        }
        if (this.dockingPoints['subscript'].child) {
            e += '_' + this.dockingPoints['subscript'].child.getExpression('subscript');
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
        let box = this.s.font_it.textBounds(text, 0, 1000, this.scale * this.s.baseFontSize);
        return new Rect(-box.w / 2, box.y - 1000, box.w, box.h);
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

        // superscript
        let supWidth = 0;
        if (this.dockingPoints["superscript"] && this.dockingPoints["superscript"].child) {
            let childBox = this.dockingPoints["superscript"].child.boundingBox();
            // FIXME There's a subtle excess when "this" has an ascent -- i.e., taller than an "x".
            this.dockingPoints["superscript"].child.position.x = (thisBox.w / 2 + childBox.w / 2) + (this.scale * this.s.xBox.w / 4);
            this.dockingPoints["superscript"].child.position.y = -this.scale * this.s.xBox.h; // TODO Investigate the following: + this.scale*(this.s.xBox.h - this.dockingPoints["superscript"].child.subtreeBoundingBox().h);
            supWidth = this.dockingPoints["superscript"].child.subtreeBoundingBox().w - childBox.w/2;
        } else {
            this.dockingPoints["superscript"].position.x = (thisBox.w / 2) + this.dockingPointSize / 2;
            this.dockingPoints["superscript"].position.y = (-this.scale * this.s.mBox.h);
        }

        // subscript
        let subWidth = 0;
        if (this.dockingPoints["subscript"] && this.dockingPoints["subscript"].child) {
            let childBox = this.dockingPoints["subscript"].child.boundingBox();
            this.dockingPoints["subscript"].child.position.x = thisBox.w / 2 + childBox.w / 2;
            this.dockingPoints["subscript"].child.position.y = this.scale * this.s.xBox.h / 2;
            subWidth = this.dockingPoints["subscript"].child.subtreeBoundingBox().w - childBox.w/2;
        } else {
            this.dockingPoints["subscript"].position.x = (thisBox.w / 2) + this.dockingPointSize / 2;
            this.dockingPoints["subscript"].position.y = 0;
        }

        // right
        if (this.dockingPoints["right"] && this.dockingPoints["right"].child) {
            this.dockingPoints["right"].child.position.x = this.scale * 1.5 * this.s.xBox.w + thisBox.w / 2 + Math.max(supWidth, subWidth) + this.dockingPointSize;
            this.dockingPoints["right"].child.position.y = this.dockingPoint.y - this.dockingPoints["right"].child.dockingPoint.y;
        } else {
            this.dockingPoints["right"].position.x = this.scale * 1.5 * this.s.xBox.w + this.subtreeBoundingBox().w - this.boundingBox().w / 2;
            this.dockingPoints["right"].position.y = (-this.scale * this.s.xBox.h / 2);
        }
    }

    /**
     * @returns {Widget[]} A flat array of the children of this widget, as widget objects
     */


    getChildren(): Array<Widget> {
        return _.compact(_.map(_.values(_.omit(this.dockingPoints, "subscript")), "child"));
    }
}
