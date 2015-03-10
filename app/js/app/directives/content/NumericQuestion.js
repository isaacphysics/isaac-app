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

	return ["api", "units", function(api, units) {

		return {
			scope: true,

			restrict: 'A',

			templateUrl: "/partials/content/NumericQuestion.html",

			link: function(scope, element, attrs) {

				scope.selectedChoice = {
					type: "quantity",
				};
				scope.selectedUnitsDisplay = "";

				scope.toggleUnitsDropdown = function() {

					if (scope.unitsDropdownStyle) {
						scope.unitsDropdownStyle = null;
					} else {
						var btnPos = element.find("button").offset();
						var parent = element.find("button").parent().offset();

						scope.unitsDropdownStyle = {
							top: btnPos.top + btnPos.height - parent.top,
							left: btnPos.left - parent.left,
						}
					}
				}

				scope.unitOptions = [];

				units.getUnits().then(function(allUnits) {

					// Add potential units to options list
					for (var i in scope.doc.knownUnits) {
						var unitsFromQuestion = scope.doc.knownUnits[i];

						if (unitsFromQuestion && scope.unitOptions.indexOf(unitsFromQuestion) == -1) 
							scope.unitOptions.push(unitsFromQuestion);
					}

					var unitsPool = JSON.parse(JSON.stringify(allUnits));

					while (scope.unitOptions.length < 6) {
						// Fill the unit options up with other random units
						var u = unitsPool.splice(Math.floor(Math.random() * unitsPool.length), 1)[0].replace("\\\\", "\\");

						if (scope.unitOptions.indexOf(u) == -1) {
							// Splice the randomly selected units into a randomly selected location
							scope.unitOptions.splice(Math.floor(Math.random() * (scope.unitOptions.length + 1)), 0, u);
						}
					}

				})

				scope.selectUnit = function(u) {
					scope.selectedChoice.units = u;

					if (scope.selectedChoice.units != undefined) {
						if (scope.selectedChoice.units == "")
							scope.selectedUnitsDisplay = "None";
						else {
							scope.selectedUnitsDisplay = "$\\units{" + scope.selectedChoice.units + "}$";
							setTimeout(function() {
								$rootScope.requestMathjaxRender();
							}, 0);
						}
					} else {
						scope.selectedUnitsDisplay = "";
					}
					scope.unitsDropdownStyle = null;
				}

				// scope.validationResponse is explicitly set by QuestionTabs in the link function.
				// QuestionTabs then sets scope.validationResponseSet, so we ignore any changes 
				// to validationResponse before that gets set.

				scope.$watch("validationResponse", function(r, oldR) {
					if (!scope.validationResponseSet)
						return;

					// If we get this far, r has really been explicitly set by QuestionTabs
					
					if(r) {

						scope.selectedChoice.value = r.answer.value;
						scope.selectUnit(r.answer.units);

						if (scope.accordionSection != null) {
							if (r.correct) {
								scope.$emit("newQuestionAnswer", scope.accordionSection, "$\\quantity{ " + scope.selectedChoice.value + " }{ " + (scope.selectedChoice.units || "") + " }$  ✓");
								setTimeout(function() {
									$rootScope.requestMathjaxRender();
								}, 0);
							} else {							
								scope.$emit("newQuestionAnswer", scope.accordionSection);
							}
						}
					} else {

						// The user started changing their answer after a previous validation response.

						if (scope.accordionSection != null) {
							scope.$emit("newQuestionAnswer", scope.accordionSection);
						}
					}

				})

			}
		};
	}];
});