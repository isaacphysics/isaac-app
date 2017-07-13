import { Widget, Rect } from './Widget.ts'
import { BinaryOperation } from "./BinaryOperation.ts";
import { DockingPoint } from "./DockingPoint.ts";
import { Relation } from "./Relation.ts";
import { Num } from "./Num.ts";
import { Brackets } from "./Brackets.ts";
import {StateDifferential} from "./StateDifferential.ts";


/** A class for representing variables and constants (aka, letters). */
export
class Differential extends Widget {

    protected s: any;
    protected letter: string;

    get typeAsString(): string {
        return "Differential";
    }

    /**
     * There's a thing with the baseline and all that... this sort-of fixes it.
     *
     * @returns {Vector} The position to which a Differential is meant to be docked from.
     */
    get dockingPoint(): p5.Vector {
        var box = this.s.font_up.textBounds("x", 0, 1000, this.scale * this.s.baseFontSize);
        return this.p.createVector(0, - box.h / 2);
    }

    public constructor(p: any, s: any, letter: string) {
        super(p, s);
        this.letter = letter;
        this.s = s;
        this.docksTo = ['operator', 'differential'];
    }

    /**
     * Prevents Differentials from being detached from Derivatives when the user is not an admin/editor.
     */
    get isDetachable() {
        var userIsPrivileged = _.includes(['ADMIN', 'CONTENT_EDITOR', 'EVENT_MANAGER'], this.s.scope.user.role);
        return userIsPrivileged || !this.sonOfADerivative;
    }

    get sonOfADerivative() {
        var s = false;
        var p = this.parentWidget;
        while (p != null) {
            s |= p.typeAsString == 'Derivative';
            p = p.parentWidget;
        }
        return s;
    }

    get orderNeedsMoving() {
        var a = false;
        var n = this.dockedTo;
        var w = this;
        while (w != null) {
            a |= n == "denominator";
            w = w.parentWidget;
            n = w != null ? "" : w.dockedTo;
        }
        return a;
    }

