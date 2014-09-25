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
define([], function() {


	return [function() {

		return {

			scope: true,

			restrict: 'A',

			templateUrl: "/partials/content/Accordion.html",

			link: function(scope, element, attrs) {


				
				// Work out whether we're on a question page. If we are, open the first accordion section. Otherwise, only open it if it is the first item on the page.
				var isOnQuestionPage = false;
				var p = scope;
				while(p = p.$parent) {
					if (!p.doc)
						continue;

					if (p.doc.type == "isaacQuestionPage")
						isOnQuestionPage = true;
				}

				scope.openChildren = {
					0: scope.contentChunkIndex == 0 || isOnQuestionPage,
				};

				scope.toggleChild = function(i) {
					scope.openChildren[i] = !scope.openChildren[i];

					if (scope.openChildren[i]) {
						// This section was just opened.

						scope.$emit("accordionsectionopen", i, scope.doc.children[i]);
						scope.$broadcast("accordionSectionOpened", i);
					}
				}

				var newCorrectAnswerFlags = function(i, a, b) {
					if (a === b)
						return; // Init

					scope.correctAnswerFlags[i].unwatch();

					var lastCorrect = -1;
					for(var i in scope.correctAnswerFlags){
						if (scope.correctAnswerFlags[i].isCorrect) {
							lastCorrect = parseInt(i);
						}
						else {
							break;
						}
					}

					for(var i = 0; i < scope.doc.children.length; i++) {
						scope.openChildren[i] = i == (lastCorrect+1);
					}

				}
				
				// Create a flag for each child that says whether that section contains a correctly answered question.
				// This will only be used on question pages.

				// We really only want to watch these flags while the page loads. After loading, we don't want to
				// automatically collapse accordion sections any more.

				scope.correctAnswerFlags = [];

				for(var i in scope.doc.children) {
					var c = scope.doc.children[i];

					scope.correctAnswerFlags.push({isCorrect: false});
					scope.correctAnswerFlags[i].unwatch = scope.$watch("correctAnswerFlags[" + i + "].isCorrect", newCorrectAnswerFlags.bind(null, i));
				}

			}
		};
	}];
});