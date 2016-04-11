import { Widget, Rect } from './Widget.ts';
import { Symbol } from './Symbol.ts';
import { DockingPoint } from "./DockingPoint.ts";

/**
 * Binary operations, such as plus and minus.
 *
 * BE EXTRA CAREFUL with the minus sign: use "−" (U+2212), not just a dash.
 */
export
class BinaryOperation extends Widget {
    protected s: any;
    protected operation: string;

    get typeAsString(): string {
        return "BinaryOperation";
    }

    /**
     * There's a thing with the baseline and all that... this sort-of fixes it.
     *
     * @returns {Vector} The position to which a Symbol is meant to be docked from.
     */
    get dockingPoint(): p5.Vector {
        var p = this.p.createVector(0, -this.s.xBox.h/2);
        return p;
    }

    constructor(p: any, s: any, operation: string) {
        this.s = s;
        this.operation = operation;
        super(p, s);

        // FIXME Not sure this is entirely right. Maybe make the "type" in DockingPoint an array? Works for now.
        this.docksTo = ['operator', 'symbol'];
    }

    /**
     * Generates all the docking points in one go and stores them in this.dockingPoints.
     * A Binary Operation has one docking point:
     *
      - _right_: Symbol
     */
    generateDockingPoints() {
        var box = this.boundingBox();
        var descent = this.position.y - (box.y + box.h);

        this.dockingPoints["right"] = new DockingPoint(this, this.p.createVector(box.w/2 + this.s.mBox.w/4, -this.s.xBox.h/2), 1, "symbol");
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
            if (this.dockingPoints["right"].child != null) {
                expression += this.operation + "" + this.dockingPoints["right"].child.getExpression(format);
            }
        } else if(format == "python") {
            if (this.dockingPoints["right"].child != null) {
                expression += this.operation + "" + this.dockingPoints["right"].child.getExpression(format);
            }
        } else if(format == "subscript") {
            if (this.dockingPoints["right"].child != null) {
                expression += this.dockingPoints["right"].child.getExpression(format);
            }
        }
        return expression;
    }

    properties(): Object {
        return {
            operation: this.operation
        };
    }

    /** Paints the widget on the canvas. */
    _draw() {
        this.p.fill(0).strokeWeight(0).noStroke();

        this.p.textFont(this.s.font_up)
            .textSize(this.s.baseFontSize*0.8 * this.scale)
            .textAlign(this.p.CENTER, this.p.BASELINE)
            .text(this.operation, 0, 0);
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
        var s = this.operation || "+";
        if (s == "−") {
            s = "+";
        }

        var box = this.s.font_up.textBounds(s, 0, 1000, this.scale * this.s.baseFontSize*0.8);
        return new Rect(-box.w, box.y-1000, box.w*2, box.h); // TODO: Assymetrical BBox
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

        if ("right" in boxes) {
            var p = this.dockingPoints["right"].child.position;
            p.y = 0;
            p.x = box.w / 2 + boxes["right"].w / 2; // TODO: Tweak this with kerning.
        }
    }
}