    /**
     * Generates all the docking points in one go and stores them in this.dockingPoints.
     * A Differential has three docking points:
     *
     * - _right_: Binary operation (addition, subtraction), Differential (multiplication)
     * - _order_: Exponent
     * - _subscript_: Subscript (duh?)
     */
    generateDockingPoints() {
        var box = this.boundingBox();
        var descent = this.position.y - (box.y + box.h);

        this.dockingPoints["argument"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.s.mBox.w / 4, -this.s.xBox.h / 2), 1, "differential_argument", "argument");
        this.dockingPoints["order"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.scale * 20, -this.scale * this.s.mBox.h), 0.666, "differential_order", "order");
        this.dockingPoints["right"] = new DockingPoint(this, this.p.createVector(box.w / 2 + 1.25*this.s.mBox.w, -this.s.xBox.h / 2), 1, "differential", "right");
    }

    /**
     * Generates the expression corresponding to this widget and its subtree.
     *
     * The `subscript` format is a special one for generating Differentials that will work with the sympy checker. It squashes
     * everything together, ignoring operations and all that jazz.
     *
     * @param format A string to specify the output format. Supports: latex, python, subscript.
     * @returns {string} The expression in the specified format.
     */
    getExpression(format: string): string {
        var expression = "";
        if (format == "latex") {
            if (this.letter == "δ") {
                expression = "\\mathrm{\\delta} ";
            } else if (this.letter == "∆") {
                expression = "\\mathrm{\\Delta} ";
            } else {
                expression = this.letter;
            }
            if (this.dockingPoints["order"].child != null) {
                expression += "^{" + this.dockingPoints["order"].child.getExpression(format) + "}";
            }
            if (this.dockingPoints["argument"].child != null) {
                if (this.dockingPoints["argument"].child instanceof BinaryOperation) {
                    expression += this.dockingPoints["argument"].child.getExpression(format);
                } else {
                    // WARNING This assumes it's a Differential, hence produces a multiplication
                    expression += this.dockingPoints["argument"].child.getExpression(format);
                }
            }
            if (this.dockingPoints["right"].child != null) {
                expression += this.dockingPoints["right"].child.getExpression(format);
            }
        } else if (format == "python") {
            // FIXME This is broken and needs proper implementation
            if (this.letter == "δ") {
                expression = "differential_delta";
            } else if (this.letter == "∆") {
                expression = "differential_Delta";
            } else {
                expression = "differential_d";
            }
            if (this.dockingPoints["order"].child != null) {
                expression += "(" + this.dockingPoints["order"].child.getExpression(format) + ")";
            } else {
                expression += "()";
            }
            if (this.dockingPoints["argument"].child != null) {
                expression += "(" + this.dockingPoints["argument"].child.getExpression(format) + ")";
            } else {
                expression += "()";
            }
        } else if (format == "mathml") {
            expression = '';
            // FIXME Fix this mess (@jps79)
            // if (this.dockingPoints['subscript'].child == null && this.dockingPoints['order'].child == null) {
            //     expression += '<mi>' + this.letter + '</mi>';
            // } else if (this.dockingPoints['subscript'].child != null && this.dockingPoints['order'].child == null) {
            //     expression += '<msub><mi>' + this.letter + '</mi><mrow>' + this.dockingPoints['subscript'].child.getExpression(format) + '</mrow></msub>';
            //
            // } else if (this.dockingPoints['subscript'].child == null && this.dockingPoints['order'].child != null) {
            //     expression += '<msup><mi>' + this.letter + '</mi><mrow>' + this.dockingPoints['order'].child.getExpression(format) + '</mrow></msup>';
            //
            // } else if (this.dockingPoints['subscript'].child != null && this.dockingPoints['order'].child != null) {
            //     expression += '<msubsup><mi>' + this.letter + '</mi><mrow>' + this.dockingPoints['subscript'].child.getExpression(format) + '</mrow><mrow>' + this.dockingPoints['order'].child.getExpression(format) + '</mrow></msubsup>';
            // }
            if (this.dockingPoints["argument"].child != null) {
                expression += this.dockingPoints["argument"].child.getExpression('mathml');
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
        var e = this.letter;
        return e;
    }

    /** Paints the widget on the canvas. */
    _draw() {
        this.p.fill(this.color).strokeWeight(0).noStroke();

        this.p.textFont(this.s.font_up)
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
        var box = this.s.font_up.textBounds(this.letter || "x", 0, 1000, this.scale * this.s.baseFontSize);
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
         - Positions widgets to the right, top-right or bottom-right of the parent Differential. Children are the Differentials docked to the right,
         order and subscript positions respectively.
         - When docking from the right, we use getExpressionWidth() to find the size of the child expression.
         */

        var box = this.boundingBox();
        var parent_position = (box.y + box.h);
        var parent_order_width = (this.dockingPoints["order"].child != null) ? (this.dockingPoints["order"].child.getExpressionWidth()) : 0;
        var parent_width = box.w;
        var parent_height = box.h;
        var child_height = 0;
        var child_width = 0;
        var docking_argument = this.dockingPoints["argument"];
        var docking_order = this.dockingPoints["order"];
        var docking_right = this.dockingPoints["right"];
        var arg_width = 0;

        // FIXME When a differential is below the fraction line, the order goes on the other side... curse you, Leibniz!
        if ("order" in boxes) {
            child_width = docking_order.child.boundingBox().w;
            child_height = docking_order.child.boundingBox().h;
            if (this.orderNeedsMoving) {
                // Compute the argument's size and move the order to its right. This needs to be done again below.
                var argument_width = ("argument" in boxes) ? docking_argument.child.boundingBox().w : 0;
                docking_order.child.position.x = argument_width + (parent_width + child_width)/2;
            } else {
                docking_order.child.position.x = (parent_width + child_width)/2;
            }
            docking_order.child.position.y = -0.8 * (parent_height + child_height)/2;
        } else {
            docking_order.position.x = (parent_width == this.boundingBox().w) ? (parent_width / 2 + this.scale * 10) : (parent_width - this.boundingBox().w / 2 + this.scale * 10);
            docking_order.position.y = -this.scale * this.s.mBox.h;
        }

        if ("argument" in boxes) {
            child_width = docking_argument.child.boundingBox().w;
            docking_argument.child.position.x = this.scale * 5 + parent_order_width + ((parent_width == this.boundingBox().w) ? (parent_width / 2 + child_width / 2) : (parent_width - this.boundingBox().w / 2 + child_width / 2));
            docking_argument.child.position.y = 0;
            arg_width = child_width;
        } else {
            docking_argument.position.x = (parent_width == this.boundingBox().w) ? (parent_width / 2 + this.scale * 20) : (parent_width - this.boundingBox().w / 2 + this.scale * 20);
            docking_argument.position.y = (this.dockingPoint.y);
            arg_width = 0;
        }

        if ("right" in boxes) {
            docking_right.child.position.x = box.w / 2 + 1.25*this.s.mBox.w + arg_width;
            docking_right.child.position.y = 0;
        } else {
            docking_right.position.x = box.w / 2 + 1.25*this.s.mBox.w;
            docking_right.position.y = -this.s.xBox.h / 2;
        }

    }

    /**
     * @returns {Widget[]} A flat array of the children of this widget, as widget objects
     */


    getChildren(): Array<Widget> {
        return _.compact(_.map(_.values(this.dockingPoints), "child"));
    }
}
