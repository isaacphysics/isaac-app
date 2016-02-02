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
					type: "formula",
				};

				scope.eqnState = { symbols: {} };

				scope.$watch("eqnState", function(s, oldS) {
					if (s === oldS)
						return;

					scope.selectedChoice.value = JSON.stringify(s);
					if (s && s.result) {
						scope.selectedChoice.pythonExpression = s.result.py;
					} else {
						scope.selectedChoice.pythonExpression = "";
					}
				}, true);

				scope.$watch("validationResponse", function(r, oldR) {
					if (!scope.validationResponseSet)
						return;

					// If we get this far, r has really been explicitly set by QuestionTabs
					
					if(r && r.answer.value) {

						scope.eqnState = JSON.parse(r.answer.value);
						scope.selectedChoice.value = r.answer.value;

					}
				})

				scope.$watch("doc", function(d) {
					if (d) {
						scope.plainDoc = JSON.parse(JSON.stringify(d));
						scope.plainDoc.type = "content";
					} else {
						scope.plainDoc = null;
					}
				}, true)

			}
		};
	}];
});