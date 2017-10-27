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

	return ["$location", "$filter", "$state", "api", "questionActions", "QUESTION_TYPES", function($location, $filter, $state, api, questionActions, QUESTION_TYPES) {

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

				var checkGamebaordProgress = function() {
					var initialGameBoardPercent = scope.gameBoard.percentageCompleted;
					var gameBoardCompletedPassed =  true;
					var gameBoardCompletedPerfect =  true;

					// Re-load the game board to check for updated progress
					api.gameBoards.get({id: scope.gameBoard.id}).$promise.then(function(board) {
						scope.question.gameBoardPercentComplete = board.percentageCompleted;

						//We want to know if they have (a) completed the gameboard, (b) passed the gameboard
						for(var i = 0; i < board.questions.length; i++){
							// page progress
							if (board.questions[i].state != "PERFECT"){
								gameBoardCompletedPerfect = false;
							}
							if (board.questions[i].state != "PASSED" && board.questions[i].state != "PERFECT"){
								gameBoardCompletedPassed = false;
							}
						}
						// If things have changed, and the answer is correct, show the modal
						if ((gameBoardCompletedPassed != !!scope.question.gameBoardCompletedPassed ||
							gameBoardCompletedPerfect != !!scope.question.gameBoardCompletedPerfect ||
							initialGameBoardPercent < board.percentageCompleted) && r.correct) {
							scope.question.gameBoardCompletedPassed = gameBoardCompletedPassed;
							scope.question.gameBoardCompletedPerfect = gameBoardCompletedPerfect;
							scope.$emit('gameBoardCompletedPassed', scope.question.gameBoardCompletedPassed);
							scope.$emit('gameBoardCompletedPerfect', scope.question.gameBoardCompletedPerfect);

							if(!scope.modalPassedDisplayed && scope.question.gameBoardCompletedPassed) {
								scope.modals["congrats"].show();
								scope.$emit("modalPassedDisplayed", true);
							}

							if(!scope.modalPerfectDisplayed && scope.question.gameBoardCompletedPerfect) {
								scope.modals["congrats"].show();
								scope.$emit("modalPerfectDisplayed", true);
							}
						}

						// if(board.percentageCompleted == '100' && !scope.modalDisplayed && validationResponse.correct) {
						// 		scope.modals["congrats"].show();
						// 		scope.$emit("modalCompleteDisplayed", true);
						// }
						// NOTE: We can't just rely on percentageCompleted as it gives us 100% when there is one
						// question for a gameboard and the question has been passed, not completed. See issue #419
					});
				}

				var applyValidationResponseToQuestionPart = function(content, validationResponse) {
					if (QUESTION_TYPES.includes(content.type) && content.id == validationResponse.questionId &&	content.bestAttempt != true) {
						content.bestAttempt = validationResponse;
					}
					if (content.children) {
						for (child of content.children) {
							applyValidationResponseToQuestionPart(child, validationResponse);
						}
					}
				}

				var isPageCompleted = function(questionPage) {
					var hasIncorrectOrUnansweredQuestion = function(content) {
						var foundIncorrectQuestionPart = false;
						if (QUESTION_TYPES.includes(content.type)) {
							if (!content.bestAttempt || !content.bestAttempt.correct) {
								foundIncorrectQuestionPart = true;
							}
						}
						if (content.children) {
							for (child of content.children) {
								foundIncorrectQuestionPart |= hasIncorrectOrUnansweredQuestion(child);
							}
						}
						return foundIncorrectQuestionPart
					}
					var pageCompleted = !hasIncorrectOrUnansweredQuestion(questionPage);
					return pageCompleted;
				}

				var determineFastTrackPrimaryAction = function(questionPart, questionPage, questionHistory, gameboardId) {
					var questionPartAnsweredCorrectly = questionPart.validationResponse && questionPart.validationResponse.correct;
					if (questionPartAnsweredCorrectly) {
						if (questionPart.pageCompleted) {
							if (questionHistory.length) {
								return questionActions.retryPreviousQuestion(questionHistory, gameboardId);
							} else {
								if (gameboardId  && !questionPart.gameBoardCompletedPerfect) {
									return questionActions.backToBoard(gameboardId);
								} else {
									return null; // Gameboard completed
								}
							}
						} else {
							return null; // questionActions.goToNextQuestionPart();
						}
					} else  {
						return questionActions.checkMyAnswer(scope, api);
					}
				}

				var determineFastTrackSecondaryAction = function(questionPart, questionPage, questionHistory, gameboardId) {
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

				var determinePrimaryAction = function(validationResponse) {
					var action = null;
					if (!validationResponse || !validationResponse.correct) {
						action = questionActions.checkMyAnswer(scope, api);
					}
					return action;
				}

				var determineActions = function() {
					if (scope.page.type != 'isaacFastTrackQuestionPage') {
						scope.primaryAction = determinePrimaryAction(scope.question.validationResponse);
					} else {
						scope.primaryAction = determineFastTrackPrimaryAction(scope.question, scope.page, scope.questionHistory.slice(), scope.gameboardId);
						scope.secondaryAction = determineFastTrackSecondaryAction(scope.question, scope.page, scope.questionHistory.slice(), scope.gameboardId);
					}
				}

				scope.$watch("question.selectedChoice", function(newVal, oldVal) {
					// (Show some help text. Quietly though!)
					scope.hlp = newVal && newVal.value && newVal.value.toLowerCase().match('(^h[ae]lp|\"help\").*');

					if (newVal === oldVal)
						return; // Init

					scope.canSubmit = true;
					scope.question.validationResponse = null;
				}, true);

				scope.$on("ensureVisible", function(e) {
					if (e.targetScope == scope)
						return;

					e.stopPropagation();

					var i = e.targetScope.questionTabIndex;

					scope.activateTab(i);

					scope.$emit("ensureVisible");
				});

				scope.$watchGroup(["canSubmit", "question.selectedChoice"], function(newVal, oldVal) {
					if (newVal !== oldVal) {
						determineActions();
					}
				});

				scope.$watch("question.validationResponse", function(newVal, oldVal) {
					if (newVal !== oldVal) {
						if (scope.question.validationResponse) {
							applyValidationResponseToQuestionPart(scope.page, scope.question.validationResponse);
							scope.question.pageCompleted = isPageCompleted(scope.page);
							determineActions();
						}
					}					
				});

				scope.$watch("question.pageCompleted", function(newVal, oldVal) {
					if (scope.gameboard && newVal !== oldVal) {
						checkGameboardProgress();
					}
				})

				scope.question.pageCompleted = isPageCompleted(scope.page);
				scope.canSubmit = false; // A flag to prevent someone clicking submit multiple times without changing their answer.
				scope.activateTab(-1); // Activate "Answer now" tab by default.
				determineActions();
			}
		};
	}];
});
