import { Widget, Rect } from './Widget.ts';
import { BinaryOperation } from "./BinaryOperation.ts";
import { Relation } from "./Relation.ts";
import { DockingPoint } from "./DockingPoint.ts";
import { Brackets } from "./Brackets.ts";
import { Differential } from "./Differential.ts";
import { Num } from "./Num.ts";

export
    class Derivative extends Widget {
    protected s: any;
    private width: number;

    get typeAsString(): string {
        return "Derivative";
    }

    /**
     * There's a thing with the baseline and all that... this sort-of fixes it.
     *
     * @returns {Vector} The position to which a Symbol is meant to be docked from.
     */
    get dockingPoint(): p5.Vector {
        var p = this.p.createVector(-this.boundingBox().w / 2, 0);
        return p;
    }

    constructor(p: any, s: any) {
        super(p, s);
        this.s = s;
        this.width = 0;

        this.docksTo = ['operator', 'symbol', 'exponent', 'operator_brackets', 'relation', 'symbol_subscript'];
    }

    /** Generates all the docking points in one go and stores them in this.dockingPoints.
     * A Derivative has three docking point:
     *
     * - _right_: Binary operation (addition, subtraction), Symbol (multiplication)
     * - _numerator_: Differential
     * - _denominator_: Differential
     */
    generateDockingPoints() {
        var box = this.boundingBox();
        console.log(this.boundingBox());
        // FIXME That 50 is hard-coded, need to investigate when this.width gets initialized.
        this.dockingPoints["right"] = new DockingPoint(this, this.p.createVector(50 + this.scale * this.s.mBox.w / 4, -box.h / 2), 1, "operator", "right");
        this.dockingPoints["numerator"] = new DockingPoint(this, this.p.createVector(0, -(box.h + 25)), 1, "differential", "numerator");
        this.dockingPoints["denominator"] = new DockingPoint(this, this.p.createVector(0, 0 + 25), 1, "differential", "denominator");
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
        if (format == "latex" || format == 'mhchem') {
            if (this.dockingPoints["numerator"].child != null && this.dockingPoints["denominator"].child != null) {
                expression += "\\frac{" + this.dockingPoints["numerator"].child.getExpression(format) + "}{" + this.dockingPoints["denominator"].child.getExpression(format) + "}";
                if (this.dockingPoints["right"].child != null) {
                    expression += this.dockingPoints["right"].child.getExpression(format);
                }
            }
        } else if (format == "python") {
            if (this.dockingPoints["numerator"].child != null && this.dockingPoints["denominator"].child != null &&
                this.dockingPoints["numerator"].child.typeAsString == "Differential" && this.dockingPoints["denominator"].child.typeAsString == "Differential" &&
                this.dockingPoints["numerator"].child.dockingPoints["argument"].child != null) {
                expression += "diff(" + this.dockingPoints["numerator"].child.dockingPoints["argument"].child.getExpression(format) + ", ";
                var stack: Array<Widget> = [this.dockingPoints["denominator"].child];
                var list = [];
                while(stack.length > 0) {
                    var e = stack.shift();
                    if (e.typeAsString == "Differential") {
                        // WARNING: This stops at the first non-Differential, which is kinda OK, but may confuse people.
                        var o = 1;
                        var o_child: Widget = e.dockingPoints["order"].child
                        if (o_child != null && o_child.typeAsString == "Num") {
                            o = parseInt(o_child.getFullText());
                        }
                        do {
                            if (e.dockingPoints["argument"].child != null) {
                                list.push(e.dockingPoints["argument"].child.getExpression(format));
                            } else {
                                list.push("___MEH___");
                            }
                            o -= 1;
                        } while(o > 0);
                        if (e.dockingPoints["right"].child != null) {
                            stack.push(e.dockingPoints["right"].child);
                        }
                    }
                }
                expression += list.join(", ") + ")";
            }
        } else if (format == "subscript") {
            if (this.dockingPoints["right"].child != null) {
                expression += "[Derivative:" + this.id + "]";
            }
        } else if (format == 'mathml') {
            expression = '';
            if (this.dockingPoints["numerator"].child != null && this.dockingPoints["denominator"].child != null) {
                expression += '<mfrac><mrow>' + this.dockingPoints['numerator'].child.getExpression(format) + '</mrow><mrow>' + this.dockingPoints['denominator'].child.getExpression(format) + '</mrow></mfrac>';
            }
            if (this.dockingPoints['right'].child != null) {
                expression += this.dockingPoints['right'].child.getExpression(format);
            }
        }
        return expression;
    }

    properties(): Object {
        return null;
    }

    token() {
        return '';
    }

    /** Paints the widget on the canvas. */
    _draw() {
        this.p.noFill().strokeWeight(5 * this.scale).stroke(this.color);

        var box = this.boundingBox();
        this.p.line(-box.w / 2, -box.h / 2, box.w / 2, -box.h / 2);

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
        var box = this.s.font_up.textBounds("+", 0, 1000, this.scale * this.s.baseFontSize);
        this.width = 50;
        var numerator_width = (this.dockingPoints["numerator"] != undefined && this.dockingPoints["numerator"].child != null) ? this.dockingPoints["numerator"].child.getExpressionWidth() : this.width;
        var denominator_width = (this.dockingPoints["denominator"] != undefined && this.dockingPoints["denominator"].child != null) ? this.dockingPoints["denominator"].child.getExpressionWidth() : this.width;
        this.width = (this.width >= numerator_width && this.width >= denominator_width) ? this.width : ((numerator_width >= denominator_width) ? numerator_width : denominator_width);
        return new Rect(-this.width * this.scale / 2, -box.h * this.scale, this.width * this.scale, box.h * this.scale);
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
        var subtreeBoxes: { [key: string]: Rect } = {};

        _.each(this.dockingPoints, (dockingPoint, dockingPointName) => {
            if (dockingPoint.child != null) {
                dockingPoint.child.scale = this.scale * dockingPoint.scale;
                dockingPoint.child._shakeIt();
                boxes[dockingPointName] = dockingPoint.child.boundingBox(); // NB: This only looks at the direct child!
                subtreeBoxes[dockingPointName] = dockingPoint.child.subtreeBoundingBox();
            }
        });

        // Calculate our own geometry
        this.width = Math.max(100, _.max(_.map(_.values(_.pick(subtreeBoxes, ["numerator", "denominator"])), "w")) || 0);

        var bbox = this.boundingBox();
        // Set position of all our children.

        if ("numerator" in boxes) {
            var p = this.dockingPoints["numerator"].child.position;
            var fullNumeratorWidth = subtreeBoxes["numerator"].w;
            var numeratorRootWidth = this.dockingPoints["numerator"].child.offsetBox().w;
            var numeratorFullDescent = subtreeBoxes["numerator"].y + subtreeBoxes["numerator"].h;

            p.x = numeratorRootWidth / 2 - fullNumeratorWidth / 2;
            p.y = -bbox.h / 2 - this.scale * this.s.mBox.w / 4 - numeratorFullDescent;
        }

        if ("denominator" in boxes) {
            var p = this.dockingPoints["denominator"].child.position;
            var fullDenominatorWidth = subtreeBoxes["denominator"].w;
            var denominatorRootWidth = this.dockingPoints["denominator"].child.offsetBox().w;
            var denominatorFullAscent = subtreeBoxes["denominator"].y;

            p.x = denominatorRootWidth / 2 - fullDenominatorWidth / 2;
            p.y = -bbox.h / 2 + this.scale * this.s.mBox.w / 4 - denominatorFullAscent;
        }

        if ("right" in boxes) {
            var p = this.dockingPoints["right"].child.position;
            p.x = this.width / 2 + this.dockingPoints["right"].child.offsetBox().w / 2 + this.scale * this.s.mBox.w / 4; // TODO: Tweak this with kerning.
            p.y = 0;
            // FIXME HORRIBLE BRACKETS FIX
            var docking_right = this.dockingPoints["right"];
            if(docking_right.child instanceof Brackets) {
                docking_right.child.position.y = docking_right.child.dockingPoints["argument"].child ? -docking_right.child.dockingPoints["argument"].child.boundingBox().h/2 : 0;
            }
        } else {
            var p = this.dockingPoints["right"].position;
            if ("denominator" in boxes) {
                p.x = this.width / 2 + this.scale * this.s.mBox.w / 2;
            } else {
                p.x = this.width / 2 + this.scale * this.s.mBox.w / 4;
            }
            p.y = -this.boundingBox().h / 2;
        }
    }
}
