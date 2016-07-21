import { Widget, Rect } from './Widget.ts';
import { Symbol } from './Symbol.ts';
import { DockingPoint } from "./DockingPoint.ts";

/**
 * Relations, such as equalities, inequalities, and unexpected friends.
 */
export
    class Relation extends Widget {
    protected s: any;
    protected relationString: string;
    protected relation: string;
    protected pythonSymbol: string;
    protected latexSymbol: string;
    protected mhchemSymbol: string;

    get typeAsString(): string {
        return "Relation";
    }

    /**
     * There's a thing with the baseline and all that... this sort-of fixes it.
     *
     * @returns {Vector} The position to which a Symbol is meant to be docked from.
     */
    get dockingPoint(): p5.Vector {
        var p = this.p.createVector(0, -this.s.xBox.h / 2);
        return p;
    }

    constructor(p: any, s: any, relation: string) {
        super(p, s);
        this.s = s;
        this.relationString = relation;
        switch (relation) {
            case 'rightarrow':
                this.relation = '→';
                this.pythonSymbol = '->';
                this.mhchemSymbol = '->'
                this.latexSymbol = '\\rightarrow ';
                break;
            case 'leftarrow':
                this.relation = '←';
                this.pythonSymbol = '<-';
                this.latexSymbol = '\\leftarrow ';
                break;
            case 'rightleftarrows':
                this.relation = '⇄';
                this.pythonSymbol = '-><-';
                this.latexSymbol = '\\rightleftarrows ';
                break;
            case 'equilibrium':
                this.relation = '⇌';
                this.pythonSymbol = '==';
                this.mhchemSymbol = '<=>'
                this.latexSymbol = '\\rightleftharpoons ';
                break;
            case '<=':
                this.relation = '≤';
                this.pythonSymbol = '<=';
                this.latexSymbol = '\\leq ';
                break;
            case '>=':
                this.relation = '≥';
                this.pythonSymbol = '>=';
                this.latexSymbol = '\\geq ';
                break;
            case '<':
                this.relation = '<';
                this.pythonSymbol = '<';
                this.latexSymbol = '<';
                break;
            case '>':
                this.relation = '>';
                this.pythonSymbol = '>';
                this.latexSymbol = '< ';
                break;
            case '=':
                this.relation = '=';
                this.pythonSymbol = '==';
                this.latexSymbol = '=';
                break;
            case '.':
                this.relation = '⋅';
                this.pythonSymbol = '.';
                this.mhchemSymbol = ".";
                this.latexSymbol = '\\cdot';
                break;
            default:
                this.relation = relation;
                this.pythonSymbol = relation;
                this.latexSymbol = relation;
        }

        // FIXME Not sure this is entirely right. Maybe make the "type" in DockingPoint an array? Works for now.
        this.docksTo = ['operator', 'chemical_element', 'state_symbol', 'particle', "operator_brackets"];
    }

    /**
     * Generates all the docking points in one go and stores them in this.dockingPoints.
     * A Relation has one docking point:
     *
     - _right_: Symbol
     */
    generateDockingPoints() {
        var box = this.boundingBox();
        var descent = this.position.y - (box.y + box.h);

        this.dockingPoints["right"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.s.mBox.w / 4, -this.s.xBox.h / 2), 1, "relation", "right");
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
        console.debug("this", this);
        if (format == "latex") {
            if (this.dockingPoints["right"].child != null) {
                expression += this.latexSymbol + this.dockingPoints["right"].child.getExpression(format);
                console.debug("latexexpression", expression);
            }
        } else if (format == "python") {
            if (this.dockingPoints["right"].child != null) {
                expression += this.pythonSymbol + "" + this.dockingPoints["right"].child.getExpression(format);
            }
        } else if (format == "subscript") {
            if (this.dockingPoints["right"].child != null) {
                expression += this.dockingPoints["right"].child.getExpression(format);
            }
        } else if (format == "mhchem") {
            if (this.dockingPoints["right"].child != null) {
                expression += this.mhchemSymbol + "" + this.dockingPoints["right"].child.getExpression(format);
            }
        } else if (format == "mathml") {
            if (this.dockingPoints["right"].child != null) {
                expression += '<mo>' + this.relation + "</mo>" + this.dockingPoints["right"].child.getExpression(format);
            }
        }
        return expression;
    }

    properties(): Object {
        return {
            relation: this.relationString
        };
    }

    token() {
        return "";//this.relationString;
    }

    /** Paints the widget on the canvas. */
    _draw() {
        this.p.fill(this.color).strokeWeight(0).noStroke();

        this.p.textFont(this.s.font_up)
            .textSize(this.s.baseFontSize * 0.8 * this.scale)
            .textAlign(this.p.CENTER, this.p.BASELINE)
            .text(this.relation, 0, 0);
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
        var s = this.relation || "+";
        if (s == "−") {
            var box = this.s.font_up.textBounds(s, 0, 1000, this.scale * this.s.baseFontSize * 0.8);
            return new Rect(-box.w, box.y - 1000, box.w * 2, box.h); // TODO: Assymetrical BBox
        }
        else if (s == "⋅"){
          s = "⋅";
          var box = this.s.font_up.textBounds(s, 0, 1000, this.scale * this.s.baseFontSize * 0.8);
          return new Rect(-box.w, box.y-1000, box.w * 2, box.h); // TODO: Assymetrical BBox
        }
        else {
          var box = this.s.font_up.textBounds(s, 0, 1000, this.scale * this.s.baseFontSize * 0.8);
          return new Rect(-box.w, box.y - 1000, box.w * 2, box.h); // TODO: Assymetrical BBox
        }
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

        // Nothing to do for Relation

        // Set position of all our children.


        var parent_w = this.boundingBox().w;
        var right;
        if ("right" in boxes) {
            right = this.dockingPoints["right"].child;
            var child_w = right.boundingBox().w;
            var child_mass_w = (right.dockingPoints["mass_number"] && right.dockingPoints["mass_number"].child) ? right.dockingPoints["mass_number"].child.boundingBox().w : 0;
            var child_proton_w = (right.dockingPoints["proton_number"] && right.dockingPoints["proton_number"].child) ? right.dockingPoints["proton_number"].child.boundingBox().w : 0;
            child_w += (child_mass_w >= child_proton_w) ? child_mass_w : child_proton_w;
            right.position.x = parent_w / 2 + child_w / 2;
            right.position.y = 0;

        }
    }
}
