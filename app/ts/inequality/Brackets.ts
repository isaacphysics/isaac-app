import { Widget, Rect } from './Widget.ts'
import { DockingPoint } from "./DockingPoint.ts";

/** Brackets. "We got both kinds, we got country and western". */
export
class Brackets extends Widget {

    protected s:any;
    private type:string;
    private latexSymbol:Object;
    private pythonSymbol:Object;
    private mhchemSymbol:Object;
    private mathmlSymbol:Object;
    private glyph:Object;

    get typeAsString():string {
        return "Brackets";
    }

    /**
     * There's a thing with the baseline and all that... this sort-of fixes it.
     *
     * @returns {Vector} The position to which a Symbol is meant to be docked from.
     */
    get dockingPoint(): p5.Vector {
        var box = this.s.font_it.textBounds("()", 0, 1000, this.scale * this.s.baseFontSize);
        var p = this.p.createVector(0, 0);
        return p;
    }

    constructor(p: any, s: any, type: string, mode:string) {
        super(p, s, mode);
        this.type = type;
        this.s = s;
        switch (this.type) {
            case 'round':
                this.latexSymbol = {
                    'lhs': '\\left(',
                    'rhs': '\\right)'
                };
                this.mhchemSymbol = this.pythonSymbol = this.mathmlSymbol = this.glyph = {
                    'lhs': '(',
                    'rhs': ')'
                }
                break;
            case "square":
                this.latexSymbol = {
                    'lhs': '\\left[',
                    'rhs': '\\right]'
                };
                this.mhchemSymbol = this.pythonSymbol = this.mathmlSymbol = this.glyph = {
                    'lhs': '[',
                    'rhs': ']'
                }
                break;
            case "curly":
                this.latexSymbol = {
                    'lhs': '\\left{',
                    'rhs': '\\right}'
                };
                this.mhchemSymbol = this.pythonSymbol = this.mathmlSymbol = this.glyph = {
                    'lhs': '{',
                    'rhs': '}'
                };
                break;
            default:
                this.latexSymbol = {};
                this.mhchemSymbol = this.pythonSymbol = this.mathmlSymbol = this.glyph = {};
        }
        console.debug(this.mode);
        this.docksTo = ['symbol', 'operator', 'exponent', 'subscript', 'chemical_element', 'operator_brackets', 'relation'];
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

        // this.dockingPoints["argument"] = new DockingPoint(this, this.p.createVector(0, 0), 1, "symbol", "argument");
        // this.dockingPoints["right"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.scale * this.s.mBox.w / 4 + this.scale * 40, 0), 1, "operator_brackets", "right");
        // this.dockingPoints["superscript"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.scale * this.s.mBox.w / 4 + this.scale * 20, -(box.h + descent + this.scale * 20)), 0.666, "exponent", "superscript");
        this.dockingPoints["argument"] = new DockingPoint(this, this.p.createVector(0, 0), 1, "symbol", "argument");
        // this.dockingPoints["right"] = new DockingPoint(this, this.p.createVector(0, 0), 1, "operator_brackets", "right");
        // this.dockingPoints["superscript"] = new DockingPoint(this, this.p.createVector(0, 0), 0.666, "exponent", "superscript");

        // if(this.mode == 'chemistry') {
        //     this.dockingPoints["subscript"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.scale * 20, -(box.h + descent + this.scale * 20)), 0.666, "subscript", "subscript");
        // } else {
        //     this.dockingPoints["subscript"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.scale * 20, -(box.h + descent + this.scale * 20)), 0.666, "subscript_maths", "subscript");
        // }
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
        var expression = "(\\square)";
        var lhs = '(', rhs = ')';
        if (format == "latex") {
            lhs = this.latexSymbol['lhs'];
            rhs = this.latexSymbol['rhs'];
            if (this.dockingPoints['argument'].child) {
                expression = lhs + this.dockingPoints['argument'].child.getExpression(format) + rhs;
                if ('superscript' in this.dockingPoints && this.dockingPoints['superscript'].child) {
                    expression += '^{' + this.dockingPoints['superscript'].child.getExpression(format) + '}';
                }
                // if (this.dockingPoints['subscript'].child) {
                //     expression += '_{' + this.dockingPoints['subscript'].child.getExpression(format) + '}';
                // }
                if ("right" in this.dockingPoints && this.dockingPoints['right'].child) {
                    expression += this.dockingPoints['right'].child.getExpression(format);
                }
            }
        }
        // if (format == "mhchem") {
        //     lhs = this.mhchemSymbol['lhs'];
        //     rhs = this.mhchemSymbol['rhs'];
        //     if (this.dockingPoints['argument'].child) {
        //         expression += lhs + this.dockingPoints['argument'].child.getExpression(format) + rhs;
        //         // if (this.dockingPoints['subscript'].child) {
        //         //     expression += this.dockingPoints['subscript'].child.getExpression(format);
        //         // }
        //         if (this.dockingPoints['superscript'].child) {
        //             expression += '^{' + this.dockingPoints['superscript'].child.getExpression(format) + '}';
        //         }
        //         if (this.dockingPoints['right'].child) {
        //             expression += this.dockingPoints['right'].child.getExpression(format);
        //         }
        //     }
        // } else if (format == "python") {
        //     lhs = this.pythonSymbol['lhs'];
        //     rhs = this.pythonSymbol['rhs'];
        //     if (this.dockingPoints['argument'].child) {
        //         expression += lhs + this.dockingPoints['argument'].child.getExpression(format) + rhs;
        //         if (this.dockingPoints['superscript'].child) {
        //             expression += '**(' + this.dockingPoints['superscript'].child.getExpression(format) + ')';
        //         }
        //         // if (this.dockingPoints['subscript'].child) {
        //         //     expression += '_(' + this.dockingPoints['subscript'].child.getExpression(format) + ')';
        //         // }
        //         if (this.dockingPoints['right'].child) {
        //             expression += ' ' + this.dockingPoints['right'].child.getExpression(format) + ' ';
        //         }
        //     }
        // } else if (format == "subscript") {
        //     expression += "{BRACKETS}";
        // } else if (format == 'mathml') {
        //     // lhs = this.mathmlSymbol['lhs'];
        //     // rhs = this.mathmlSymbol['rhs'];
        //     // if (this.dockingPoints['argument'].child) {
        //     //     var brackets = '<mfenced open="' + lhs + '" close="' + rhs + '"><mrow>' + this.dockingPoints['argument'].child.getExpression(format) + '</mrow></mfenced>';
        //     //     if (this.dockingPoints['superscript'].child != null && this.dockingPoints["subscript"].child != null) {
        //     //         expression += '<msubsup>' + brackets + '<mrow>' + this.dockingPoints['subscript'].child.getExpression(format) + '</mrow><mrow>' + this.dockingPoints['superscript'].child.getExpression(format) + '</mrow></msubsup>';
        //     //     } else if (this.dockingPoints['superscript'].child != null && this.dockingPoints["subscript"].child == null) {
        //     //         expression = '<msup>' + brackets + '<mrow>' + this.dockingPoints['superscript'].child.getExpression(format) + '</mrow></msup>';
        //     //     } else if (this.dockingPoints['superscript'].child == null && this.dockingPoints["subscript"].child != null) {
        //     //         expression = '<msub>' + brackets + '<mrow>' + this.dockingPoints['subscript'].child.getExpression(format) + '</mrow></msub>';
        //     //     } else {
        //     //         expression = brackets;
        //     //     }
        //     //     if (this.dockingPoints['right'].child) {
        //     //         expression = brackets + this.dockingPoints['right'].child.getExpression(format);
        //     //     }
        //     // }
        // }
        return expression;
    }

