/**
 * Copyright 2019 James Sharkey
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at
 * 		http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
define(["/partials/content/SymbolicLogicQuestion.html"], function(templateUrl) {

    return ["api", function(_api) {

        return {
            scope: true,

            restrict: 'A',

            templateUrl: templateUrl,

            controller: ["$scope", function(scope) {
                let ctrl = this;

                scope.editorMode = 'logic';
                scope.logicSyntax = 'logic'; // FIXME Unless it's binary: figure out how to switch this.

                ctrl.selectedFormula = {
                    symbols: {},
                    formula: '',
                };

                if (scope.question.selectedChoice) {
                    // We have a previous answer. Load it.
                    console.debug("Loading the previous answer.");
                    try {
                        ctrl.selectedFormula = JSON.parse(scope.question.selectedChoice.value);
                    } catch (e) {
                        console.warn("Error loading previous answer: ", e.message);
                    }
                } else if (scope.doc.formulaSeed) {
                    // We have seed to load and no previous answer
                    console.debug("Loading the formula seed.", scope.doc.formulaSeed);
                    try {
                        ctrl.selectedFormula = {
                            symbols: JSON.parse(scope.doc.formulaSeed)
                        };
                    } catch (e) {
                        console.error("Error loading seed: ", e.message);
                    }


                } else {
                    // We have no answer and no seed
                    console.debug("No previous answer or seed.");
                    ctrl.selectedFormula = {
                        symbols: {},
                        formula: '',
                    };
                }

                // TODO: Why do we do this?! Surely scope.doc would be enough? - Ian
                ctrl.plainDoc = JSON.parse(JSON.stringify(scope.doc));
                ctrl.plainDoc.type = "content";

                scope.$watch("ctrl.selectedFormula", function(f, oldF) {
                    if (f === oldF) {
                        return; // Init
                    }
                    if (f) {
                        scope.question.selectedChoice = {
                            type: "logicFormula",
                            value: JSON.stringify(f),
                            pythonExpression: f.result ? f.result.python.trim() : "",
                        };
                    } else {
                        scope.question.selectedChoice = null;
                    }
                }, true);

            }],

            controllerAs: "ctrl",
        };
    }];
});
