/**
 * Copyright 2016 Andy Wells
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
define(["../../honest/responsive_video", "/partials/content/SymbolicChemistryQuestion.html"], function(rv, templateUrl) {

    return ["api", function(api) {

        return {
            scope: true,

            restrict: 'A',

            templateUrl: templateUrl,

            controller: ["$scope", function(scope) {
                let ctrl = this;

                scope.editorMode = 'chemistry';
                ctrl.selectedFormula = {
                    symbols: {}
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
                        symbols: {}
                    };
                }



                ctrl.plainDoc = JSON.parse(JSON.stringify(scope.doc));
                ctrl.plainDoc.type = "content";

                scope.$watch("ctrl.selectedFormula", function(f, oldF) {
                    if (f === oldF) {
                        return; // Init
                    }

                    if (f) {
                        scope.question.selectedChoice = {
                            type: "chemicalFormula",
                            value: JSON.stringify(f),
                            mhchemExpression: f.result ? f.result.mhchem : ""
                        }

                    } else {
                        scope.question.selectedChoice = null;
                    }
                }, true);

            }],

            controllerAs: "ctrl",
        };
    }];
});
