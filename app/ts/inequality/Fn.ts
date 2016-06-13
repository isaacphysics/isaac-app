import { Widget, Rect } from './Widget.ts'
import { BinaryOperation } from "./BinaryOperation.ts";
import { DockingPoint } from "./DockingPoint.ts";

/** Functions. */
export
class Fn extends Widget {

    protected s: any;
    protected name: string;
    protected custom: boolean;
    protected innerSuperscript: boolean;
    protected allowSubscript: boolean;

    get typeAsString(): string {
        return "Fn";
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

    constructor(p:any, s:any, name:string, custom:boolean, allowSubscript:boolean, innerSuperscript:boolean) {
        super(p, s);
        this.name = name;
        this.custom = custom;
        this.s = s;
        this.allowSubscript = allowSubscript;
        this.innerSuperscript = innerSuperscript;

        // Override docking points created in super constructor
        this.dockingPoints = {};
        this.generateDockingPoints();

        this.docksTo = ['symbol', 'operator', 'exponent'];
    }

    /**
     * Generates all the docking points in one go and stores them in this.dockingPoints.
     * A Function has four docking points, although some may be disabled.
     *
     * - _right_: Binary operation (addition, subtraction), Symbol (multiplication)
     * - _subscript_: Subscript, or base, for \log
     * - _superscript_: Exponent 
     * - _argument_: Argument (duh?)
     */
    generateDockingPoints() {
        var box = this.s.font_up.textBounds(this.name || '', 0, 1000, this.scale * this.s.baseFontSize);
        var bracketBox = this.s.font_up.textBounds('(', 0, 1000, this.scale * this.s.baseFontSize);

        this.dockingPoints["argument"] = new DockingPoint(this, this.p.createVector(box.w/2 + bracketBox.w, -this.s.xBox.h/2), 1, "symbol");
        this.dockingPoints["right"] = new DockingPoint(this, this.p.createVector(box.w/2 + this.scale * this.s.mBox.w / 4 + this.scale * 20, -this.s.xBox.h / 2), 1, "operator");

        if (this.allowSubscript) {
            this.dockingPoints["subscript"] = new DockingPoint(this, this.p.createVector(box.w/2, 0), 0.666, "symbol");
        }
        if (this.innerSuperscript) {
            this.dockingPoints["superscript"] = new DockingPoint(this, this.p.createVector(box.w/2, -bracketBox.h), 0.666, "symbol");
        } else {
            // This is where we would generate the 'outer' superscript docking point, should we ever need it.
            // If we ever do this, we'll need to change all the Math.max calls below.
        }
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
            if('argument' in this.dockingPoints && this.dockingPoints['argument'].child) {
                var sub = '';
                if('subscript' in this.dockingPoints && this.dockingPoints['subscript'].child) {
                    sub += '_{' + this.dockingPoints['subscript'].child.getExpression(format) + '}';
                }
                var sup = '';
                if('superscript' in this.dockingPoints && this.dockingPoints['superscript'].child) {
                    sup += '^{' + this.dockingPoints['superscript'].child.getExpression(format) + '}';
                }

                var esc = this.custom ? "" : "\\";

                expression += esc + this.name + sup + sub + '(' + this.dockingPoints['argument'].child.getExpression(format) + ')';
                if('right' in this.dockingPoints && this.dockingPoints['right'].child) {
                    expression += this.dockingPoints['right'].child.getExpression(format);
                }
            }
        } else if (format == "python") {
            if('argument' in this.dockingPoints && this.dockingPoints['argument'].child) {
                if(this.name == 'ln' || this.name == 'log') {
                    if('subscript' in this.dockingPoints && this.dockingPoints['subscript'].child) {
                        // Logarithm with base
                        expression += this.name + '(' + this.dockingPoints['argument'].child.getExpression(format) + ', ' + this.dockingPoints['subscript'].child.getExpression(format) + ')';
                    } else {
                        expression += this.name + '(' + this.dockingPoints['argument'].child.getExpression(format) + ')';
                    }
                } else {
                    if('subscript' in this.dockingPoints && this.dockingPoints['subscript'].child) {
                        // Function with subscript
                        expression += this.name + '_' + this.dockingPoints['subscript'].child.getExpression(format) + '(' + this.dockingPoints['argument'].child.getExpression(format) + ')';
                    } else {
                        expression += this.name + '(' + this.dockingPoints['argument'].child.getExpression(format) + ')';
                    }
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
            }
        } else if (format == 'mathml') {
            if('argument' in this.dockingPoints && this.dockingPoints['argument'].child) {
                var right = ('right' in this.dockingPoints && this.dockingPoints['right'].child) ? this.dockingPoints['right'].child.getExpression(format) : '';
                if('subscript' in this.dockingPoints && this.dockingPoints['subscript'].child) {
                    if(this.dockingPoints['subscript'].child instanceof Number) {
                        expression += '<mrow><msub><mi>' + this.name + '</mi><mrow><mn>' + this.dockingPoints['subscript'].child.getExpression(format) + '</mn></mrow></msub><mfenced open="(" close=")"><mrow>' + this.dockingPoints['argument'].child.getExpression(format) + '</mrow></mfenced>' + right + '</mrow>';
                    } else {
                        expression += '<mrow><msub><mi>' + this.name + '</mi><mrow><mi>' + this.dockingPoints['subscript'].child.getExpression(format) + '</mi></mrow></msub><mfenced open="(" close=")"><mrow>' + this.dockingPoints['argument'].child.getExpression(format) + '</mrow></mfenced>' + right + '</mrow>';
                    }
                } else {
                    expression += '<mrow><mi>' + this.name + '</mi><mfenced open="(" close=")"><mrow>' + this.dockingPoints['argument'].child.getExpression(format) + '</mrow></mfenced>' + right + '</mrow>';
                }
            }
        }
        return expression;
    }

    properties(): Object {
        return {
            name: this.name,
            custom: this.custom,
            innerSuperscript: this.innerSuperscript,
            allowSubscript: this.allowSubscript,
        };
    }

    token() {
        return this.name + "()";
    }

    /** Paints the widget on the canvas. */
    _draw() {
        var argWidth = this.s.xBox.w;
        if(this.dockingPoints['argument'].child) {
            argWidth = this.s.xBox.w/2 + this.dockingPoints['argument'].child.subtreeBoundingBox().w;
        }
        var subWidth = 0;
        if('subscript' in this.dockingPoints && this.dockingPoints['subscript'].child) {
            subWidth = this.dockingPoints['subscript'].child.subtreeBoundingBox().w;
        }
        var supWidth = 0;
        if('superscript' in this.dockingPoints && this.dockingPoints['superscript'].child) {
            supWidth = this.dockingPoints['superscript'].child.subtreeBoundingBox().w;
        }
        this.p.fill(this.color).strokeWeight(0).noStroke();

        this.p.textFont(this.custom ? this.s.font_it : this.s.font_up)
            .textSize(this.s.baseFontSize * this.scale)
            .textAlign(this.p.CENTER, this.p.BASELINE);
        this.p.text(this.name, 0, 0);

        var box = this.s.font_up.textBounds(this.name || '', 0, 1000, this.scale * this.s.baseFontSize);
        var bracketBox = this.s.font_up.textBounds('(', 0, 1000, this.scale * this.s.baseFontSize);
        this.p.textFont(this.s.font_up)
            .textSize(this.s.baseFontSize * this.scale)
            .textAlign(this.p.RIGHT, this.p.BASELINE);
        this.p.text('(', box.w - bracketBox.w + Math.max(subWidth,supWidth), 0);
        this.p.text(')', box.w + argWidth + Math.max(subWidth,supWidth), 0);

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
        var box = this.s.font_up.textBounds(this.name+'()' || '', 0, 1000, this.scale * this.s.baseFontSize);
        var argWidth = this.s.xBox.w;
        if('argument' in this.dockingPoints && this.dockingPoints['argument'].child) {
            argWidth = this.dockingPoints['argument'].child.subtreeBoundingBox().w;
        }
        var subWidth = 0;
        if('subscript' in this.dockingPoints && this.dockingPoints['subscript'].child) {
            subWidth = this.dockingPoints['subscript'].child.subtreeBoundingBox().w;
        }
        var supWidth = 0;
        if('superscript' in this.dockingPoints && this.dockingPoints['superscript'].child) {
            supWidth = this.dockingPoints['superscript'].child.subtreeBoundingBox().w;
        }

        var bracketsBox = this.s.font_up.textBounds('()', 0, 1000, this.scale * this.s.baseFontSize);
        var width = box.w;
        var dpWidth = 0;
        return new Rect(-width/2 + bracketsBox.w/2, box.y - 1000, width + argWidth + Math.max(subWidth,supWidth) + dpWidth, Math.max(box.h, bracketsBox.h));
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
        // box.y -= 1000;
        var bracketBox = this.s.font_up.textBounds('(', 0, 1000, this.scale * this.s.baseFontSize);
        var stBox = this.subtreeBoundingBox();
        var descent = (box.y + box.h);

        var widest = 0;
        var subWidth = 0;
        var supWidth = 0;

        if("subscript" in boxes) {
            var p = this.dockingPoints['subscript'].child.position = this.p.createVector(box.w/2 + this.dockingPoints['subscript'].child.offsetBox().w/2, -this.dockingPoint.y);
            subWidth = this.dockingPoints['subscript'].child.subtreeBoundingBox().w;
        } else if ("subscript" in this.dockingPoints) {
            this.dockingPoints['subscript'].position = this.p.createVector(box.w/2, -this.dockingPoint.y);
        }
        if("superscript" in boxes) {
            let p = this.dockingPoints['superscript'].child.position = this.p.createVector(box.w/2 + this.dockingPoints['superscript'].child.offsetBox().w/2, -Math.max(box.h, bracketBox.h)-(this.dockingPoint.y));
            supWidth = this.dockingPoints['superscript'].child.subtreeBoundingBox().w;
        } else if ("superscript" in this.dockingPoints) {
            this.dockingPoints['superscript'].position = this.p.createVector(box.w/2, -Math.max(box.h, bracketBox.h)-(this.dockingPoint.y));
            console.log(box.y, box.h);
        }

        if("argument" in boxes) {
            var p:any = this.dockingPoints["argument"].child.position;
            var w = this.dockingPoints["argument"].child.offsetBox().w;
            p.x = box.w/2 + bracketBox.w + Math.max(subWidth,supWidth) + this.dockingPoints["argument"].child.offsetBox().w/2;
            p.y = 0;
            widest += w;
        } else {
            this.dockingPoints["argument"].position = this.p.createVector(box.w/2 + bracketBox.w + Math.max(subWidth,supWidth) + this.s.xBox.w/2, -this.s.xBox.h/2);
        }

        // TODO: Tweak this with kerning.
        if ("right" in boxes) {
            var p:any = this.dockingPoints["right"].child.position;
            p.x = this.boundingBox().w - this.offsetBox().w/2 + this.s.xBox.w/2 + this.dockingPoints["right"].child.offsetBox().w/2;
            p.y = 0;
        } else {
            var p:any = this.dockingPoints["right"].position;
            p.x = this.boundingBox().w - this.offsetBox().w/2 + this.s.xBox.w;
            p.y = -this.s.xBox.h / 2;
        }
    }

    offsetBox() {
        return this.custom ? this.s.font_it.textBounds(this.name, 0, 1000, this.scale * this.s.baseFontSize): this.s.font_up.textBounds(this.name, 0, 1000, this.scale * this.s.baseFontSize);
    }
}