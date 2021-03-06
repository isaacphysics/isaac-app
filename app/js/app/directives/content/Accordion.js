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
define(["/partials/content/Accordion.html"], function(templateUrl) {
	return ["$location", "$rootScope", function($location, _$rootScope) {
		return {
			scope: true,
			restrict: 'A',
			templateUrl: templateUrl,
			link: function(scope, _element, _attrs) {
				scope.accordionChildMetrics = {
					questionCount: 0,
				}

				// Work out whether we're on a question page. If we are, open the first accordion section. Otherwise, only open it if it is the first item on the page.
				let isOnQuestionPage = false;
				let p = scope;

				while(p.$parent) {
					p = p.$parent;
					if (!p.doc) {
						continue;
					}

					if (p.doc.type == "isaacQuestionPage") {
						isOnQuestionPage = true;
					}
				}

				scope.openChildren = {
					0: scope.contentChunkIndex == 0 || isOnQuestionPage,
				};

				scope.titleSuffixes = {};

				scope.toggleChild = function(i) {
					scope.openChildren[i] = !scope.openChildren[i];

					if (scope.openChildren[i]) {
						// This section was just opened.

						scope.$emit("accordionsectionopen", i, scope.doc.children[i]);
						scope.$broadcast("accordionSectionOpened", i);
					}
				}

				// Assuming we have questions in every accordion section, we are guaranteed to get
				// one newQuestionAnswer event per section on initialisation. The order is NOT guaranteed.

				let answersOnLoad = {};

				let updateLoadedQuestions = function() {
					if ($location.hash())
						return;

					let encounteredNotCorrect = false;
					for (let i = 0; i < scope.doc.children.length; i++) {
						if (!(i in answersOnLoad))
							break;

						let ans = answersOnLoad[i];

						// If there is an answer, close the tab and display the answer.
						if (ans) {

							scope.openChildren[i] = false;
							scope.toggleChild(i);
							scope.titleSuffixes[i] = ans;
						} else {
							if (!encounteredNotCorrect) {
								// This is the first incorrect or not-answered question part. Open it.

								scope.openChildren[i] = true;
							} else {
								// This is NOT the first incorrect or not-answered question part. Close it.
							
								scope.openChildren[i] = false;
							}
							encounteredNotCorrect = true;
						}
					}
				};
				void updateLoadedQuestions;
				// FIXME ^ This looks too complicated for something we can just delete. Better check before nuking it.

				scope.$on("newQuestionAnswer", function(_event, _index, _ans) {
					//
					//        FIXME : This function has been broken for a while and is now misbehaving!
					//
					return;
					// TODO: Make sure we can go "back" to this question. This accordion stuff only works on refresh
					// if (index in answersOnLoad) {

					// 	// This is a change - someone has submitted an answer.
					// 	if (ans) {
					// 		// They got the answer right. Display the answer and if the next question isn't open, open it.

					// 		scope.titleSuffixes[index] = ans;
					// 		scope.openChildren[index+1] = true;
					// 	} else {
					// 		// They got the answer wrong. Don't change anything.
					// 		scope.titleSuffixes[index] = ans;
					// 	}

					// } else {
					// 	// We have not had any communication from this section before. This must be a page load.
					// 	answersOnLoad[index] = ans;

					// 	updateLoadedQuestions();
					// }
					// setTimeout(function() {
					// 	$rootScope.requestMathjaxRender();
					// }, 0);
				});

				scope.$on("ensureVisible", function(e) {
					if (e.targetScope == scope) return;

					e.stopPropagation();
					let section = e.targetScope.accordionSection;

					scope.openChildren[section] = true;

					scope.$emit("ensureVisible");
				});
			}
		};
	}];
});
