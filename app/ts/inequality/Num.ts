import { Widget, Rect } from './Widget.ts'
import {BinaryOperation} from "./BinaryOperation.ts";
import { DockingPoint } from "./DockingPoint.ts";

/** A class for representing numbers */
export
class Num extends Widget {

    protected s: any;
    private significand: string;
    private exponent: string;

    get typeAsString(): string {
        return "Num";
    }

    /**
     * There's a thing with the baseline and all that... this sort-of fixes it.
     *
     * @returns {Vector} The position to which a Symbol is meant to be docked from.
     */
    get dockingPoint(): p5.Vector {
        var box = this.s.font_up.textBounds("x", 0, 1000, this.scale * this.s.baseFontSize);
        return this.p.createVector(0, - box.h / 2);
    }

    constructor(p:any, s:any, significand:string, exponent:string) {
        super(p, s);
        this.significand = significand;
        this.exponent = exponent;
        this.s = s;

        this.docksTo = ['symbol', 'operator', 'exponent', 'subscript'];
    }
    
    getFullText(type?: string): string {
        var s = this.significand;
        if (this.exponent) {
            switch(type) {
                case "latex":
                    s += "\\times 10^{" + this.exponent + "}";
                    break;
                case "python":
                    s += "*(10**" + this.exponent  + ")";
                    break;
                default:
                    s += "e" + this.exponent;
            }
        }
        return s;
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

        this.dockingPoints["right"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.s.mBox.w / 4, -this.s.xBox.h / 2), 1, "operator");
        this.dockingPoints["superscript"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.scale * 20, -this.scale*this.s.mBox.h), 0.666, "exponent");
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
            expression = this.getFullText("latex");
            if (this.dockingPoints["superscript"].child != null) {
                if (this.exponent) {
                    expression = "(" + expression + ")";
                }
                expression += "^{" + this.dockingPoints["superscript"].child.getExpression(format) + "}";
            }
            if (this.dockingPoints["right"].child != null) {
                if (this.dockingPoints["right"].child instanceof BinaryOperation) {
                    expression += this.dockingPoints["right"].child.getExpression(format);
                } else {
                    // WARNING This assumes it's a Number, hence produces a multiplication
                    expression += this.dockingPoints["right"].child.getExpression(format);
                }
            }
        } else if (format == "python") {
            expression = "" + this.getFullText("python");
            //if (this.dockingPoints["subscript"].child != null) {
            //    expression += this.dockingPoints["subscript"].child.getExpression("subscript");
            //}
            if (this.dockingPoints["superscript"].child != null) {
                expression += "**(" + this.dockingPoints["superscript"].child.getExpression(format) + ")";
            }
            if (this.dockingPoints["right"].child != null) {
                if (this.dockingPoints["right"].child instanceof BinaryOperation) {
                    expression += this.dockingPoints["right"].child.getExpression(format);
                } else {
                    // WARNING This assumes it's a Symbol, hence produces a multiplication
                    expression += "*" + this.dockingPoints["right"].child.getExpression(format);
                }
            }
        } else if (format == "subscript") {
            expression = "" + this.getFullText();
            //if (this.dockingPoints["subscript"].child != null) {
            //    expression += this.dockingPoints["subscript"].child.getExpression(format);
            //}
            if (this.dockingPoints["superscript"].child != null) {
                expression += this.dockingPoints["superscript"].child.getExpression(format);
            }
            if (this.dockingPoints["right"].child != null) {
                expression += this.dockingPoints["right"].child.getExpression(format);
            }
        } else if(format == "mathml") {
            expression = '';
            if (this.dockingPoints['superscript'].child == null) {
                expression += '<mn>' + this.getFullText() + '</mn>';

            } else {
                expression += '<msup><mn>' + this.getFullText() + '</mn><mrow>' + this.dockingPoints['superscript'].child.getExpression(format) + '</mrow></msup>';

            }
            if (this.dockingPoints['right'].child != null) {
                expression += this.dockingPoints['right'].child.getExpression('mathml');
            }
        }
        return expression;
    }

    properties(): Object {
        return {
            significand: this.significand,
            exponent: this.exponent,
        };
    }

    token() {
        return '';
    }

    /** Paints the widget on the canvas. */
    _draw() {
        this.p.fill(this.color).strokeWeight(0).noStroke();

        this.p.textFont(this.s.font_up)
            .textSize(this.s.baseFontSize * this.scale)
            .textAlign(this.p.CENTER, this.p.BASELINE)
            .text(this.getFullText(), 0, 0);
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
        var box = this.s.font_up.textBounds(this.getFullText() || "x", 0, 1000, this.scale * this.s.baseFontSize);
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
        var boxes: {[key:string]: Rect} = {};

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

        var box = this.boundingBox();
        var descent = (box.y + box.h);

        var widest = 0;

        if ("superscript" in boxes) {
            var p = this.dockingPoints["superscript"].child.position;
            var w = this.dockingPoints["superscript"].child.offsetBox().w;
            widest = this.dockingPoints["superscript"].child.subtreeBoundingBox().w;
            p.x = box.w / 2 + this.scale * 20 + w/2;
            p.y = -(box.h - descent - this.scale * 20);
        } else {
            var p = this.dockingPoints["superscript"].position;
            p.x = box.w / 2 + this.scale * 20;
            p.y = -this.scale*this.s.mBox.h;
        }

        // TODO: Tweak this with kerning.
        if ("right" in boxes) {
            var p = this.dockingPoints["right"].child.position;
            p.x = box.w / 2 + this.scale * this.s.mBox.w / 4 + Math.max(widest, this.dockingPoints["right"].child.boundingBox().w/2);
            p.y = 0;
        } else {
            var p = this.dockingPoints["right"].position;
            p.x = box.w / 2 + this.scale * this.s.mBox.w / 4 + widest;
            p.y = -this.s.xBox.h / 2;
        }
    }
}