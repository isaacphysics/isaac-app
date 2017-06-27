import { Widget, Rect } from './Widget.ts'
import {BinaryOperation} from "./BinaryOperation.ts";
import { DockingPoint } from "./DockingPoint.ts";
import { ChemicalElement } from "./ChemicalElement.ts";
import { Relation } from "./Relation.ts";
import { Brackets } from "./Brackets.ts";

/** A class for representing numbers */
export
    class Num extends Widget {

    protected s: any;
    private significand: string;
    private num_font_size;
    protected right = this.dockingPoints.hasOwnProperty("right");
    protected superscript = this.dockingPoints.hasOwnProperty("superscript");


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


    constructor(p: any, s: any, significand: string, exponent: string) {
        super(p, s);
        this.significand = significand;
        this.num_font_size = 50;
        this.s = s;


        this.docksTo = ['symbol', 'exponent', 'subscript', 'top-left', 'symbol_subscript', 'bottom-left', 'particle', 'relation', 'operator_brackets', 'differential_order'];
    }

    getFullText(type?: string): string {
        return this.significand;
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
            if (this.superscript && this.dockingPoints["superscript"].child != null) {
                expression += "^{" + this.dockingPoints["superscript"].child.getExpression(format) + "}";
            }
            if (this.right && this.dockingPoints["right"].child != null) {
                if (this.dockingPoints["right"].child instanceof BinaryOperation) {
                    expression += this.dockingPoints["right"].child.getExpression(format);
                } else {
                    // WARNING This assumes it's a Number, hence produces a multiplication
                    expression += this.dockingPoints["right"].child.getExpression(format);
                }
            }
        } else if (format == "mhchem") {
            expression = this.getFullText("mhchem");
            if (this.superscript && this.dockingPoints["superscript"].child != null) {
                expression += "^" + this.dockingPoints["superscript"].child.getExpression(format) + "";
            }
            if (this.right && this.dockingPoints["right"].child != null) {
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
                } else if (this.dockingPoints["right"].child instanceof Relation) {
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
        } else if (format == "mathml") {
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
        var boxes: { [key: string]: Rect } = {};

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

        var box = this.boundingBox();
        var parent_position = (box.y + box.h);
        var parent_width = box.w;
        var parent_superscript_width = (this.dockingPoints["superscript"].child != null) ? (this.dockingPoints["superscript"].child.getExpressionWidth()) : 0;
        var parent_height = box.h;
        var child_height;
        var child_width;
        var docking_right = this.dockingPoints["right"];
        var docking_superscript = this.dockingPoints["superscript"];


        if ("superscript" in boxes) {
            child_width = docking_superscript.child.boundingBox().w;
            child_height = docking_superscript.child.boundingBox().h;
            docking_superscript.child.position.x = (parent_width / 2 + child_width / 2);
            docking_superscript.child.position.y = -0.8 * (parent_height / 2 + child_height / 2);
        } else {
            docking_superscript.position.x = (parent_width == this.boundingBox().w) ? (parent_width / 2 + this.scale * 20) : (parent_width - this.boundingBox().w / 2 + this.scale * 20);
            docking_superscript.position.y = -this.scale * this.s.mBox.h;
        }

        parent_width += parent_superscript_width;

        if ("right" in boxes) {
            if (docking_right.child.dockingPoints["right"].child == null && docking_right.child instanceof BinaryOperation) {
              child_width = docking_right.child.boundingBox().w;
              child_height = docking_right.child.boundingBox().h;
              docking_right.child.position.x = this.boundingBox().w/2 + child_width/4;
              docking_right.child.position.y = 0;//-(child_height/2-parent_height/4);
            } else {
              child_width = docking_right.child.boundingBox().w;
                if(docking_right.child instanceof ChemicalElement) {
                  var mass_width = (docking_right.child.dockingPoints['mass_number'] && docking_right.child.dockingPoints['mass_number'].child) ? docking_right.child.dockingPoints['mass_number'].child.boundingBox().w : 0;
                  var proton_width = (docking_right.child.dockingPoints['proton_number'] && docking_right.child.dockingPoints['proton_number'].child) ? docking_right.child.dockingPoints['proton_number'].child.boundingBox().w : 0;
                  child_width += (mass_width >= proton_width) ? mass_width : proton_width;
                  docking_right.child.position.x = (mass_width == 0 && proton_width == 0) ? parent_width + child_width / 2 - this.boundingBox().w/2: parent_width/2 + child_width / 2 + this.boundingBox().w/2;
                }
                else {
                  docking_right.child.position.x = (parent_width + child_width / 2 - this.boundingBox().w/2);
                }
                docking_right.child.position.y = 0;
            }
            // FIXME HORRIBLE BRACKETS FIX
            if(docking_right.child instanceof Brackets) {
                docking_right.child.position.y = docking_right.child.dockingPoints["argument"].child ? -docking_right.child.dockingPoints["argument"].child.boundingBox().h/2 : 0;
            }
        } else {
            docking_right.position.x = (parent_width == this.boundingBox().w) ? (parent_width / 2 + this.scale * 20) : (parent_width - this.boundingBox().w / 2 + this.scale * 20);
            docking_right.position.y = (this.dockingPoint.y);
        }
    }

    isNegative(): boolean {
        return Number(this.significand) < 0;
    }
}
