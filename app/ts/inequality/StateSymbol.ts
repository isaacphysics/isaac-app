import { Widget, Rect } from './Widget.ts';
import { Symbol } from './Symbol.ts';
import { DockingPoint } from "./DockingPoint.ts";

/**
 * A class for state symbols.
 */
export
    class StateSymbol extends Widget {
    protected s: any;
    protected stateString: string;
    protected state: string;
    protected pythonSymbol: string;
    protected latexSymbol: string;
    protected mhchemSymbol: string;


    get typeAsString(): string {
        return "StateSymbol";
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

    constructor(p: any, s: any, state: string) {
        super(p, s);
        this.s = s;
        this.stateString = state;
        this.state = state;
        switch (state) {
            case 'aqueous':
                this.state = '(aq)';
                this.mhchemSymbol = '(aq)'
                this.latexSymbol = '\\text{(aq)}';
                break;
            case 'gas':
                this.state = '(g)';
                this.mhchemSymbol = '(g)'
                this.latexSymbol = '\\text{(g)}';
                break;
            case 'solid':
                this.state = '(s)';
                this.mhchemSymbol = '(s)'
                this.latexSymbol = '\\text{(s)}';
                break;
            case 'liquid':
                this.state = '(l)';
                this.mhchemSymbol = '(l)'
                this.latexSymbol = '\\text{(l)}';
                break;
            case 'metal':
                this.state = '(m)';
                this.mhchemSymbol = '(m)'
                this.latexSymbol = '\\text{(m)}';
                break;
            default:
                this.state = state;
                this.mhchemSymbol = state;
                this.latexSymbol = "\\text{" + state + "}";
        }

        // FIXME Not sure this is entirely right. Maybe make the "type" in DockingPoint an array? Works for now.
        this.docksTo = ['chemical_element', "operator_brackets"];
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

        this.dockingPoints["right"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.s.mBox.w / 4, -this.s.xBox.h / 2), 1, "state_symbol", "right");
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
            expression += this.latexSymbol;
            if (this.dockingPoints["right"].child != null) {
                expression += this.dockingPoints["right"].child.getExpression(format);
            }
        // } else if (format == "python") {
        //     if (this.dockingPoints["right"].child != null) {
        //         expression += this.dockingPoints["right"].child.getExpression(format);
        //     }
        } else if (format == "subscript") {
            if (this.dockingPoints["right"].child != null) {
                expression += this.dockingPoints["right"].child.getExpression(format);
            }
        } else if (format == "mhchem") {
            expression += this.mhchemSymbol;
            if (this.dockingPoints["right"].child != null) {
                expression += this.dockingPoints["right"].child.getExpression(format);
            }
        } else if (format == "mathml") {
            if (this.dockingPoints["right"].child != null) {
                expression += '<mo>' + this.state + "</mo>" + this.dockingPoints["right"].child.getExpression(format);
            }
        }
        return expression;
    }

    properties(): Object {
        return {
            state: this.stateString
        };
    }

    token() {
        return "";
    }

    /** Paints the widget on the canvas. */
    _draw() {
        this.p.fill(this.color).strokeWeight(0).noStroke();

        this.p.textFont(this.s.font_up)
            .textSize(this.s.baseFontSize * 0.8 * this.scale)
            .textAlign(this.p.CENTER, this.p.BASELINE)
            .text(this.state, 0, 0);
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
        var box = this.s.font_it.textBounds(this.state || "x", 0, 1000, this.s.baseFontSize);
        return new Rect(-(box.w - 10) / 2, box.y - 1000, box.w - 10, box.h);
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

        var box = this.boundingBox();

        if ("right" in boxes) {
            var p = this.dockingPoints["right"].child.position;
            var child_width = this.dockingPoints["right"].child.boundingBox().w;
            var parent_width = this.boundingBox().w;
            // If either subscripts or superscripts or both exist
            p.x = (parent_width == this.boundingBox().w) ? (parent_width / 2 + child_width / 2) : (parent_width - this.boundingBox().w / 2 + child_width / 2);
            p.y = 0;
        } else {
            var p = this.dockingPoints["right"].position;
            p.x = box.w / 2 + this.scale * this.s.mBox.w / 4;
            p.y = -this.s.xBox.h / 2;
        }
    }
}
