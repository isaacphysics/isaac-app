import { Widget, Rect } from './Widget.ts'
import { DockingPoint } from "./DockingPoint.ts";
import { BinaryOperation } from "./BinaryOperation.ts";

/** Functions. */
export
class TrigFunction extends Widget {

    protected s: any;
    protected name: string;
    protected upright: boolean;

    get typeAsString(): string {
        return "TrigFunction";
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
     * - _superscript_: Exponent
     * - _argument_: Argument (duh?)
     */
    generateDockingPoints() {
        var box = this.s.font_up.textBounds(this.name || '', 0, 1000, this.scale * this.s.baseFontSize);
        var bracketBox = this.s.font_up.textBounds('(', 0, 1000, this.scale * this.s.baseFontSize);

        this.dockingPoints["argument"] = new DockingPoint(this, this.p.createVector(box.w/2 + bracketBox.w, -this.s.xBox.h/2), 1, "symbol");
        this.dockingPoints["right"] = new DockingPoint(this, this.p.createVector(box.w/2 + this.scale * this.s.mBox.w / 4 + this.scale * 20, -this.s.xBox.h / 2), 1, "operator");
        this.dockingPoints["superscript"] = new DockingPoint(this, this.p.createVector(box.w/2, -box.h), 0.666, "symbol");
    }

    /**
     * Generates the expression corresponding to this widget and its subtree.
     *
     * The `superscript` format is a special one for generating symbols that will work with the sympy checker. It squashes
     * everything together, ignoring operations and all that jazz.
     *
     * @param format A string to specify the output format. Supports: latex, python, superscript.
     * @returns {string} The expression in the specified format.
     */
    getExpression(format: string): string {
        // TODO Triple check
        var expression = "";
        if (format == "latex") {
            if('argument' in this.dockingPoints && this.dockingPoints['argument'].child) {
                var sup = '';
                if('superscript' in this.dockingPoints && this.dockingPoints['superscript'].child) {
                    sup += '^{' + this.dockingPoints['superscript'].child.getExpression(format) + '}';
                }
                var esc = '';
                switch(this.name) {
                    case 'ln':
                    case 'log':
                        esc = '\\';
                        break;
                }
                expression += esc + this.name + sup + '(' + this.dockingPoints['argument'].child.getExpression(format) + ')';
                if('right' in this.dockingPoints && this.dockingPoints['right'].child) {
                    expression += this.dockingPoints['right'].child.getExpression(format);
                }
            }
        } else if (format == "python") {
            if('argument' in this.dockingPoints && this.dockingPoints['argument'].child) {
                expression += this.name + '(' + this.dockingPoints['argument'].child.getExpression(format) + ')';
            }
            if('superscript' in this.dockingPoints && this.dockingPoints['superscript'].child) {
                expression += '**(' + this.dockingPoints['superscript'].child.getExpression(format) + ')';
            }
            if('right' in this.dockingPoints && this.dockingPoints['right'].child) {
                if(!(this.dockingPoints['right'].child instanceof BinaryOperation)) {
                    expression += this.dockingPoints['right'].child.getExpression(format);
                } else {
                    expression += '*' + this.dockingPoints['right'].child.getExpression(format);
                }
            }
        } else if (format == "subscript") {
            expression += "{FUNCTION}";
        } else if (format == 'mathml') {
            if('argument' in this.dockingPoints && this.dockingPoints['argument'].child) {
                var right = ('right' in this.dockingPoints && this.dockingPoints['right'].child) ? this.dockingPoints['right'].child.getExpression(format) : '';
                if('superscript' in this.dockingPoints && this.dockingPoints['superscript'].child) {
                    if(this.dockingPoints['superscript'].child instanceof Number) {
                        expression += '<mrow><msup><mi>' + this.name + '</mi>' + this.dockingPoints['superscript'].child.getExpression(format) + '</msup><mo>(</mo><mrow>' + this.dockingPoints['argument'].child.getExpression(format) + '</mrow><mo>)</mo>' + right + '</mrow>';
                    } else {
                        expression += '<mrow><msup><mi>' + this.name + '</mi>' + this.dockingPoints['superscript'].child.getExpression(format) + '</msup><mo>(</mo><mrow>' + this.dockingPoints['argument'].child.getExpression(format) + '</mrow><mo>)</mo>' + right + '</mrow>';
                    }
                } else {
                    expression += '<mrow><mi>' + this.name + '</mi><mo>(</mo><mrow>' + this.dockingPoints['argument'].child.getExpression(format) + '</mrow><mo>)</mo>' + right + '</mrow>';
                }
            }
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
            argWidth = this.s.xBox.w/2 + this.dockingPoints['argument'].child.subtreeBoundingBox().w;
        }
        var supWidth = 0;
        if('superscript' in this.dockingPoints && this.dockingPoints['superscript'].child) {
            supWidth = this.dockingPoints['superscript'].child.subtreeBoundingBox().w;
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
        this.p.text('(', box.w - bracketBox.w + supWidth, 0);
        this.p.text(')', box.w + argWidth + supWidth, 0);

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
        var supWidth = 0;
        if('superscript' in this.dockingPoints && this.dockingPoints['superscript'].child) {
            supWidth = this.dockingPoints['superscript'].child.subtreeBoundingBox().w;
        }
        var bracketsWidth = this.s.font_up.textBounds('()', 0, 1000, this.scale * this.s.baseFontSize).w;
        var width = box.w;// + argWidth;
        var dpWidth = 0;// this.scale * 40;
        return new Rect(-width/2, box.y - 1000, width + bracketsWidth + argWidth + supWidth + dpWidth, box.h);  // FIXME This 40 is hard-coded
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
        var supWidth = 0;

        if("superscript" in boxes) {
            var p = this.dockingPoints['superscript'].child.position = this.p.createVector(box.w/2 + this.dockingPoints['superscript'].child.offsetBox().w/2, -box.h);
            supWidth = this.dockingPoints['superscript'].child.subtreeBoundingBox().w;
        } else {
            this.dockingPoints['superscript'].position = this.p.createVector(box.w/2, -box.h);
        }

        if("argument" in boxes) {
            var p = this.dockingPoints["argument"].child.position;
            var w = this.dockingPoints["argument"].child.offsetBox().w;
            p.x = box.w/2 + bracketBox.w + supWidth + this.dockingPoints["argument"].child.offsetBox().w/2;
            p.y = 0;
            widest += w;
        } else {
            this.dockingPoints["argument"].position = this.p.createVector(box.w/2 + bracketBox.w + supWidth + this.s.xBox.w/2, -this.s.xBox.h/2);
        }

        // TODO: Tweak this with kerning.
        if ("right" in boxes) {
            var p = this.dockingPoints["right"].child.position;
            p.x = this.boundingBox().w - this.offsetBox().w/2 + this.s.xBox.w/2 + this.dockingPoints["right"].child.offsetBox().w/2;
            p.y = 0;
        } else {
            var p = this.dockingPoints["right"].position;
            p.x = this.boundingBox().w - this.offsetBox().w/2 + this.s.xBox.w;
            p.y = -this.s.xBox.h / 2;
        }
    }

    offsetBox() {
        return this.upright ? this.s.font_up.textBounds(this.name, 0, 1000, this.scale * this.s.baseFontSize) : this.s.font_it.textBounds(this.name, 0, 1000, this.scale * this.s.baseFontSize);
    }
}