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

			link: function(scope, element, attrs) {

				scope.doc = undefined;
				scope.$parent.$watch(attrs.isaacMultiChoiceQuestion, function(newDoc) {
					scope.doc = newDoc;
				});

				scope.$watch("selectedChoice", function() {
					if (scope.selectedChoice === null) {
						return;
					}

					// Find index of selected choice
					// Can't use indexOf as they are different objects
					for (var i = 0; i < scope.doc.choices.length; i++) {
						var choice = scope.doc.choices[i];

						// Use JSON.stringify to do a deep comparison (compares children and value)
						if (JSON.stringify(choice) === JSON.stringify(scope.selectedChoice)) {
							scope.selectedAnswer = i;
							break;
						}
					}
				});

				scope.$watch("selectedAnswer", function() {
					scope.selectedChoice = scope.doc.choices[scope.selectedAnswer];
				})
			}
		};
	}];
});