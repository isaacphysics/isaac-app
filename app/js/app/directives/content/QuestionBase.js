/**
 * Copyright 2017 Ian Davies
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
define(["app/honest/responsive_video"], function(rv, scope) {

	return ["api", function(api) {

		return {

			restrict: 'A',

			scope: true,
			
			priority: 1000,

			link: function(scope, element, attrs, ctrls, transclude) {

				if (scope.accordionChildMetrics) {
					scope.accordionChildMetrics.questionCount++;
				}

				// An object to hold a load of state for this particular question. Keep it together like this
				// so that child scopes can read/write values safely without shadowing.
				scope.question = {
					validationResponse: null,
					selectedChoice: null,
					gameBoardCompletedPassed: false,
					gameBoardCompletedPerfect: false,
					id: scope.doc.id,
					type: scope.doc.type,
				};

				if (scope.doc.bestAttempt) {
					scope.question.validationResponse = scope.doc.bestAttempt;
					scope.question.selectedChoice = scope.question.validationResponse.answer;
				}

				// A flag to prevent someone clicking submit multiple times without changing their answer.
				scope.question.canSubmit = false;

				scope.$watch("question.selectedChoice", function(newVal, oldVal) {
					// (Show some help text. Quietly though!)
					scope.hlp = newVal && newVal.value && newVal.value.toLowerCase().match('(^h[ae]lp|\"help\").*');

					if (newVal === oldVal)
						return; // Init

					scope.question.canSubmit = true;
					scope.question.validationResponse = null;
				}, true);

			}
		};
	}];
});
