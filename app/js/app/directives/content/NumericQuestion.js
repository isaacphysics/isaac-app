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

    return ["api", "units", "$rootScope", function(api, units, $rootScope) {

        return {
            scope: true,

            restrict: 'A',

            templateUrl: "/partials/content/NumericQuestion.html",

            controller: ["$scope", "$element", function(scope, element) {
                var ctrl = this;

                ctrl.selectedValue = null;
                ctrl.selectedUnits = null;

                ctrl.showUnitsDropdown = function() {

                    var btnPos = element.find("button").offset();
                    var parent = element.find("button").parent().offset();

                    ctrl.unitsDropdownStyle = {
                        top: btnPos.top + btnPos.height - parent.top,
                        left: btnPos.left - parent.left,
                    }
                }

                ctrl.unitOptions = [];

                //console.log(scope.doc);

                units.getUnits().then(function(allUnits) {

                    /*
                     * STEP 1: Initialize unitOptions list with available units,
                     * removing duplicates and with spaces trimmed.
                     */
                    for (var i = 0; i < scope.doc.availableUnits.length; i++) {

                        // Trim the space of availableUnit, and remove redundant backslashes.
                        var availableUnit = scope.doc.availableUnits[i].trim().replace("\\\\", "\\");

                        // Only add to options when it is not null and not duplicated.
                        if (availableUnit && ctrl.unitOptions.indexOf(availableUnit) == -1)
                            ctrl.unitOptions.push(availableUnit);

                    }

                    /*
                     * STEP 2: Add to the unitOptions list all known units at random
                     * location, unless the unit is a duplicate.
                     *
                     * Known units are units from question choices.
                     */
                    for (var i in scope.doc.knownUnits) {
                        var unitsFromQuestion = scope.doc.knownUnits[i];

                        // Only add to options when it is not null and not duplicated.
                        if (unitsFromQuestion && ctrl.unitOptions.indexOf(unitsFromQuestion) == -1)
                            ctrl.unitOptions.splice(Math.floor(Math.random() * (ctrl.unitOptions.length + 1)), 0, unitsFromQuestion);
                    }

                    // Get the pool of all available units.
                    var unitsPool = JSON.parse(JSON.stringify(allUnits));

                    /*
                     * STEP 3: Fill the unit options up with other random units in pool.
                     *
                     * Procedure terminates after unitOptions list has not less than 6
                     * elements, or unitPool gone empty.
                     */
                    while (ctrl.unitOptions.length < 6 && unitsPool.length > 0) {
                        // Gets a random unit from pool, and removes it from pool.
                        var u = unitsPool.splice(Math.floor(Math.random() * unitsPool.length), 1)[0].replace("\\\\", "\\");

                        // If the selected unit does not appear in option list
                        if (ctrl.unitOptions.indexOf(u) == -1) {
                            // Splice the randomly selected unit into a randomly selected location
                            ctrl.unitOptions.splice(Math.floor(Math.random() * (ctrl.unitOptions.length + 1)), 0, u);
                        }
                    }

                });

                scope.$watch("ctrl.selectedValue", function(v, oldV) {
                    if (v === oldV) {
                        return; // Init
                    }

                    scope.question.selectedChoice = scope.question.selectedChoice || {
                        type: "quantity"
                    };
                    scope.question.selectedChoice.value = v;
                })

                scope.$watch("ctrl.selectedUnits", function(u, oldU) {
                    if (u === oldU) {
                        return; // Init
                    }

                    scope.question.selectedChoice = scope.question.selectedChoice || {
                        type: "quantity"
                    };
                    scope.question.selectedChoice.units = u;

                    if (u) {
                        $rootScope.requestMathjaxRender();
                    }

                });

                // Load previous answer if there is one
                if (scope.question.selectedChoice) {
                    ctrl.selectedUnits = scope.question.selectedChoice.units;
                    ctrl.selectedValue = scope.question.selectedChoice.value;
                }

                // Add or remove the accordion answer reminder after validation
                scope.$watch("question.validationResponse", function(r, oldR) {
                    if (r === oldR) {
                        return; // Init
                    }

                    if (r && r.correct) {
                        scope.$emit("newQuestionAnswer", scope.accordionSection, "$\\quantity{ " + scope.question.selectedChoice.value + " }{ " + (scope.question.selectedChoice.units || "") + " }$  ✓");
                        $rootScope.requestMathjaxRender();
                    } else {

                        // The validationResponse was reset. This happens when changing answer after submitting.
                        scope.$emit("newQuestionAnswer", scope.accordionSection);
                    }
                });


            }],

            controllerAs: "ctrl",
        };
    }];
});
