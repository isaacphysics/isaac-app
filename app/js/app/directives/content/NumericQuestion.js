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
define(["../../honest/responsive_video", "/partials/content/NumericQuestion.html"], function(rv, templateUrl) {

    return ["api", "units", "$rootScope", function(api, units, $rootScope) {

		return {
			scope: true,

			restrict: 'A',

			templateUrl: templateUrl,

			controller: ["$scope", "$element", function(scope, element) {
				let ctrl = this;

				ctrl.selectedValue = null;
				ctrl.selectedUnits = null;
				ctrl.displayUnits = null; // Need this to display "None" when units are ""

				ctrl.showUnitsDropdown = function() {
					if(ctrl.unitsDropdownStyle) {
						ctrl.unitsDropdownStyle = null;
					}
					else {
						let btnPos = element.find("button").offset();
						let parent = element.find("button").parent().offset();

						ctrl.unitsDropdownStyle = {
							top: btnPos.top + btnPos.height - parent.top,
							left: btnPos.left - parent.left,
						}
					}
				}

				ctrl.unitOptions = [];

                units.getUnits().then(function(allUnits) {
					/*
					* STEP 0: Add to unitOptions all units required to answer
					* the question, and choose all known incorrect choices.
					*/
					if (typeof scope.doc.knownUnits !== "undefined") {
						for (let i = 0; i < scope.doc.knownUnits.length; i++) {

						    // Get a knwn unit from choice.
						    let unitFromQuestion = scope.doc.knownUnits[i];

						    // Only add to options when it is not null and not duplicated.
						    if (unitFromQuestion && ctrl.unitOptions.indexOf(unitFromQuestion) == -1) {
						        ctrl.unitOptions.splice(Math.floor(Math.random() * (ctrl.unitOptions.length + 1)), 0, unitFromQuestion);
						    }
						}
					}
	                /*
	                 * STEP 1: Add availableUnits to the list until we reach 6 units or
	                 * run out of available units, removing duplicates and trimming spaces.
	                 */
	                if (typeof scope.doc.availableUnits !== "undefined") {

	                	let availableUnits = scope.doc.availableUnits.slice(0);

	                  	while (ctrl.unitOptions.length < 6 && availableUnits.length > 0) {
                            // Pick a random availableUnit, trim spaces and remove redundant backslashes.
                            let availableUnit = availableUnits.splice(Math.floor(Math.random() * availableUnits.length), 1)[0].trim().replace("\\\\", "\\");

                            // Only add to options when it is not null and not duplicated.
                            if (availableUnit && ctrl.unitOptions.indexOf(availableUnit) == -1) {
                                ctrl.unitOptions.splice(Math.floor(Math.random() * (ctrl.unitOptions.length + 1)), 0, availableUnit);
                            }
	                  	}
	                }
                    // Get the pool of all available units.
                    let unitsPool = JSON.parse(JSON.stringify(allUnits));
                    /*
                     * STEP 2: If we still don't have 6 units, add them from the global pool,
                     * until we have the required number of units or the pool is empty.
                     */
                    while (ctrl.unitOptions.length < 6 && unitsPool.length > 0) {
                        // Gets a random unit from pool, and removes it from pool.
                        let u = unitsPool.splice(Math.floor(Math.random() * unitsPool.length), 1)[0].replace("\\\\", "\\");

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

					scope.question.selectedChoice = scope.question.selectedChoice || { type: "quantity" };
					scope.question.selectedChoice.value = v;
				})

				scope.$watch("ctrl.selectedUnits", function(u, oldU) {
					if (u === oldU) {
						return; // Init
					}

					scope.question.selectedChoice = scope.question.selectedChoice || { type: "quantity" };
					scope.question.selectedChoice.units = u;
					ctrl.displayUnits = (u == '' ? "None" : "$\\units{" + u + "}$");

					if (u) {
						$rootScope.requestMathjaxRender();
					}

				});

				// Load previous answer if there is one
				if (scope.question.selectedChoice) {
					ctrl.selectedUnits = scope.question.selectedChoice.units;
					ctrl.selectedValue = scope.question.selectedChoice.value;
					ctrl.displayUnits = (ctrl.selectedUnits == '' ? "None" : "$\\units{" + ctrl.selectedUnits + "}$");
				}

				// Add or remove the accordion answer reminder after validation
				scope.$watch("question.validationResponse", function(r, oldR) {
					if (r === oldR) {
						return; // Init
					}

					if(r && r.correct) {
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