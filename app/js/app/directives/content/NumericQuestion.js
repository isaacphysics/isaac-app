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
				ctrl.displayUnits = null; // Need this to display "None" when units are ""

				ctrl.showUnitsDropdown = function() {
					if(ctrl.unitsDropdownStyle) {
						ctrl.unitsDropdownStyle = null;
					}
					else {
						var btnPos = element.find("button").offset();
						var parent = element.find("button").parent().offset();

						ctrl.unitsDropdownStyle = {
							top: btnPos.top + btnPos.height - parent.top,
							left: btnPos.left - parent.left,
						}
					}
				}

				ctrl.unitOptions = [];

				units.getUnits().then(function(allUnits) {

					// Add potential units to options list
					for (var i in scope.doc.knownUnits) {
						var unitsFromQuestion = scope.doc.knownUnits[i];

						if (unitsFromQuestion && ctrl.unitOptions.indexOf(unitsFromQuestion) == -1) {
							ctrl.unitOptions.push(unitsFromQuestion);
						}
					}

					var unitsPool = JSON.parse(JSON.stringify(allUnits));

					while (ctrl.unitOptions.length < 6) {
						// Fill the unit options up with other random units
						var u = unitsPool.splice(Math.floor(Math.random() * unitsPool.length), 1)[0].replace("\\\\", "\\");

						if (ctrl.unitOptions.indexOf(u) == -1) {
							// Splice the randomly selected units into a randomly selected location
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