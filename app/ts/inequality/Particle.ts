/*
Copyright 2016 Andrew Wells <aw684@cam.ac.uk>

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

import { Widget, Rect } from './Widget'
import { BinaryOperation } from "./BinaryOperation";
import { DockingPoint } from "./DockingPoint";
import { Relation } from "./Relation";
import { Num } from "./Num";
import {ChemicalElement} from "./ChemicalElement";
import { Brackets } from "./Brackets";
/** A class for representing variables and constants (aka, particles). */
export
    class Particle extends Widget {

    protected s: any;
    protected type: string;
    protected pythonSymbol: string;
    protected latexSymbol: string;
    protected particle: string;
    protected mhchemSymbol: string;

    get typeAsString(): string {
        return "Particle";
    }

    properties(): Object {
        return {
            particle: this.particle,
            type: this.type
        };
    }

    token() {
        // TODO Handle greek elements
        let e = this.particle;
        // if (this.dockingPoints['subscript'].child) {
        //     e += '_' + this.dockingPoints['subscript'].child.getExpression('subscript');
        // }
        return e;
    }
    /**
     * There's a thing with the baseline and all that... this sort-of fixes it.
     *
     * @returns {Vector} The position to which a ChemicalElement is meant to be docked from.
     */
    get dockingPoint(): p5.Vector {
        let box = this.s.font_it.textBounds("x", 0, 1000, this.scale * this.s.baseFontSize);
        return this.p.createVector(0, - box.h / 2);
    }

    constructor(p: any, s: any, particle: string, type: string) {
        super(p, s);
        this.type = type;

        switch (type) {
            case 'alpha':
                this.particle = 'α';
                this.pythonSymbol = '\\alpha';
                this.mhchemSymbol = '\\alphaparticle';
                this.latexSymbol = '\\alpha';
                break;
            case 'beta':
                this.particle = 'β';
                this.pythonSymbol = '\\beta';
                this.mhchemSymbol = '\\betaparticle';
                this.latexSymbol = '\\beta';
                break;
            case 'gamma':
                this.particle = 'γ';
                this.pythonSymbol = '\\gamma';
                this.mhchemSymbol = '\\gammaray';
                this.latexSymbol = '\\gamma';
                break;
            case 'neutrino':
                this.particle = 'ν';
                this.pythonSymbol = '\\neutrino';
                this.mhchemSymbol = '\\neutrino';
                this.latexSymbol = '\\nu';
                break;
            case 'antineutrino':
                this.particle = 'ν̅';
                this.pythonSymbol = '\\antineutrino';
                this.mhchemSymbol = '\\antineutrino';
                this.latexSymbol = '\\bar{\\nu}';
                break;
            case 'proton':
                this.particle = 'p';
                this.pythonSymbol = '\\proton';
                this.mhchemSymbol = '\\proton';
                this.latexSymbol = '\\text{p}';
                break;
            case 'neutron':
                this.particle = 'n';
                this.pythonSymbol = '\\neutron';
                this.mhchemSymbol = '\\neutron';
                this.latexSymbol = '\\text{n}';
                break;
            case 'electron':
                this.particle = 'e';
                this.pythonSymbol = '\\electron';
                this.mhchemSymbol = '\\electron';
                this.latexSymbol = '\\text{e}';
                break;
            default:
                this.particle = particle;
                this.pythonSymbol = particle;
                this.latexSymbol = particle;
                this.mhchemSymbol = particle;
        }
        this.docksTo = ['operator', 'relation', 'symbol'];
    }

    generateDockingPoints() {
        let box = this.boundingBox();
        let descent = this.position.y - (box.y + box.h);

        // Create the docking points - added mass number and proton number
        // TODO: add a flag to toggle the mass/proton number docking points? e.g. boolean nuclearMode
        this.dockingPoints["right"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.s.mBox.w / 4, -this.s.xBox.h / 2), 1, ["particle"], "right");
        this.dockingPoints["superscript"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.scale * 20, -this.scale * this.s.mBox.h), 0.666, ["exponent"], "superscript");
        this.dockingPoints["subscript"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.scale * 20, descent), 0.666, ["subscript"], "subscript");
        this.dockingPoints["mass_number"] = new DockingPoint(this, this.p.createVector(0, 0), 0.666, ["top-left"], "mass_number");
        this.dockingPoints["proton_number"] = new DockingPoint(this, this.p.createVector(0, 0), 0.666, ["bottom-left"], "proton_number");
    }

    getExpression(format: string): string {
        let expression = "";
        if (format == "latex") {
            expression = this.latexSymbol;
            //  KaTeX doesn't support the mhchem package so padding is used to align proton number correctly.
            if (this.dockingPoints["mass_number"].child != null && this.dockingPoints["proton_number"].child != null) {
                expression = "";
                let mass_number_length = this.dockingPoints["mass_number"].child.getExpression(format).length;
                let proton_number_length = this.dockingPoints["proton_number"].child.getExpression(format).length;
                let number_of_spaces = Math.abs(proton_number_length - mass_number_length);
                let padding = "";
                // Temporary hack to align mass number and proton number correctly.
                for (let _i = 0; _i < number_of_spaces; _i++) {
                    padding += "\\enspace";
                }
                expression += (mass_number_length <= proton_number_length) ? "{}^{" + padding + this.dockingPoints["mass_number"].child.getExpression(format) + "}_{" + this.dockingPoints["proton_number"].child.getExpression(format) + "}" + this.latexSymbol : "{}^{" + this.dockingPoints["mass_number"].child.getExpression(format) + "}_{" + padding + this.dockingPoints["proton_number"].child.getExpression(format) + "}" + this.latexSymbol;
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
        } else if (format == "subscript") {
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
            expression = this.mhchemSymbol; // need to remove this so that we can append the element to mass/proton numbers
            // TODO: add support for mass/proton number, decide if we render both simultaneously or separately.
            // Should we render one if the other is ommitted? - for now, no.
            if (this.dockingPoints["mass_number"].child != null && this.dockingPoints["proton_number"].child != null) {
                expression = "";
                expression += "{}^{" + this.dockingPoints["mass_number"].child.getExpression(format) + "}_{" + this.dockingPoints["proton_number"].child.getExpression(format) + "}" + this.mhchemSymbol;
            }
            if (this.dockingPoints["subscript"].child != null) {
                expression += this.dockingPoints["subscript"].child.getExpression(format);
            }
            if (this.dockingPoints["superscript"].child != null) {
                expression += "^{" + this.dockingPoints["superscript"].child.getExpression(format) + "}";
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

    /** Paints the widget on the canvas. */
    _draw() {
        this.p.fill(this.color).strokeWeight(0).noStroke();

        this.p.textFont(this.s.font_up)
            .textSize(this.s.baseFontSize * this.scale)
            .textAlign(this.p.CENTER, this.p.BASELINE)
            .text(this.particle, 0, 0);
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
        if (this.pythonSymbol == '\\antineutrino') {
            return new Rect(-36.72 / 2, -73.44, 36.72, 73.44);
        }

        else {
            let box = this.s.font_it.textBounds(this.particle || "x", 0, 1000, this.s.baseFontSize);
            return new Rect(-box.w / 2, box.y - 1000, box.w, box.h);
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
        let boxes: { [key: string]: Rect } = {};

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

        let box = this.boundingBox();
        let descent = (box.y + box.h);



        let box = this.boundingBox();
        let parent_position = (box.y + box.h);
        let parent_superscript_width = (this.dockingPoints["superscript"].child != null) ? (this.dockingPoints["superscript"].child.getExpressionWidth()) : 0;
        let parent_subscript_width = (this.dockingPoints["subscript"].child != null) ? (this.dockingPoints["subscript"].child.getExpressionWidth()) : 0;
        let parent_width = box.w;
        let parent_height = box.h;
        let child_height;
        let child_width;
        let docking_right = this.dockingPoints["right"];
        let docking_superscript = this.dockingPoints["superscript"];
        let docking_subscript = this.dockingPoints["subscript"];
        let docking_mass = this.dockingPoints["mass_number"];
        let docking_proton_number = this.dockingPoints["proton_number"];

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
