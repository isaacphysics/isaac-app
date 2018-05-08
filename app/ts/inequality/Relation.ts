/*
Copyright 2016 Andrea Franceschini <andrea.franceschini@gmail.com>
               Andrew Wells <aw684@cam.ac.uk>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

///// <reference path="../../typings/p5.d" />
///// <reference path="../../typings/lodash.d" />

/* tslint:disable: no-unused-variable */
/* tslint:disable: comment-format */

import { Widget, Rect } from './Widget';
import { Symbol } from './Symbol';
import { DockingPoint } from "./DockingPoint";
import { Brackets } from "./Brackets";

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
    protected mathmlSymbol: string;

    get typeAsString(): string {
        return "Relation";
    }

    /**
     * There's a thing with the baseline and all that... this sort-of fixes it.
     *
     * @returns {Vector} The position to which a Symbol is meant to be docked from.
     */
    get dockingPoint(): p5.Vector {
        return this.p.createVector(0, -this.scale*this.s.xBox_h/2);
    }

    constructor(p: any, s: any, relation: string) {
        super(p, s);
        this.s = s;
        this.relationString = relation;
        switch (relation) {
            case 'rightarrow':
                this.relation = '→';
                this.mhchemSymbol = '->';
                this.latexSymbol = '\\rightarrow ';
                break;
            case 'leftarrow':
                this.relation = '←';
                this.latexSymbol = '\\leftarrow ';
                break;
            case 'rightleftarrows':
                this.relation = '⇄';
                this.latexSymbol = '\\rightleftarrows ';
                break;
            case 'equilibrium':
                this.relation = '⇌';
                this.mhchemSymbol = '<=>';
                this.latexSymbol = '\\rightleftharpoons ';
                break;
            case '<=':
                this.relation = '≤';
                this.pythonSymbol = '<=';
                this.latexSymbol = '\\leq ';
                this.mathmlSymbol = '&#x2264;';
                break;
            case '>=':
                this.relation = '≥';
                this.pythonSymbol = '>=';
                this.latexSymbol = '\\geq ';
                this.mathmlSymbol = '&#x2265;';
                break;
            case '<':
                this.relation = '<';
                this.pythonSymbol = '<';
                this.latexSymbol = '<';
                this.mathmlSymbol = '&lt;';
                break;
            case '>':
                this.relation = '>';
                this.pythonSymbol = '>';
                this.latexSymbol = '> ';
                this.mathmlSymbol = '&gt;';
                break;
            case '=':
                this.relation = '=';
                this.pythonSymbol = '==';
                this.latexSymbol = '=';
                break;
            case '.':
                this.relation = '⋅';
                this.mhchemSymbol = ".";
                this.latexSymbol = '\\cdot';
                break;
            default:
                this.relation = relation;
                this.pythonSymbol = relation;
                this.latexSymbol = relation;
        }

        // FIXME Not sure this is entirely right. Maybe make the "type" in DockingPoint an array? Works for now.
        this.docksTo = ['differential', 'operator', 'chemical_element', 'state_symbol', 'particle', "operator_brackets"];
    }

    /**
     * Generates all the docking points in one go and stores them in this.dockingPoints.
     * A Relation has one docking point:
     *
     - _right_: Symbol
     */
    generateDockingPoints() {
        let box = this.boundingBox();
        this.dockingPoints["right"] = new DockingPoint(this, this.p.createVector(box.w/2 + this.s.mBox_w / 4, -this.s.xBox_h/2), 1, ["relation"], "right");
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
        let expression = "";
        if (format == "latex") {
            if (this.dockingPoints["right"].child != null) {
                expression += " " + this.latexSymbol + " " + this.dockingPoints["right"].child.getExpression(format);
            }
        } else if (format == "python") {
            if (this.dockingPoints["right"].child != null) {
                expression += " " + this.pythonSymbol + " " + this.dockingPoints["right"].child.getExpression(format);
            }
        } else if (format == "subscript") {
            if (this.dockingPoints["right"].child != null) {
                expression += this.dockingPoints["right"].child.getExpression(format);
            }
        } else if (format == "mhchem") {
            if (this.dockingPoints["right"].child != null) {
                expression += " " + this.mhchemSymbol + " " + this.dockingPoints["right"].child.getExpression(format);
            }
        } else if (format == "mathml") {
            let rel = this.mathmlSymbol ? this.mathmlSymbol : this.relation;
            if (this.dockingPoints["right"].child != null) {
                expression += '<mo>' + rel + "</mo>" + this.dockingPoints["right"].child.getExpression(format);
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
        // Equals sign always appears in menu, others require loading
        if (this.relation == "=") {
            return '';
        } else if (this.pythonSymbol) {
            return this.pythonSymbol;
        }
        return '';
    }

    /** Paints the widget on the canvas. */
    _draw() {
        this.p.fill(this.color).strokeWeight(0).noStroke();

        this.p.textFont(this.s.font_up)
            .textSize(this.s.baseFontSize * 0.8 * this.scale)
            .textAlign(this.p.CENTER, this.p.BASELINE)
            .text(this.relation, 0, 0);
        this.p.strokeWeight(1);
    }

    /**
     * This widget's tight bounding box. This is used for the cursor hit testing.
     *
     * @returns {Rect} The bounding box
     */
    boundingBox(): Rect {
        let s = this.relation || "=";
        let box = this.s.font_up.textBounds(s, 0, 0, this.scale*this.s.baseFontSize*0.8);
        return new Rect(-box.w/2, box.y, box.w, box.h);
    }

    /**
     * Internal companion method to shakeIt(). This is the one that actually does the work, and the one that should be
     * overridden by children of this class.
     *
     * @private
     */
    _shakeIt() {
        this._shakeItDown();
        let thisBox = this.boundingBox();

        if (this.dockingPoints["right"]) {
            let dp = this.dockingPoints["right"];
            if (dp.child) {
                let child = dp.child;
                child.position.x = thisBox.x + thisBox.w + child.leftBound + this.dockingPointSize/2;
                child.position.y = this.dockingPoint.y - child.dockingPoint.y;
            } else {
                dp.position.x = thisBox.x + thisBox.w + this.dockingPointSize;
                dp.position.y = -this.scale*this.s.xBox_h/2;
            }
        }
    }
}
