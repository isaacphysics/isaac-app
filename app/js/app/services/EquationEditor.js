/**
 * Copyright 2018 Andrea Franceschini
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
define([], function() {

    let EquationEditor = function EquationEditorConstructor() {

        this.parsePseudoSymbols = function(availableSymbols, r) {
            let theseSymbols = availableSymbols.slice(0).map(s => s.trim());
            let i = 0;
            while (i < theseSymbols.length) {
                if (theseSymbols[i] === '_trigs') {
                    theseSymbols.splice(i, 1, 'cos()', 'sin()', 'tan()');
                    i += 3;
                } else if (theseSymbols[i] === '_1/trigs') {
                    theseSymbols.splice(i, 1, 'cosec()', 'sec()', 'cot()');
                    i += 3;
                } else if (theseSymbols[i] === '_inv_trigs') {
                    theseSymbols.splice(i, 1, 'arccos()', 'arcsin()', 'arctan()');
                    i += 3;
                } else if (theseSymbols[i] === '_inv_1/trigs') {
                    theseSymbols.splice(i, 1, 'arccosec()', 'arcsec()', 'arccot()');
                    i += 3;
                } else if (theseSymbols[i] === '_hyp_trigs') {
                    theseSymbols.splice(i, 1, 'cosh()', 'sinh()', 'tanh()', 'cosech()', 'sech()', 'coth()');
                    i += 6;
                } else if (theseSymbols[i] === '_inv_hyp_trigs') {
                    theseSymbols.splice(i, 1, 'arccosh()', 'arcsinh()', 'arctanh()', 'arccosech()', 'arcsech()', 'arccoth()');
                    i += 6;
                } else if (theseSymbols[i] === '_logs') {
                    theseSymbols.splice(i, 1, 'log()', 'ln()');
                    i += 2;
                } else if (theseSymbols[i] === '_no_alphabet') {
                    theseSymbols.splice(i, 1);
                    if (r) {
                        r.allowVars = false;
                    }
                } else {
                    i += 1;
                }
            }
            return _.uniq(theseSymbols);
        }
    }

    return EquationEditor;
});