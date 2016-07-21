/**
 * Copyright 2014 Ian Davies
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
define(["app/honest/responsive_video"], function(rv) {

    return ["api", function(api) {

        return {
            scope: true,

            restrict: 'A',

            templateUrl: "/partials/content/SymbolicQuestion.html",

            controller: ["$scope", function(scope) {
                var ctrl = this;

                scope.editorMode = 'maths';

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

                // TODO: Why do we do this?! Surely scope.doc would be enough? - Ian
                ctrl.plainDoc = JSON.parse(JSON.stringify(scope.doc));
                ctrl.plainDoc.type = "content";

                scope.$watch("ctrl.selectedFormula", function(f, oldF) {
                    if (f === oldF) {
                        return; // Init
                    }

                    if (f) {
                        scope.question.selectedChoice = {
                            type: "formula",
                            value: JSON.stringify(f),
                            pythonExpression: f.result ? f.result.python : "",
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
