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
define(["app/honest/responsive_video"], function(rv, scope) {

	return ["$location", "$filter", "$state", "api", "questionActions", function($location, $filter, $state, api, questionActions) {

		return {

			restrict: 'A',

			scope: true,

			templateUrl: "/partials/content/QuestionTabs.html",

			link: function(scope, element, attrs, ctrls, transclude) {
				if (scope.accordionChildMetrics) {
					scope.accordionChildMetrics.questionCount++;
				}

				var emptyListIfUndefined = function(originalResult) {
					var result = originalResult ? originalResult : [];
					return result;
				};

				// An object to hold a load of state for this particular question. Keep it together like this
				// so that child scopes can read/write values safely without shadowing.
				scope.question = {
					validationResponse: null,
					selectedChoice: null,
					gameBoardCompletedPassed: false,
					gameBoardCompletedPerfect: false,
					pageCompleted: false,
					id: scope.doc.id,
					type: scope.doc.type,
					relatedConcepts: emptyListIfUndefined($filter('filter')(scope.doc.relatedContent, {type: "isaacConceptPage"})),
					relatedUnansweredEasierQuestions: emptyListIfUndefined($filter('filter')(scope.doc.relatedContent, function(relatedContent){
						var isQuestionPage = ["isaacQuestionPage", "isaacFastTrackQuestionPage"].includes(relatedContent.type);
						var isEasier = relatedContent.level < scope.page.level;
						var isUnanswered = !relatedContent.correct;
						return isQuestionPage && isEasier && isUnanswered;
					})),
					relatedUnansweredSupportingQuestions: emptyListIfUndefined($filter('filter')(scope.doc.relatedContent, function(relatedContent){
						var isQuestionPage = ["isaacQuestionPage", "isaacFastTrackQuestionPage"].includes(relatedContent.type);
						var isEqualOrHarder = relatedContent.level >= scope.page.level;
						var isUnanswered = !relatedContent.correct;
						return isQuestionPage && isEqualOrHarder && isUnanswered;
					}))
				};
				if (scope.doc.bestAttempt) {
					scope.question.validationResponse = scope.doc.bestAttempt;
					scope.question.selectedChoice = scope.question.validationResponse.answer;
				}

				scope.activateTab = function(i) {
					scope.activeTab = i;
					rv.updateAll();

					if (i > -1) {
						api.logger.log({
							type : "VIEW_HINT",
							questionId : scope.doc.id,
							hintIndex : i,
						})
					}
				}

				var isPageCompleted = function(questionPage) {
					var walkForIncorrectBestAnswers = function(content, numberOfIncorrectBestAnswers) {
						console.log("TODO MT number of incorrect", numberOfIncorrectBestAnswers)
						if (content.bestAttempt) {
							numberOfIncorrectBestAnswers += !content.bestAttempt.correct;
						}
						if (content.children) {
							for (child of content.children) {
								if (child) {
									numberOfIncorrectBestAnswers += walkForIncorrectBestAnswers(child, numberOfIncorrectBestAnswers);
								}
							}
						}
						return numberOfIncorrectBestAnswers;
					}
					var pageCompleted = !walkForIncorrectBestAnswers(questionPage, 0);
					return pageCompleted;
				}

				var determinePrimaryAction = function(questionPart, questionPage, questionHistory, gameboardId) {
					var questionPartAnsweredCorrectly = questionPart.validationResponse && questionPart.validationResponse.correct;
					if (questionPartAnsweredCorrectly) {
						if (questionPart.pageCompleted) {
							if (questionHistory.length) {
								return questionActions.retryPreviousQuestion(questionHistory, gameboardId);
							} else {
								if (gameboardId  && !questionPart.gameBoardCompletedPerfect) {
									return questionActions.goToNextBoardQuestion(gameboardId);
								} else {
									return null; // All completed
								}
							}
						} else {
							return questionActions.goToNextQuestionPart();
						}
					} else  {
						return questionActions.checkMyAnswer(scope, api);
					}
				}

				var determineSecondaryAction = function(questionPart, questionPage, questionHistory, gameboardId) {
					var questionPartNotAnsweredCorrectly = !(questionPart.validationResponse && questionPart.validationResponse.correct);
					if (questionPartNotAnsweredCorrectly && questionPart.relatedUnansweredEasierQuestions.length) {
						var easierQuestion = questionPart.relatedUnansweredEasierQuestions[0];
						return questionActions.tryEasierQuestion(easierQuestion, questionPage.id, questionPart.pageCompleted, questionHistory, gameboardId);
					} else if (questionPart.relatedUnansweredSupportingQuestions.length) {
						var supportingQuestion = questionPart.relatedUnansweredSupportingQuestions[0];
						return questionActions.trySupportingQuestion(supportingQuestion, questionPage.id, questionPart.pageCompleted, questionHistory, gameboardId);
					} else if (questionPart.relatedConcepts.length) {
						var relatedConcept = questionPart.relatedConcepts[0];
						return questionActions.showRelatedConceptPage(relatedConcept);
					} else {
						return null;
					}
				}

				var determineActions = function() {
					scope.primaryAction = determinePrimaryAction(scope.question, scope.page, scope.questionHistory.slice(), scope.gameboardId);
					scope.secondaryAction = determineSecondaryAction(scope.question, scope.page, scope.questionHistory.slice(), scope.gameboardId);
				}

				scope.$watch("question.selectedChoice", function(newVal, oldVal) {
					// (Show some help text. Quietly though!)
					scope.hlp = newVal && newVal.value && newVal.value.toLowerCase().match('(^h[ae]lp|\"help\").*');

					if (newVal === oldVal)
						return; // Init

					scope.canSubmit = true;
					scope.question.validationResponse = null;
				}, true);

				scope.$watchGroup(["canSubmit", "question.selectedChoice", "question.validationResponse"], function(newVal, oldVal) {
					if (newVal === oldVal)
						return;
					determineActions();
					console.log('TODO MT page == ', scope.page);

					scope.question.pageCompleted = isPageCompleted(scope.page);
				});

				scope.$on("ensureVisible", function(e) {
					if (e.targetScope == scope)
						return;

					e.stopPropagation();

					var i = e.targetScope.questionTabIndex;

					scope.activateTab(i);

					scope.$emit("ensureVisible");
				});

				scope.activateTab(-1); // Activate "Answer now" tab by default.
				scope.canSubmit = false; // A flag to prevent someone clicking submit multiple times without changing their answer.
				determineActions();

				//TODO MT value.type == "isaacFastTrackQuestionPage" && value.level
				//console.log('TODO MT QUESTION PART -------------')
				//console.log('TODO MT scope', scope);
				//console.log('TODO MT scope.doc', scope.doc);
				console.log('TODO MT scope.page', scope.page);
				//console.log('TODO MT scope.question', scope.question);

			}
		};
	}];
});
