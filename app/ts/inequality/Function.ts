import { Widget, Rect } from './Widget.ts'
// import { Symbol } from "./Symbol.ts";
// import { BinaryOperation } from "./BinaryOperation.ts";
import { DockingPoint } from "./DockingPoint.ts";
import { Fraction } from './Fraction.ts';

/** Functions. */
export
class Function extends Widget {

    protected s: any;
    protected name: string;
    protected upright: boolean;

    get typeAsString(): string {
        return "Function";
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

    constructor(p:any, s:any, name:string, upright:boolean) {
        super(p, s);
        this.name = name;
        this.upright = upright;
        this.s = s;

        this.docksTo = ['symbol', 'operator', 'exponent'];
    }

    /**
     * Generates all the docking points in one go and stores them in this.dockingPoints.
     * A Function has three docking points:
     *
     * - _right_: Binary operation (addition, subtraction), Symbol (multiplication)
     * - _subscript_: Subscript, or base, for \log
     * - _argument_: Argument (duh?)
     */
    generateDockingPoints() {
        var box = this.s.font_up.textBounds(this.name || '', 0, 1000, this.scale * this.s.baseFontSize);
        var bracketBox = this.s.font_up.textBounds('(', 0, 1000, this.scale * this.s.baseFontSize);

        this.dockingPoints["argument"] = new DockingPoint(this, this.p.createVector(box.w/2 + bracketBox.w, -this.s.xBox.h/2), 1, "symbol");
        this.dockingPoints["right"] = new DockingPoint(this, this.p.createVector(box.w/2 + this.scale * this.s.mBox.w / 4 + this.scale * 20, -this.s.xBox.h / 2), 1, "operator");
        this.dockingPoints["subscript"] = new DockingPoint(this, this.p.createVector(0, 0), 0.666, "symbol");
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
                var sub = '';
                if('subscript' in this.dockingPoints && this.dockingPoints['subscript'].child) {
                    sub += '_{' + this.dockingPoints['subscript'].child.getExpression(format) + '}';
                }
                var esc = '';
                switch(this.name) {
                    case 'ln':
                    case 'log':
                        esc = '\\';
                        break;
                }
                expression += esc + this.name + sub + '(' + this.dockingPoints['argument'].child.getExpression(format) + ')';
            }
        } else if (format == "python") {
        } else if (format == "subscript") {
            expression += "{FUNCTION}";
        } else if (format == 'mathml') {
        }
        return expression;
    }

    properties(): Object {
        return {
            name: this.name,
            upright: this.upright
        };
    }

    token() {
        return '';
    }

    /** Paints the widget on the canvas. */
    _draw() {
        var argWidth = this.s.xBox.w;
        if(this.dockingPoints['argument'].child) {
            argWidth = this.dockingPoints['argument'].child.subtreeBoundingBox().w;
        }
        this.p.fill(this.color).strokeWeight(0).noStroke();

        this.p.textFont(this.upright ? this.s.font_up : this.s.font_it)
            .textSize(this.s.baseFontSize * this.scale)
            .textAlign(this.p.CENTER, this.p.BASELINE);
        this.p.text(this.name, 0, 0);

        var box = this.s.font_up.textBounds(this.name || '', 0, 1000, this.scale * this.s.baseFontSize);
        var bracketBox = this.s.font_up.textBounds('(', 0, 1000, this.scale * this.s.baseFontSize);
        this.p.textFont(this.s.font_up)
            .textSize(this.s.baseFontSize * this.scale)
            .textAlign(this.p.RIGHT, this.p.BASELINE);
        // FIXME Include subscript width
        this.p.text('(', box.w - bracketBox.w, 0);
        this.p.text(')', box.w + argWidth, 0);

        // this.p.text('(', -argWidth/2, 0);
        //
        // this.p.textFont(this.s.font_up)
        //     .textSize(this.s.baseFontSize * this.scale)
        //     .textAlign(this.p.LEFT, this.p.BASELINE);
        // this.p.text(')', argWidth/2 + this.scale*40, 0); // FIXME This 40 is hard-coded

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
        var box = this.s.font_up.textBounds(this.name || '', 0, 1000, this.scale * this.s.baseFontSize);
        var argWidth = this.s.xBox.w;
        if('argument' in this.dockingPoints && this.dockingPoints['argument'].child) {
            argWidth = this.dockingPoints['argument'].child.subtreeBoundingBox().w;
        }
        var bracketsWidth = this.s.font_up.textBounds('()', 0, 1000, this.scale * this.s.baseFontSize).w;
        var width = box.w;// + argWidth;
        var dpWidth = 0;// this.scale * 40;
        return new Rect(-width/2, box.y - 1000, width + bracketsWidth + argWidth + dpWidth, box.h);  // FIXME This 40 is hard-coded
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

        var box = this.s.font_up.textBounds(this.name, 0, 1000, this.scale * this.s.baseFontSize);
        var bracketBox = this.s.font_up.textBounds('(', 0, 1000, this.scale * this.s.baseFontSize);
        var stBox = this.subtreeBoundingBox();
        var descent = (box.y + box.h);

        var widest = 0;

        if("argument" in boxes) {
            var p = this.dockingPoints["argument"].child.position;
            var w = boxes["argument"].w;
            var offset = 0;
            // Hardcoded. Tough luck.
            if(this.dockingPoints['argument'].child instanceof Fraction) {
                offset = this.dockingPoints['argument'].child.boundingBox().w/2 - bracketBox.w;
            }
            p.x = offset + box.w/2 + 2*bracketBox.w;
            p.y = 0;
            widest += w;
        } else {
            this.dockingPoints["argument"].position = this.p.createVector(box.w/2 + 2*bracketBox.w, -this.s.xBox.h/2);
        }

        // TODO: Tweak this with kerning.
        if ("right" in boxes) {
            var p = this.dockingPoints["right"].child.position;
            p.x = box.w / 2 + this.scale * this.s.mBox.w / 4 + this.dockingPoints["right"].child.boundingBox().w/2;
            p.y = 0;
        } else {
            var p = this.dockingPoints["right"].position;
            p.x = stBox.w;//box.w / 2 + this.scale * this.s.mBox.w / 4 + this.scale * 20;
            p.y = -this.s.xBox.h / 2;
        }
    }
}