import { Widget, Rect } from './Widget.ts'
import { BinaryOperation } from "./BinaryOperation.ts";
import { DockingPoint } from "./DockingPoint.ts";
import { Relation } from "./Relation.ts";
import { Num } from "./Num.ts";
import { Brackets } from "./Brackets.ts";
import { Fraction } from "./Fraction.ts";
import { StateSymbol } from "./StateSymbol.ts";

/** A class for representing chemical elements. */
export
    class ChemicalElement extends Widget {

    protected s: any;
    protected element: string;



    get typeAsString(): string {
        return "ChemicalElement";
    }

    /**
     * There's a thing with the baseline and all that... this sort-of fixes it.
     *
     * @returns {Vector} The position to which a ChemicalElement is meant to be docked from.
     */
    get dockingPoint(): p5.Vector {
        var box = this.s.font_it.textBounds("X", 0, 1000, this.scale * this.s.baseFontSize);
        return this.p.createVector(0, - box.h / 2);
    }

    constructor(p: any, s: any, element: string) {
        super(p, s);
        this.element = element;
        this.s = s;
        this.docksTo = ['ChemicalElement', 'operator', 'relation', 'symbol', 'chemical_element', "operator_brackets"];
    }

    /**
     * Generates all the docking points in one go and stores them in this.dockingPoints.
     * A ChemicalElement has five docking points:
     *
     * - _right_: Binary operation (addition, subtraction), ChemicalElement (multiplication)
     * - _superscript_: Exponent
     * - _subscript_: Subscript (duh?)
     * - mass_number: the number of protons and neutrons the element has
     * - proton_number: the number of protons the element has (crazy, right?)
     */
    generateDockingPoints() {
        var box = this.boundingBox();
        var descent = this.position.y - (box.y + box.h);

        // Create the docking points
        this.dockingPoints["right"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.s.mBox.w / 4, -this.s.xBox.h / 2), 1, "chemical_element", "right");
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

    getExpression(format: string): string {
        var expression = "\\text{" + this.element + "}";

        var isParticle = (this.element[0] != '\\');
        if (format == "latex") {
            expression = "\\text{" + this.element + "}";
            // Need to remove this so that we can append the element to mass/proton numbers
            // Renders the mass number first if present, otherwise just renders the element.
            // KaTeX doesn't support the mhchem package so padding is used to display nuclear equations correctly.
            if (this.dockingPoints["mass_number"].child != null || this.dockingPoints["proton_number"].child != null) {
                expression = "";
                var mass_number_length = 0;
                var proton_number_length = 0;
                if (this.dockingPoints["proton_number"].child != null && this.dockingPoints["mass_number"].child != null) {
                    proton_number_length = this.dockingPoints["proton_number"].child.getExpression(format).length;
                    mass_number_length = this.dockingPoints["mass_number"].child.getExpression(format).length;
                    var number_of_spaces = Math.abs(proton_number_length - mass_number_length);
                    var padding = "";
                    // Temporary hack to align mass number and proton number correctly.
                    for (var _i = 0; _i < number_of_spaces; _i++) {
                        padding += "\\enspace";
                    }
                    expression = (mass_number_length <= proton_number_length) ? "{}^{" + padding + this.dockingPoints["mass_number"].child.getExpression(format) + "}_{" + this.dockingPoints["proton_number"].child.getExpression(format) + "}\\text{" + this.element + "}" : "{}^{" + this.dockingPoints["mass_number"].child.getExpression(format) + "}_{" + padding + this.dockingPoints["proton_number"].child.getExpression(format) + "}\\text{" + this.element + "}";
                } else if (this.dockingPoints["mass_number"].child != null) {
                    expression = "{}^{" + this.dockingPoints["mass_number"].child.getExpression(format) + "}_{}\\text{" + this.element + "}";
                } else if (this.dockingPoints["proton_number"].child != null) {
                    expression = "{}^{}_{" + this.dockingPoints["proton_number"].child.getExpression(format) + "}\\text{" + this.element + "}";
                }
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
                }
                else {
                    // WARNING This assumes it's a ChemicalElement, hence produces a multiplication
                    expression += this.dockingPoints["right"].child.getExpression(format);
                }
            }
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
        // } else if (format == "python") {
        //     expression = "";
        } else if (format == "mathml") {
            var m_superscript = this.dockingPoints['superscript'].child != null ? "<mrow>" + this.dockingPoints['superscript'].child.getExpression(format) + "</mrow>" : "<none />";
            var m_subscript = this.dockingPoints['subscript'].child != null ? "<mrow>" + this.dockingPoints['subscript'].child.getExpression(format) + "</mrow>" : "<none />";
            var m_mass_number = this.dockingPoints['mass_number'].child != null ? "<mrow>" + this.dockingPoints['mass_number'].child.getExpression(format) + "</mrow>" : "<none />";
            var m_proton_number = this.dockingPoints['proton_number'].child != null ? "<mrow>" + this.dockingPoints['proton_number'].child.getExpression(format) + "</mrow>" : "<none />";
            expression = '';
            if (m_subscript == "<none />" && m_superscript == "<none />" && m_mass_number == "<none />" && m_proton_number == "<none />") {
                expression += '<mi>' + this.element + '</mi>';
            } else  {
                expression += "<mmultiscripts>" + "<mi>" + this.element + "</mi>" + m_subscript + m_superscript;
                expression += "<mprescripts />" + m_proton_number + m_mass_number + "</mmultiscripts>"
            }
            if (this.dockingPoints['right'].child != null) {
                expression += this.dockingPoints['right'].child.getExpression('mathml');
            }
        } else if (format == "mhchem") {
            expression = this.element;
            if (this.dockingPoints["mass_number"].child != null && this.dockingPoints["proton_number"].child != null) {
                expression = "";
                expression += "{}^{" + this.dockingPoints["mass_number"].child.getExpression(format) + "}_{" + this.dockingPoints["proton_number"].child.getExpression(format) + "}" + this.element;
            }
            if (this.dockingPoints["subscript"].child != null) {
                expression += this.dockingPoints["subscript"].child.getExpression(format);
            }
            if (this.dockingPoints["superscript"].child != null) {
                expression += "^{" + this.dockingPoints["superscript"].child.getExpression(format) + "}";
            }
            if (this.dockingPoints["right"].child != null) {
                if (this.dockingPoints["right"].child instanceof BinaryOperation) {
                    expression += " " + this.dockingPoints["right"].child.getExpression(format) + " ";
                }
                else if (this.dockingPoints["right"].child instanceof Relation) {
                    expression += " " + this.dockingPoints["right"].child.getExpression(format) + " ";
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
        // if (this.dockingPoints['subscript'].child) {
        //     e += '_' + this.dockingPoints['subscript'].child.getExpression('subscript');
        // }
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

        var box = this.s.font_it.textBounds(this.element || "X", 0, 1000, this.scale * this.s.baseFontSize);
        return new Rect(-box.w/2, box.y - 1000, box.w, box.h);
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
        var docking_mass = this.dockingPoints["mass_number"];
        var docking_proton_number = this.dockingPoints["proton_number"];

        if ("superscript" in boxes) {
            child_width = docking_superscript.child.boundingBox().w;
            child_height = docking_superscript.child.boundingBox().h;
            docking_superscript.child.position.x = (parent_width / 2 + child_width / 2);
            docking_superscript.child.position.y = -0.7 * (parent_height / 2 + child_height / 2);
        } else {
            docking_superscript.position.x = (parent_width == this.boundingBox().w) ? (parent_width / 2 + this.scale * 20) : (parent_width - this.boundingBox().w / 2 + this.scale * 20);
            docking_superscript.position.y = -this.scale * this.s.mBox.h;
        }

        if ("subscript" in boxes) {
            child_width = docking_subscript.child.boundingBox().w;
            child_height = docking_subscript.child.boundingBox().h;
            docking_subscript.child.position.x = (parent_width / 2 + child_width / 2);
            docking_subscript.child.position.y = 0.7 * (parent_height / 2 + child_height / 5);
        } else {
            docking_subscript.position.x = (parent_width == this.boundingBox().w) ? (parent_width / 2 + this.scale * 20) : (parent_width - this.boundingBox().w / 2 + this.scale * 20);
            docking_subscript.position.y = parent_position;
        }


        if ("mass_number" in boxes) {
            child_width = docking_mass.child.boundingBox().w;
            child_height = docking_mass.child.boundingBox().h;
            docking_mass.child.position.x = 0 - 1.1 * (parent_width / 2 + child_width / 2);
            docking_mass.child.position.y = -0.7 * (parent_height / 2 + child_height / 2);
        } else {
            docking_mass.position.x = (parent_width == this.boundingBox().w) ? (0 - (parent_width / 2 + this.scale * 20)) : (-parent_width + this.boundingBox().w / 2 - this.scale * 20);
            docking_mass.position.y = -this.scale * this.s.mBox.h;
        }

        // Positioned bottom left side of element.
        if ("proton_number" in boxes) {
            child_width = docking_proton_number.child.boundingBox().w;
            child_height = docking_proton_number.child.boundingBox().h;
            docking_proton_number.child.position.x = -1.1 * (parent_width / 2 + child_width / 2);
            docking_proton_number.child.position.y = 0.7 * (parent_height / 2 + child_height / 5);
        } else {
            docking_proton_number.position.x = (parent_width == this.boundingBox().w) ? (-parent_width / 2 - this.scale * 20) : (-parent_width + this.boundingBox().w / 2 - this.scale * 20);
            docking_proton_number.position.y = parent_position;
        }




        parent_width += (parent_subscript_width >= parent_superscript_width) ? parent_subscript_width : parent_superscript_width;

        if ("right" in boxes) {
            child_width = docking_right.child.boundingBox().w;
            docking_right.child.position.x = (parent_width == this.boundingBox().w) ? (parent_width / 2 + child_width / 2) : (parent_width - this.boundingBox().w / 2 + child_width / 2);
            docking_right.child.position.y = 0;
            // FIXME HORRIBLE BRACKETS FIX
            if (docking_right.child instanceof Brackets) {
                docking_right.child.position.y = docking_right.child.dockingPoints["argument"].child ? -docking_right.child.dockingPoints["argument"].child.boundingBox().h/2 : 0;
            }
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
