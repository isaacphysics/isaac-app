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

			link: function(scope, element, attrs) {
				scope.selectedChoice = {
					type: "quantity",
				};

				scope.$watch("validationResponse", function(r, oldR) {
					if (!scope.validationResponseSet)
						return;

					// If we get this far, r has really been explicitly set by QuestionTabs
					
					if(r) {

						scope.eqnState = r.answer.value;
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