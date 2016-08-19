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

			templateUrl: "/partials/content/MultiChoiceQuestion.html",

			controller: ["$scope", function(scope) {
				var ctrl = this;

				ctrl.selectedAnswer = null;

				// Pre-select a radio button if we've reloaded a previous answer
				if (scope.question.selectedChoice) {
					for (var i = 0; i < scope.doc.choices.length; i++) {
						var choice = scope.doc.choices[i];
						if (choice.value == scope.question.selectedChoice.value) {
							ctrl.selectedAnswer = i;
							scope.$emit("newQuestionAnswer", scope.accordionSection, scope.question.validationResponse.correct ? "✓" : undefined)
						}
					}
				}

				scope.$watch("ctrl.selectedAnswer", function(a, oldA) {
					if (a === oldA) {
						return; // Init
					}

					scope.question.selectedChoice = scope.doc.choices[ctrl.selectedAnswer];
				});


				// Add or remove the accordion tick after validation
				scope.$watch("question.validationResponse", function(r, oldR) {

					if (r === oldR) {
						return; // Init
					}

					if (r) {
						scope.$emit("newQuestionAnswer", scope.accordionSection, r.correct ? "✓" : undefined);
					} else {
						// The validationResponse was reset. This happens when changing choice after submitting.
						scope.$emit("newQuestionAnswer", scope.accordionSection);
					}
				});
			}],

			controllerAs: "ctrl",
		};
	}];
});