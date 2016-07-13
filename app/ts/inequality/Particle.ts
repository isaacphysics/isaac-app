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
    protected particle: string;
    protected type: string;
    protected pythonSymbol: string;
    protected latexSymbol: string;
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
        }


    }

    getExpression(format: string): string {
        var expression = "";
        if (format == "latex") {
            expression = (this instanceof Particle) ? (this.latexSymbol) : "\\text{" + this.particle + "}";// need to remove this so that we can append the element to mass/proton numbers
            // TODO: add support for mass/proton number, decide if we render both simultaneously or separately.
            // Should we render one if the other is ommitted? - for now, no.
            if (this.dockingPoints["mass_number"].child != null && this.dockingPoints["proton_number"].child != null) {
                expression = "";
                var mass_number_length = this.dockingPoints["mass_number"].child.getExpression(format).length;
                var proton_number_length = this.dockingPoints["proton_number"].child.getExpression(format).length;
                var number_of_spaces = Math.abs(proton_number_length - mass_number_length);
                var padding = "";
                // Temporary hack to align mass number and proton number correctly.
                for (var _i = 0; _i < number_of_spaces; _i++) {
                    padding += "\\enspace";
                }
                expression += (mass_number_length <= proton_number_length) ? "{}^{" + padding + this.dockingPoints["mass_number"].child.getExpression(format) + "}_{" + this.dockingPoints["proton_number"].child.getExpression(format) + "}\\text{" + this.particle + "}" : "{}^{" + this.dockingPoints["mass_number"].child.getExpression(format) + "}_{" + padding + this.dockingPoints["proton_number"].child.getExpression(format) + "}\\text{" + this.particle + "}";
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
        } else if (format == "python") {
            expression = ""
        } else if (format == "subscript") {
            expression = "" + this.particle;
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
            expression = this.particle; // need to remove this so that we can append the element to mass/proton numbers
            // TODO: add support for mass/proton number, decide if we render both simultaneously or separately.
            // Should we render one if the other is ommitted? - for now, no.
            if (this.dockingPoints["mass_number"].child != null && this.dockingPoints["proton_number"].child != null) {
                expression = "";
                expression += "^{" + this.dockingPoints["mass_number"].child.getExpression(format) + "}_{" + this.dockingPoints["proton_number"].child.getExpression(format) + "}" + this.particle;
            }
            if (this.dockingPoints["superscript"].child != null) {
                expression += this.dockingPoints["superscript"].child.getExpression(format);
            }
            if (this.dockingPoints["subscript"].child != null) {
                expression += this.dockingPoints["subscript"].child.getExpression(format);
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



}