    properties(): Object {
        return {
            type: this.type
        };
    }

    token() {
        return '';
    }

    _draw() {
        var bBox = this.boundingBox();
        var sBox = this.subtreeBoundingBox();
        this.p.stroke(this.color).strokeWeight(5);
        this.p.line(bBox.topLeft.x, sBox.topLeft.y, bBox.bottomLeft.x, sBox.bottomLeft.y);
        this.p.line(bBox.topRight.x, sBox.topRight.y, bBox.bottomRight.x, sBox.bottomRight.y);

        this.p.strokeWeight(1);
        if (window.location.hash === "#debug") {
            this.p.stroke(255, 0, 0).noFill();
            this.p.ellipse(0, 0, 10, 10);
            this.p.ellipse(0, 0, 5, 5);

            // this.p.stroke(0, 0, 255).noFill();
            // this.p.ellipse(this.dockingPoint.x, this.dockingPoint.y, 10, 10);
            // this.p.ellipse(this.dockingPoint.x, this.dockingPoint.y, 5, 5);
        }
    }

    boundingBox(): Rect {
        var box = this.s.font_up.textBounds("()", 0, 1000, this.scale * this.s.baseFontSize);
        var argWidth = this.s.xBox.w;
        var argHeight = box.h;
        if ('argument' in this.dockingPoints && this.dockingPoints['argument'].child) {
            let subtreeBB = this.dockingPoints['argument'].child.subtreeBoundingBox();
            argWidth = subtreeBB.w;
            argHeight = _.max([argHeight, subtreeBB.h]);
        }
        var width = box.w + argWidth;
        var newBox = new Rect(-width / 2, box.y-1000, width + this.scale * 40, argHeight);
       return newBox;
    }

