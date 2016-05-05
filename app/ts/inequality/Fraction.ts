import { Widget, Rect } from './Widget.ts';
import {BinaryOperation} from "./BinaryOperation.ts";
import { DockingPoint } from "./DockingPoint.ts";

export
class Fraction extends Widget {
    protected s: any;
    private width: number;

    get typeAsString(): string {
        return "Fraction";
    }

    /**
     * There's a thing with the baseline and all that... this sort-of fixes it.
     *
     * @returns {Vector} The position to which a Symbol is meant to be docked from.
     */
    get dockingPoint(): p5.Vector {
        var p = this.p.createVector(-this.boundingBox().w/2, 0);
        return p;
    }

    constructor(p: any, s: any) {
        super(p, s);
        this.s = s;
        this.width = 100;

        this.docksTo = ['operator', 'symbol', 'exponent'];
    }

    /** Generates all the docking points in one go and stores them in this.dockingPoints.
     * A Fraction has three docking point:
     *
     * - _right_: Binary operation (addition, subtraction), Symbol (multiplication)
     * - _numerator_: Symbol
     * - _denominator_: Symbol
     */
    generateDockingPoints() {
        var box = this.boundingBox();

        // FIXME That 50 is hard-coded, need to investigate when this.width gets initialized.
        this.dockingPoints["right"] = new DockingPoint(this, this.p.createVector(50 + this.scale*this.s.mBox.w/4, -box.h/2), 1, "symbol");
        this.dockingPoints["numerator"] = new DockingPoint(this, this.p.createVector(0, -(box.h + 25)), 1, "symbol");
        this.dockingPoints["denominator"] = new DockingPoint(this, this.p.createVector(0, 0 + 25), 1, "symbol");
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
        if(format == "latex") {
            if (this.dockingPoints["numerator"].child != null && this.dockingPoints["denominator"].child != null) {
                expression += "\\frac{" + this.dockingPoints["numerator"].child.getExpression(format) + "}{" + this.dockingPoints["denominator"].child.getExpression(format) + "} ";
                if(this.dockingPoints["right"].child != null) {
                    expression += this.dockingPoints["right"].child.getExpression(format);
                }
            }
        } else if(format == "python") {
            if (this.dockingPoints["numerator"].child != null && this.dockingPoints["denominator"].child != null) {
                expression += "((" + this.dockingPoints["numerator"].child.getExpression(format) + ")/(" + this.dockingPoints["denominator"].child.getExpression(format) + "))";
                if(this.dockingPoints["right"].child != null) {
                    if(this.dockingPoints["right"].child instanceof BinaryOperation) {
                        expression += this.dockingPoints["right"].child.getExpression(format);
                    } else {
                        expression += " * " + this.dockingPoints["right"].child.getExpression(format);
                    }
                }
            }
        } else if(format == "subscript") {
            if (this.dockingPoints["right"].child != null) {
                expression += "[NOPE:" + this.id + "]";
            }
        }
        return expression;
    }

    properties(): Object {
        return null;
    }

    /** Paints the widget on the canvas. */
    _draw() {
        this.p.noFill().strokeWeight(6*this.scale).stroke(this.color);

        var box = this.boundingBox();
        this.p.line(-box.w/2, -box.h/2, box.w/2, -box.h/2);

        this.p.strokeWeight(1);

        if(window.location.hash === "#debug") {
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
        var box = this.s.font_up.textBounds("+", 0, 1000, this.scale * this.s.baseFontSize*0.8);
        return new Rect(-this.width/2, -box.h, this.width, box.h);
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
        var subtreeBoxes: {[key:string]: Rect} = {};

        _.each(this.dockingPoints, (dockingPoint, dockingPointName) => {
            if (dockingPoint.child != null) {
                dockingPoint.child.scale = this.scale * dockingPoint.scale;
                dockingPoint.child._shakeIt();
                boxes[dockingPointName] = dockingPoint.child.boundingBox(); // NB: This only looks at the direct child!
                subtreeBoxes[dockingPointName] = dockingPoint.child.subtreeBoundingBox();
            }
        });

        // Calculate our own geometry

        this.width = Math.max(100, _.max(_.pluck(_.values(_.pick(subtreeBoxes, ["numerator", "denominator"])), "w")));

        var bbox = this.boundingBox();
        // Set position of all our children.

        if ("numerator" in boxes) {
            var p = this.dockingPoints["numerator"].child.position;
            var fullNumeratorWidth = subtreeBoxes["numerator"].w;
            var numeratorRootWidth = boxes["numerator"].w;
            var numeratorFullDescent = subtreeBoxes["numerator"].y + subtreeBoxes["numerator"].h;

            p.x = numeratorRootWidth/2 - fullNumeratorWidth/2;
            p.y = -bbox.h/2 - this.scale * this.s.mBox.w / 4 - numeratorFullDescent;
        }

        if ("denominator" in boxes) {
            var p = this.dockingPoints["denominator"].child.position;
            var fullDenominatorWidth = subtreeBoxes["denominator"].w;
            var denominatorRootWidth = boxes["denominator"].w;
            var denominatorFullAscent = subtreeBoxes["denominator"].y;

            p.x = denominatorRootWidth/2 - fullDenominatorWidth/2;
            p.y = -bbox.h / 2 + this.scale * this.s.mBox.w / 4 - denominatorFullAscent;
        }

        if ("right" in boxes) {
            var p = this.dockingPoints["right"].child.position;
            p.x = this.width / 2 + boxes["right"].w / 2 + this.scale*this.s.mBox.w/4; // TODO: Tweak this with kerning.
            p.y = 0;
        } else {
            var p = this.dockingPoints["right"].position;
            p.x = this.width / 2 + this.scale*this.s.mBox.w/4;
            p.y = -this.boundingBox().h/2;
        }
    }
}