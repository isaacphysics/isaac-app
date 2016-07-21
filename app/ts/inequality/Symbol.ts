import { Widget, Rect } from './Widget.ts'
import { BinaryOperation } from "./BinaryOperation.ts";
import { DockingPoint } from "./DockingPoint.ts";
import { Relation } from "./Relation.ts";
import { Num } from "./Num.ts";
import {StateSymbol} from "./StateSymbol.ts";


/** A class for representing variables and constants (aka, letters). */
export
    class Symbol extends Widget {

    protected s: any;
    protected letter: string;

    get typeAsString(): string {
        return "Symbol";
    }

    /**
     * There's a thing with the baseline and all that... this sort-of fixes it.
     *
     * @returns {Vector} The position to which a Symbol is meant to be docked from.
     */
    get dockingPoint(): p5.Vector {
        var box = this.s.font_it.textBounds("x", 0, 1000, this.scale * this.s.baseFontSize);
        return this.p.createVector(0, - box.h / 2);
    }

    public constructor(p: any, s: any, letter: string) {
        super(p, s);
        this.letter = letter;
        this.s = s;
        this.docksTo = ['relation', 'operator', 'exponent', 'symbol_subscript', 'symbol', 'operator_brackets'];
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
        var box = this.boundingBox();
        var descent = this.position.y - (box.y + box.h);

        this.dockingPoints["right"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.s.mBox.w / 4, -this.s.xBox.h / 2), 1, "operator", "right");
        this.dockingPoints["superscript"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.scale * 20, -this.scale * this.s.mBox.h), 0.666, "exponent", "superscript");
        this.dockingPoints["subscript"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.scale * 20, descent), 0.666, "symbol_subscript", "subscript");
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
        var expression = "";
        if (format == "latex") {
            expression = this.letter;
            if (this.dockingPoints["superscript"].child != null) {
                expression += "^{" + this.dockingPoints["superscript"].child.getExpression(format) + "}";
            }
            if (this.dockingPoints["subscript"].child != null) {
                expression += "_{" + this.dockingPoints["subscript"].child.getExpression(format) + "}";
            }
            if (this.dockingPoints["right"].child != null) {
                if (this.dockingPoints["right"].child instanceof BinaryOperation) {
                    expression += this.dockingPoints["right"].child.getExpression(format);
                } else {
                    // WARNING This assumes it's a Symbol, hence produces a multiplication
                    expression += this.dockingPoints["right"].child.getExpression(format);
                }
            }
        } else if (format == "python") {
            expression = "" + this.letter;
            if (this.dockingPoints["subscript"].child != null) {
                expression += "_" + this.dockingPoints["subscript"].child.getExpression("subscript");
            }
            if (this.dockingPoints["superscript"].child != null) {
                expression += "**(" + this.dockingPoints["superscript"].child.getExpression(format) + ")";
            }
            if (this.dockingPoints["right"].child != null) {
                if (this.dockingPoints["right"].child instanceof BinaryOperation ||
                    this.dockingPoints["right"].child instanceof Relation) {
                    expression += this.dockingPoints["right"].child.getExpression(format);
                } else if (this.dockingPoints["right"].child instanceof Num && (<Num>this.dockingPoints["right"].child).isNegative()) {
                    expression += this.dockingPoints["right"].child.getExpression(format);
                } else {
                    // WARNING This assumes it's a Symbol by default, hence produces a multiplication (with a star)
                    expression += "*" + this.dockingPoints["right"].child.getExpression(format);
                }
            }
        } else if (format == "subscript") {
            expression = "" + this.letter;
            if (this.dockingPoints["subscript"].child != null) {
                expression += this.dockingPoints["subscript"].child.getExpression(format);
            }
            if (this.dockingPoints["superscript"].child != null) {
                expression += this.dockingPoints["superscript"].child.getExpression(format);
            }
            if (this.dockingPoints["right"].child != null) {
                expression += this.dockingPoints["right"].child.getExpression(format);
            }
        } else if (format == "mathml") {
            expression = '';
            if (this.dockingPoints['subscript'].child == null && this.dockingPoints['superscript'].child == null) {
                expression += '<mi>' + this.letter + '</mi>';

            } else if (this.dockingPoints['subscript'].child != null && this.dockingPoints['superscript'].child == null) {
                expression += '<msub><mi>' + this.letter + '</mi><mrow>' + this.dockingPoints['subscript'].child.getExpression(format) + '</mrow></msub>';

            } else if (this.dockingPoints['subscript'].child == null && this.dockingPoints['superscript'].child != null) {
                expression += '<msup><mi>' + this.letter + '</mi><mrow>' + this.dockingPoints['superscript'].child.getExpression(format) + '</mrow></msup>';

            } else if (this.dockingPoints['subscript'].child != null && this.dockingPoints['superscript'].child != null) {
                expression += '<msubsup><mi>' + this.letter + '</mi><mrow>' + this.dockingPoints['subscript'].child.getExpression(format) + '</mrow><mrow>' + this.dockingPoints['superscript'].child.getExpression(format) + '</mrow></msubsup>';

            }
            if (this.dockingPoints['right'].child != null) {
                expression += this.dockingPoints['right'].child.getExpression('mathml');
            }
        }
        return expression;
    }

    properties(): Object {
        return {
            letter: this.letter
        };
    }

    token() {
        // TODO Handle greek letters
        var e = this.letter;
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
            .text(this.letter, 0, 0);
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
        var box = this.s.font_it.textBounds(this.letter || "x", 0, 1000, this.scale * this.s.baseFontSize);
        return new Rect(-box.w / 2, box.y - 1000, box.w, box.h);
    }

	/**
	 * Internal companion method to shakeIt(). This is the one that actually does the work, and the one that should be
	 * overridden by children of this class.
	 *
	 * @private
	 */
    _shakeIt() {
        // Work out the size of all our children
        var boxes: { [key: string]: Rect } = {};

        _.each(this.dockingPoints, (dockingPoint, dockingPointName) => {
            if (dockingPoint.child != null) {
                dockingPoint.child.scale = this.scale * dockingPoint.scale;
                dockingPoint.child._shakeIt();
                boxes[dockingPointName] = dockingPoint.child.boundingBox(); // NB: This only looks at the direct child!
            }
        });

        /*
          - Positions widgets to the right, top-right or bottom-right of the parent symbol. Children are the symbols docked to the right,
          superscript and subscript positions respectively.
          - When docking from the right, we use getExpressionWidth() to find the size of the child expression.
        */

        var box = this.boundingBox();
        var parent_position = (box.y + box.h);
        var parent_superscript_width = (this.dockingPoints["superscript"].child != null) ? (this.dockingPoints["superscript"].child.getExpressionWidth()) : 0;
        var parent_subscript_width = (this.dockingPoints["subscript"].child != null) ? (this.dockingPoints["subscript"].child.getExpressionWidth()) : 0;
        var parent_width = box.w;
        var parent_height = box.h;
        var child_height;
        var child_width;
        var docking_right = this.dockingPoints["right"];
        var docking_superscript = this.dockingPoints["superscript"];
        var docking_subscript = this.dockingPoints["subscript"];

        if ("superscript" in boxes) {
            child_width = docking_superscript.child.boundingBox().w;
            child_height = docking_superscript.child.boundingBox().h;
            docking_superscript.child.position.x = (parent_width / 2 + child_width / 2);
            docking_superscript.child.position.y = -0.8 * (parent_height / 2 + child_height / 2);
        } else {
            docking_superscript.position.x = (parent_width == this.boundingBox().w) ? (parent_width / 2 + this.scale * 20) : (parent_width - this.boundingBox().w / 2 + this.scale * 20);
            docking_superscript.position.y = -this.scale * this.s.mBox.h;
        }

        if ("subscript" in boxes) {
            child_width = docking_subscript.child.boundingBox().w;
            child_height = docking_subscript.child.boundingBox().h;
            docking_subscript.child.position.x = (parent_width / 2 + child_width / 2);
            docking_subscript.child.position.y = (parent_height / 2 + child_height / 5);
        } else {
            docking_subscript.position.x = (parent_width == this.boundingBox().w) ? (parent_width / 2 + this.scale * 20) : (parent_width - this.boundingBox().w / 2 + this.scale * 20);
            docking_subscript.position.y = parent_position;
        }

        parent_width += (parent_subscript_width >= parent_superscript_width) ? parent_subscript_width : parent_superscript_width;

        if ("right" in boxes) {
            child_width = docking_right.child.boundingBox().w;
            docking_right.child.position.x = (parent_width == this.boundingBox().w) ? (parent_width / 2 + child_width / 2) : (parent_width - this.boundingBox().w / 2 + child_width / 2);
            docking_right.child.position.y = 0;
        } else {
            docking_right.position.x = (parent_width == this.boundingBox().w) ? (parent_width / 2 + this.scale * 20) : (parent_width - this.boundingBox().w / 2 + this.scale * 20);
            docking_right.position.y = (this.dockingPoint.y);
        }
    }

    /**
     * @returns {Widget[]} A flat array of the children of this widget, as widget objects
     */


    getChildren(): Array<Widget> {
        return _.compact(_.map(_.values(_.omit(this.dockingPoints, "subscript")), "child"));
    }
}
