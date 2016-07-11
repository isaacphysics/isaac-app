import { Widget, Rect } from './Widget.ts'
import { BinaryOperation } from "./BinaryOperation.ts";
import { DockingPoint } from "./DockingPoint.ts";
import { Relation } from "./Relation.ts";
import { Num } from "./Num.ts";

/** A class for representing variables and constants (aka, elements). */
export
    class ChemicalElement extends Widget {

    protected s: any;
    private element: string;

    get typeAsString(): string {
        return "ChemicalElement";
    }

    /**
     * There's a thing with the baseline and all that... this sort-of fixes it.
     *
     * @returns {Vector} The position to which a ChemicalElement is meant to be docked from.
     */
    get dockingPoint(): p5.Vector {
        var box = this.s.font_it.textBounds("x", 0, 1000, this.scale * this.s.baseFontSize);
        return this.p.createVector(0, - box.h / 2);
    }

    constructor(p: any, s: any, element: string) {
        super(p, s);
        this.element = element;
        this.s = s;

        this.docksTo = ['ChemicalElement', 'operator', 'symbol'];
    }

    /**
     * Generates all the docking points in one go and stores them in this.dockingPoints.
     * A ChemicalElement has three docking points:
     *
     * - _right_: Binary operation (addition, subtraction), ChemicalElement (multiplication)
     * - _superscript_: Exponent
     * - _subscript_: Subscript (duh?)
     */
    generateDockingPoints() {
        var box = this.boundingBox();
        var descent = this.position.y - (box.y + box.h);

        // Create the docking points - added mass number and proton number
        // TODO: add a flag to toggle the mass/proton number docking points? e.g. boolean nuclearMode
        this.dockingPoints["right"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.s.mBox.w / 4, -this.s.xBox.h / 2), 1, "operator", "right");
        this.dockingPoints["superscript"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.scale * 20, -this.scale * this.s.mBox.h), 0.666, "exponent", "superscript");
        this.dockingPoints["subscript"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.scale * 20, descent), 0.666, "subscript", "subscript");
        this.dockingPoints["mass_number"] = new DockingPoint(this, this.p.createVector(0, 0), 0.666, "top-left", "mass_number");
        this.dockingPoints["proton_number"] = new DockingPoint(this, this.p.createVector(0, 0), 0.666, "bottom-left", "proton_number");
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

    // todo add mhchem with \alpha etc
    getExpression(format: string): string {
        var expression = "";
        if (format == "latex") {
            expression = "\\text{" + this.element + "}";// need to remove this so that we can append the element to mass/proton numbers
            // TODO: add support for mass/proton number, decide if we render both simultaneously or separately.
            // Should we render one if the other is ommitted? - for now, no.
            if (this.dockingPoints["mass_number"].child != null && this.dockingPoints["proton_number"].child != null) {
                expression = "";
                var mass_number_length = this.dockingPoints["mass_number"].child.getExpression(format).length;
                var proton_number_length = this.dockingPoints["proton_number"].child.getExpression(format).length;
                var number_of_spaces = Math.abs(proton_number_length - mass_number_length);
                var padding = "";
                // Temporary hack to align mass number and proton number correctly.
                for (var _i = 0; _i < number_of_spaces; _i++) {
                    padding += "\\enspace";
                }
                expression += (mass_number_length <= proton_number_length) ? "{}^{" + padding + this.dockingPoints["mass_number"].child.getExpression(format) + "}_{" + this.dockingPoints["proton_number"].child.getExpression(format) + "}\\text{" + this.element + "}" : "{}^{" + this.dockingPoints["mass_number"].child.getExpression(format) + "}_{" + padding + this.dockingPoints["proton_number"].child.getExpression(format) + "}\\text{" + this.element + "}";
            }
            if (this.dockingPoints["superscript"].child != null) {
                expression += "^{" + this.dockingPoints["superscript"].child.getExpression(format) + "}";
            }
            if (this.dockingPoints["subscript"].child != null) {
                expression += "_{" + this.dockingPoints["subscript"].child.getExpression(format) + "}";
            }
            if (this.dockingPoints["right"].child != null) {
                if (this.dockingPoints["right"].child instanceof BinaryOperation) {
                    expression += this.dockingPoints["right"].child.getExpression(format);
                }
                else if (this.dockingPoints["right"].child instanceof Relation) {
                    expression += this.dockingPoints["right"].child.getExpression(format);
                } else {
                    // WARNING This assumes it's a ChemicalElement, hence produces a multiplication
                    expression += this.dockingPoints["right"].child.getExpression(format);
                }
            }
        } else if (format == "python") {
            expression = ""
        } else if (format == "subscript") {
            expression = "" + this.element;
            if (this.dockingPoints["subscript"].child != null) {
                expression += this.dockingPoints["subscript"].child.getExpression(format);
            }
            if (this.dockingPoints["superscript"].child != null) {
                expression += this.dockingPoints["superscript"].child.getExpression(format);
            }
            if (this.dockingPoints["right"].child != null) {
                expression += this.dockingPoints["right"].child.getExpression(format);
            }
        } else if (format == "python") {
            expression = "";
        } else if (format == "mathml") {
            expression = '';
        } else if (format == "mhchem") {
            expression = this.element; // need to remove this so that we can append the element to mass/proton numbers
            // TODO: add support for mass/proton number, decide if we render both simultaneously or separately.
            // Should we render one if the other is ommitted? - for now, no.
            if (this.dockingPoints["mass_number"].child != null && this.dockingPoints["proton_number"].child != null) {
                expression = "";
                expression += "^{" + this.dockingPoints["mass_number"].child.getExpression(format) + "}_{" + this.dockingPoints["proton_number"].child.getExpression(format) + "}" + this.element;
            }
            if (this.dockingPoints["superscript"].child != null) {
                expression += this.dockingPoints["superscript"].child.getExpression(format);
            }
            if (this.dockingPoints["subscript"].child != null) {
                expression += this.dockingPoints["subscript"].child.getExpression(format);
            }
            if (this.dockingPoints["right"].child != null) {
                if (this.dockingPoints["right"].child instanceof BinaryOperation) {
                    expression += this.dockingPoints["right"].child.getExpression(format);
                }
                else if (this.dockingPoints["right"].child instanceof Relation) {
                    expression += this.dockingPoints["right"].child.getExpression(format);
                } else {
                    // WARNING This assumes it's a ChemicalElement, hence produces a multiplication
                    expression += this.dockingPoints["right"].child.getExpression(format);
                }
            }
        }
        return expression;
    }

    properties(): Object {
        return {
            element: this.element
        };
    }

    token() {
        // TODO Handle greek elements
        var e = this.element;
        if (this.dockingPoints['subscript'].child) {
            e += '_' + this.dockingPoints['subscript'].child.getExpression('subscript');
        }
        return e;
    }

    /** Paints the widget on the canvas. */
    _draw() {
        this.p.fill(this.color).strokeWeight(0).noStroke();

        this.p.textFont(this.s.font_up)
            .textSize(this.s.baseFontSize * this.scale)
            .textAlign(this.p.CENTER, this.p.BASELINE)
            .text(this.element, 0, 0);
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
        var box = this.s.font_it.textBounds(this.element || "x", 0, 1000, this.scale * this.s.baseFontSize);
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

        // Nothing to do for ChemicalElement

        // Set position of all our children.

        var box = this.boundingBox();
        var descent = (box.y + box.h);

        var widest = 0;

        if ("superscript" in boxes) {
            var p = this.dockingPoints["superscript"].child.position;
            var offsetBox = this.dockingPoints["superscript"].child.offsetBox();
            var w = offsetBox.w;

            var childDescent = offsetBox.y + offsetBox.h;
            widest = this.dockingPoints["superscript"].child.subtreeBoundingBox().w;
            // this is the position of the docking point.
            p.x = (box.w + w) / 2;
            p.y = 0 - this.s.mBox.h * this.scale;
        } else {
            var p = this.dockingPoints["superscript"].position;
            p.x = (box.w + this.s.xBox.w) / 2;
            p.y = -this.s.mBox.h * this.scale;
        }


        // Positioned top left side of element.
        if ("mass_number" in boxes) {
            var p = this.dockingPoints["mass_number"].child.position;
            var offsetBox = this.dockingPoints["mass_number"].child.offsetBox();
            var w = offsetBox.w;

            console.log(w);
            var childDescent = offsetBox.y + offsetBox.h;
            widest = this.dockingPoints["mass_number"].child.subtreeBoundingBox().w;
            // this is the position of the docking point.
            p.x = 0 - (box.w + w) * .53; //(box.w / 2 + this.scale * 20 + childDescent);
            p.y = 0 - box.w / 2;
        } else {
            var p = this.dockingPoints["mass_number"].position;
            p.x = 0 - (box.w / 2 + this.scale * 20);
            p.y = 0 - this.s.mBox.h * this.scale;
        }




        if ("subscript" in boxes) {
            var p = this.dockingPoints["subscript"].child.position;
            var w = this.dockingPoints["subscript"].child.offsetBox().w;
            widest = Math.max(this.dockingPoints["subscript"].child.subtreeBoundingBox().w, widest);
            p.x = box.w / 2 + this.dockingPoints["subscript"].child.boundingBox().w/2;
            p.y = this.scale * this.s.mBox.w / 4;
        } else {
            var p = this.dockingPoints["subscript"].position;
            p.x = box.w / 2 + this.scale * 20;
            p.y = descent;
        }
        // Positioned bottom left side of element.
        if ("proton_number" in boxes) {
            var p = this.dockingPoints["proton_number"].child.position;
            var w = this.dockingPoints["proton_number"].child.offsetBox().w;
            widest = Math.max(this.dockingPoints["proton_number"].child.subtreeBoundingBox().w, widest);
            p.x = 0 - (box.w + w) * .53;
            p.y = (box.w / 2) * .6;
        } else {
            var p = this.dockingPoints["proton_number"].position;
            p.x = 0 - (box.w / 2 + this.scale * 20);
            p.y = descent;
        }




        if ("right" in boxes) {
            var p = this.dockingPoints["right"].child.position;
            var child_width = this.dockingPoints["right"].child.boundingBox().w;
            console.log("Child width: " + child_width);
            var parent_superscript_width = 0;
            var parent_subscript_width = 0;
            if (this.dockingPoints["superscript"].child != null) {
              parent_superscript_width = this.dockingPoints["superscript"].child.getExpressionWidth();
            }
            if (this.dockingPoints["subscript"].child != null) {
              parent_subscript_width = this.dockingPoints["subscript"].child.getExpressionWidth();
            }

            console.log("Parent superscript width: " + parent_subscript_width);
            console.log("Parent subscript width: " + parent_subscript_width);
            var parent_width = this.boundingBox().w;
            console.log("Parent width before ammending: " + parent_width);
            // If either subscripts or superscripts or both exist
            parent_width += (parent_subscript_width >= parent_superscript_width) ? parent_subscript_width : parent_superscript_width;
            console.log("Parent width after ammending: " + parent_width);
            p.x = (parent_width == this.boundingBox().w) ? (parent_width/2 + child_width/2) : (parent_width-this.boundingBox().w/2+child_width/2);
            p.y = 0;
        } else {
            var p = this.dockingPoints["right"].position;
            p.x = box.w / 2 + this.scale * this.s.mBox.w / 4 + widest;
            p.y = -this.s.xBox.h / 2;
        }
    }

    /**
     * @returns {Widget[]} A flat array of the children of this widget, as widget objects
     */
    getChildren(): Array<Widget> {
        return _.compact(_.pluck(_.values(_.omit(this.dockingPoints, "subscript")), "child"));
    }
}
