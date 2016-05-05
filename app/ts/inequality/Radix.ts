import { Widget, Rect } from './Widget.ts'
import { Symbol } from "./Symbol.ts";
import { BinaryOperation } from "./BinaryOperation.ts";
import { DockingPoint } from "./DockingPoint.ts";

/** Radix. Or, as they say, the _nth_ principal root of its argument. */
export
class Radix extends Widget {

    protected s: any;

    private baseHeight: number;

    get typeAsString(): string {
        return "Symbol";
    }

    /**
     * There's a thing with the baseline and all that... this sort-of fixes it.
     *
     * @returns {Vector} The position to which a Symbol is meant to be docked from.
     */
    get dockingPoint(): p5.Vector {
        var box = this.s.font_it.textBounds("x", 0, 1000, this.scale * this.s.baseFontSize);
        var p = this.p.createVector(0, - box.h / 2);
        return p;
    }

    constructor(p:any, s:any) {
        super(p, s);
        this.s = s;

        this.docksTo = ['symbol', 'operator', 'exponent'];
        this.baseHeight = this.s.font_up.textBounds("\u221A", 0, 1000, this.scale * this.s.baseFontSize).h;
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
        var pBox = this.s.font_it.textBounds("(", 0, 1000, this.scale * this.s.baseFontSize);

        this.dockingPoints["argument"] =    new DockingPoint(this, this.p.createVector(box.w/2 + this.scale*this.s.xBox.w/2, -this.s.xBox.h/2), 1, "symbol");
        this.dockingPoints["right"] =       new DockingPoint(this, this.p.createVector(box.w + this.scale*this.s.xBox.w/2, -this.s.xBox.h / 2), 1, "operator");
        this.dockingPoints["superscript"] = new DockingPoint(this, this.p.createVector(box.w + this.scale*this.s.xBox.w/2, -(box.h + descent + this.scale * 20)), 0.75, "exponent");
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
        // TODO Triple check
        var expression = "";
        if (format == "latex") {
            if('argument' in this.dockingPoints && this.dockingPoints['argument'].child) {
                expression += '\\sqrt{' + this.dockingPoints['argument'].child.getExpression(format) + '}';
            }
            if('superscript' in this.dockingPoints && this.dockingPoints['superscript'].child) {
                expression += '^{' + this.dockingPoints['superscript'].child.getExpression(format) + '}';
            }
            if('right' in this.dockingPoints && this.dockingPoints['right'].child) {
                expression += this.dockingPoints['right'].child.getExpression(format);
            }
        } else if (format == "python") {
            if('argument' in this.dockingPoints && this.dockingPoints['argument'].child) {
                expression += 'sqrt(' + this.dockingPoints['argument'].child.getExpression(format) + ')';
            }
            if('superscript' in this.dockingPoints && this.dockingPoints['superscript'].child) {
                expression += '^(' + this.dockingPoints['superscript'].child.getExpression(format) + ')';
            }
            if('right' in this.dockingPoints && this.dockingPoints['right'].child) {
                expression += this.dockingPoints['right'].child.getExpression(format);
            }
        } else if (format == "subscript") {
            expression += "{SQRT}";
        }
        return expression;
    }

    properties(): Object {
        return { };
    }

    /** Paints the widget on the canvas. */
    _draw() {
        var argWidth = this.s.xBox.w;
        var argHeight = this.baseHeight;
        if(this.dockingPoints['argument'].child) {
            argWidth = this.dockingPoints['argument'].child.subtreeBoundingBox().w;
            argHeight = this.dockingPoints['argument'].child.subtreeBoundingBox().h;
        }
        this.p.fill(this.color).strokeWeight(0).noStroke();

        this.p.textFont(this.s.font_up)
            .textSize(this.s.baseFontSize * this.scale)
            .textAlign(this.p.CENTER, this.p.BASELINE);



        // this.p.scale(1.0, argHeight/this.baseHeight);
        this.p.text('\u221A', 0, 0);
        // this.p.scale(1.0, this.baseHeight/argHeight);

        this.p.noFill(0).strokeWeight(6*this.scale).stroke(this.color);
        var box = this.boundingBox();
        var y =  box.y + 3*this.scale;
        this.p.line(box.x+box.w, y, argWidth+this.scale*box.w/2, y);

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
        var box = this.s.font_up.textBounds("\u221A", 0, 1000, this.scale * this.s.baseFontSize);
        var argHeight = 0;
        // Hooray for short-circuit evaluation?
        if(this.dockingPoints['argument'] && this.dockingPoints['argument'].child && this.dockingPoints['argument'].child.subtreeBoundingBox().h > argHeight) {
            // argHeight = this.dockingPoints['argument'].child.subtreeBoundingBox().h;
        }
        return new Rect(-box.w/2, box.y - 1000 - argHeight/2, box.w, box.h + argHeight);
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

        if("argument" in boxes) {
            var p = this.dockingPoints["argument"].child.position;
            widest = this.dockingPoints["argument"].child.subtreeBoundingBox().w;
            p.x = box.w/2 + boxes["argument"].w/2;
            p.y = 0;
        } else {
            var p = this.dockingPoints["argument"].position;
            p.x = box.w/2 + this.s.xBox.w/2;
            p.y = -this.s.xBox.h/2;
        }

        box = this.boundingBox();

        if ("superscript" in boxes) {
            var p = this.dockingPoints["superscript"].child.position;
            p.x = box.w + Math.max(this.scale*this.s.xBox.w/2, widest);
            p.y = -(box.h - descent - this.scale * this.s.mBox.w / 6);
            widest = Math.max(widest, this.dockingPoints["superscript"].child.subtreeBoundingBox().w);
        } else {
            var p = this.dockingPoints["superscript"].position;
            p.x = box.w + Math.max(this.scale*this.s.xBox.w/2, widest);
            p.y = -(box.h - this.scale * this.s.mBox.w / 6);
        }

        box = this.boundingBox();
        widest = Math.max(widest, this.s.xBox.w);

        // TODO: Tweak this with kerning.
        if ("right" in boxes) {
            var p = this.dockingPoints["right"].child.position;
            p.y = 0;
            p.x = box.w / 2 + this.scale * this.s.mBox.w / 2 + Math.max(widest, this.dockingPoints["right"].child.boundingBox().w/2);
        } else {
            var p = this.dockingPoints["right"].position;
            p.y = -this.s.xBox.h / 2;
            p.x = box.w / 2 + this.scale * this.s.mBox.w / 2 + widest;
        }
    }
}