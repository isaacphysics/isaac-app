import { Widget, Rect } from './Widget.ts'
import { BinaryOperation } from "./BinaryOperation.ts";
import { DockingPoint } from "./DockingPoint.ts";
import { Relation } from "./Relation.ts";
import { Num } from "./Num.ts";
import {ChemicalElement} from "./ChemicalElement.ts";
/** A class for representing variables and constants (aka, particles). */
export
    class Particle extends ChemicalElement {

    protected s: any;
    protected type: string;
    protected pythonSymbol: string;

    protected mhchemSymbol: string;

    get typeAsString(): string {
        return "Particle";
    }

    constructor(p: any, s: any, particle: string, type: string) {
        super(p, s, particle);
        this.type = type;

        switch (type) {
            case 'alpha':
                this.particle = 'α';
                this.pythonSymbol = '\\alpha';
                this.mhchemSymbol = '\\alpha';
                this.latexSymbol = '\\alpha';
                break;
            case 'beta':
                this.particle = 'β';
                this.pythonSymbol = '\\beta';
                this.mhchemSymbol = '\\beta';
                this.latexSymbol = '\\beta';
                break;
            case 'gamma':
                this.particle = 'γ';
                this.pythonSymbol = '\\gamma';
                this.mhchemSymbol = '\\gamma';
                this.latexSymbol = '\\gamma';
                break;
            case 'neutrino':
                this.particle = 'ν';
                this.pythonSymbol = '\\neutrino';
                this.mhchemSymbol = '\\neutrino';
                this.latexSymbol = '\\nu';
                break;
            case 'antineutrino':
                this.particle = 'v̅';
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
        }
          this.docksTo = ['operator', 'relation', 'symbol'];
          for(var i in this.docksTo) {
            console.debug(this.docksTo[i]);
          }

    }
    /**
     * This widget's tight bounding box. This is used for the cursor hit testing.
     *
     * @returns {Rect} The bounding box(
     */
    boundingBox(): Rect {
        if (this.pythonSymbol == '\\antineutrino') {
            return new Rect(-36.72 / 2, -73.44, 36.72, 73.44);
        }
        else {
            var box = this.s.font_it.textBounds(this.particle || "x", 0, 1000, this.s.baseFontSize);
            return new Rect(-box.w / 2, box.y - 1000, box.w, box.h);
        }
    }
    generateDockingPoints() {
        var box = this.boundingBox();
        var descent = this.position.y - (box.y + box.h);

        // Create the docking points - added mass number and proton number
        // TODO: add a flag to toggle the mass/proton number docking points? e.g. boolean nuclearMode
        this.dockingPoints["right"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.s.mBox.w / 4, -this.s.xBox.h / 2), 1, "particle", "right");
        this.dockingPoints["superscript"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.scale * 20, -this.scale * this.s.mBox.h), 0.666, "exponent", "superscript");
        this.dockingPoints["subscript"] = new DockingPoint(this, this.p.createVector(box.w / 2 + this.scale * 20, descent), 0.666, "subscript", "subscript");
        this.dockingPoints["mass_number"] = new DockingPoint(this, this.p.createVector(0, 0), 0.666, "top-left", "mass_number");
        this.dockingPoints["proton_number"] = new DockingPoint(this, this.p.createVector(0, 0), 0.666, "bottom-left", "proton_number");
    }




}