    offsetBox(): Rect {
        // var box = this.s.font_up.textBounds("()", 0, 1000, this.scale * this.s.baseFontSize);
        // // return new Rect(-box.w/2, -box.h/2, this.scale*40, box.h);
        // return new Rect(-box.w/2, box.y-1000, this.scale*40, box.h);

        var box = this.boundingBox();
        return new Rect(box.x, box.y, this.scale*40, box.h);
    }

    _shakeIt() {
        _.each(this.dockingPoints, (dockingPoint, dockingPointName) => {
            if (dockingPoint.child != null) {
                dockingPoint.child.scale = this.scale * dockingPoint.scale;
                dockingPoint.child._shakeIt();
            }
        });

        var box = this.boundingBox();

        var widest = 0;
        var descent = (box.y + box.h)/2;

        var superscriptWidth = 0;
        var subscriptWidth = 0;

        if("argument" in this.dockingPoints && this.dockingPoints["argument"].child) {
            var dp = this.dockingPoints["argument"];
            var argumentWidth = dp.child.offsetBox().w;
            var argumentPosition = dp.child.position;
            argumentPosition.x = -dp.child.subtreeBoundingBox().w/2 + argumentWidth/2;
            if(dp.child instanceof Brackets) {
                argumentPosition.y = 0;
            } else {
                argumentPosition.y = dp.child.subtreeBoundingBox().h / 2;
            }
            widest = argumentWidth;
        } else {
            var dp = this.dockingPoints["argument"];
            dp.position = this.p.createVector(0, 0);
        }

        // if ("superscript" in this.dockingPoints && this.dockingPoints["superscript"].child) {
        //     var dp = this.dockingPoints["superscript"];
        //     superscriptWidth = dp.child.boundingBox().w;
        //     dp.child.position.x = (box.w / 2 + this.scale * (40) + superscriptWidth / 2);
        //     dp.child.position.y = - box.h / 2 - dp.child.subtreeBoundingBox().h / 2;
        // } else {
        //     var dp = this.dockingPoints["superscript"];
        //     dp.position = this.p.createVector(box.w / 2 + this.scale * this.s.mBox.w / 4 + this.scale * 20, -(box.h + this.scale * 20));
        //     // dp.position.x = (box.w == this.boundingBox().w) ? (box.w / 2 + this.scale * (40 + 20)) : (box.w - this.boundingBox().w / 2 + this.scale * 40);
        //     // dp.position.y = -box.h / 2 - this.scale * this.s.mBox.h / 2;
        // }

        // if ("subscript" in this.dockingPoints && this.dockingPoints["subscript"].child) {
        //     var dp = this.dockingPoints["subscript"];
        //     subscriptWidth = dp.child.boundingBox().w;
        //     dp.child.position.x = (box.w / 2 + this.scale * (40) + subscriptWidth / dp);
        //     dp.child.position.y =  box.h / 2 + dp.child.subtreeBoundingBox().h / 2;
        // } else {
        //     var dp = this.dockingPoints["subscript"];
        //     dp.position.x = (box.w == this.boundingBox().w) ? (box.w / 2 + this.scale * (40 + 20)) : (box.w - this.boundingBox().w / 2 + this.scale * 40);
        //     dp.position.y = box.h / 2 + this.scale * this.s.mBox.h / 2;
        // }

        var parentWidth = box.w + _.max([subscriptWidth, superscriptWidth]);

        // if ("right" in this.dockingPoints && this.dockingPoints["right"].child) {
        //     var dp = this.dockingPoints["right"];
        //     // var rightWidth = dp.child.boundingBox().w;
        //     // dp.child.position.x = (parentWidth == this.boundingBox().w) ? (parentWidth / 2 + this.scale * (40 + 20) + dp.child.offsetBox().w / 2) : (parentWidth - this.boundingBox().w / 2 + dp.child.offsetBox().w);
        //     // dp.child.position.y = 0;
        //     dp.child.position = this.p.createVector(box.w / 2 + this.scale * this.s.mBox.w / 4 + this.scale * 40, descent);
        // } else {
        //     var dp = this.dockingPoints["right"];
        //     dp.position = this.p.createVector(box.w / 2 + this.scale * this.s.mBox.w / 4 + this.scale * 40, 0);
        //     // dp.position.x = (parentWidth == this.boundingBox().w) ? (parentWidth / 2 + this.scale * (40 + 20)) : (parentWidth - this.boundingBox().w / 2 + this.scale * 40);
        //     // dp.position.y = 0;
        // }


    }
}