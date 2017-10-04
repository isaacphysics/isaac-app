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

	return ["$location", "$filter", "api", function($location, $filter, api) {

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
						var isUnanswered = !relatedContent.completed;
						return isQuestionPage && isEasier && isUnanswered;
					})),
					relatedUnansweredSupportingQuestions: emptyListIfUndefined($filter('filter')(scope.doc.relatedContent, function(relatedContent){
						var isQuestionPage = ["isaacQuestionPage", "isaacFastTrackQuestionPage"].includes(relatedContent.type);
						var isEqualOrHarder = relatedContent.level >= scope.page.level;
						var isUnanswered = !relatedContent.completed;
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

				scope.activateTab(-1); // Activate "Answer now" tab by default.

				// A flag to prevent someone clicking submit multiple times without changing their answer.
				scope.canSubmit = false;

				var isPageCompleted = function(questionPage) {
					var walkForIncorrectBestAnswers = function(content, numberOfIncorrectBestAnswers) {
						if (content.bestAttempt) {
							numberOfIncorrectBestAnswers += !content.bestAttempt.correct;
						}
						if (content.children) {
							for (child of content.children) {
								if (child) {
									numberOfIncorrectBestAnswers = walkForIncorrectBestAnswers(child, numberOfIncorrectBestAnswers);
								}
							}
						}
						return numberOfIncorrectBestAnswers;
					}
					var pageCompleted = !walkForIncorrectBestAnswers(questionPage, 0);
					return pageCompleted;
				}

				var checkAnswer = function() {
					if (scope.question.selectedChoice != null && scope.canSubmit) {
						scope.canSubmit = false;

						if (scope.doc.type == "isaacSymbolicQuestion" || scope.doc.type == "isaacSymbolicChemistryQuestion") {
							var symbols = JSON.parse(scope.question.selectedChoice.value).symbols;
							if (Object.keys(symbols).length == 0) {
								return;
							}
						}

						var s = api.questionValidator.validate({id: scope.doc.id}, scope.question.selectedChoice);

						s.$promise.then(function foo(r) {
							scope.question.validationResponse = r;

							// Check the gameboard progress
							if (scope.gameBoard) {
								// Re-load the game board to check for updated progress
								var initialGameBoardPercent = scope.gameBoard.percentageCompleted;
								var gameBoardCompletedPassed =  true;
								var gameBoardCompletedPerfect =  true;

								api.gameBoards.get({id: scope.gameBoard.id}).$promise.then(function(board) {
									scope.question.gameBoardPercentComplete = board.percentageCompleted;

									//We want to know if they have (a) completed the gameboard, (b) passed the gameboard
									for(var i = 0; i < board.questions.length; i++){
										// page progress
										if (board.question[i].id == scope.page.id) {
											scope.question.pageCompleted == board.question[i].state == "PERFECT";
										}
										if (board.questions[i].state != "PERFECT" ){
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

									//
									// if(board.percentageCompleted == '100' && !scope.modalDisplayed && r.correct) {
									// 		scope.modals["congrats"].show();
									// 		scope.$emit("modalCompleteDisplayed", true);
									// }


									// NOTE: We can't just rely on percentageCompleted as it gives us 100% when there is one
									// question for a gameboard and the question has been passed, not completed. See issue #419
								});
							} else {
								// TODO MT this actually won't work... a gameboard will be defined even on the lower levels
								//Check question page progress
								api.questionPages.get({id: scope.page.id}).$promise.then(function(questionPage) {
									scope.question.pageCompleted = isPageCompleted(questionPage);
								})
							}
						}, function bar(e) {
							console.error("Error validating answer:", e);
							var eMessage = e.data.errorMessage;
							var eTitle = "Can't Submit Answer";
							if (eMessage != null && eMessage.indexOf("ValidatorUnavailableException:") == 0) {
								eTitle = "Error Checking Answer"
								eMessage = eMessage.replace("ValidatorUnavailableException:", "");
							}
							scope.showToast(scope.toastTypes.Failure, eTitle, eMessage != undefined ? eMessage : "");
							// If an error, after a little while allow them to submit the same answer again.
							setTimeout(function() { scope.canSubmit = true; }, 5000);
						});

					} else {
						console.log("Not submitting answer - either no answer selected or previous answer unchanged");
						// TODO: Somehow tell the user that their answer was not submitted. Better: Disable the button so we never get here.
					}
				};

				// TODO MT move this into a service //static helper class
				// TODO MT maybe actions can be a directive
				// TODO MT try to see if links can be made to be actual links
				var defaultAction = {
					disabled: false
				}
				var ActionBuilder = {
					checkMyAnswer: function() {
						return {
							prototype: defaultAction,
							label: "Check my answer",
							disabled: !scope.canSubmit,
							onClick: checkAnswer,
						};
					},
					tryEasierQuestion: function(easierQuestion, currentQuestionId, pageCompleted, questionHistory, gameboard) {
						// label
						var calculatedLabel = easierQuestion.level == '2' ? 'Revise ' : 'Practice ';
						var defaultConceptDescriptor = 'this concept'
						calculatedLabel += easierQuestion.title.length < defaultConceptDescriptor.length ? easierQuestion.title : defaultConceptDescriptor;

						// link location
						if (!pageCompleted) {
							questionHistory.push(currentQuestionId);
						}
						var urlParameters = [];
						if (questionHistory.length) {
							urlParameters.push('questionHistory=' + questionHistory.join(','));
						}
						if (gameboard) {
							urlParameters.push('board=' + gameboard);
						}
						var easierQuestionLocation = '/questions/' + easierQuestion.id;
						if (urlParameters.length) {
							easierQuestionLocation += '?' + urlParameters.join('&');
						}
						return {
							prototype: defaultAction,
							label: calculatedLabel,
							onClick: function() {
								$location.url(easierQuestionLocation);
							},
						};
					},
					trySupportingQuestion: function(supportingQuestion, currentQuestionId, pageCompleted, questionHistory, gameboard) {
						// label
						var defaultConceptDescriptor = 'this concept'
						var calculatedLabel;
						if (supportingQuestion.title.length < defaultConceptDescriptor.length) {
							calculatedLabel = `More ${supportingQuestion.title} ${supportingQuestion.level == '2' ? 'revision' : 'practice'}`;
						} else {
							calculatedLabel = `More ${supportingQuestion.level == '2' ? 'revision' : 'practice'} of ${defaultConceptDescriptor}`;
						}

						// link location
						if (!pageCompleted) {
							questionHistory.push(currentQuestionId);
						}
						var urlParameters = [];
						if (questionHistory.length) {
							urlParameters.push('questionHistory=' + questionHistory.join(','));
						}
						if (gameboard) {
							urlParameters.push('board=' + gameboard);
						}
						var supportingQuestionLocation = '/questions/' + supportingQuestion.id;
						if (urlParameters.length) {
							supportingQuestionLocation += '?' + urlParameters.join('&');
						}
						return {
							prototype: defaultAction,
							label: calculatedLabel,
							onClick: function() {
								$location.url(supportingQuestionLocation);
							},
						};
					},
					showRelatedConceptPage: function(conceptPage) {
						return {
							prototype: defaultAction,
							label: "Read related concept page",
							onClick: function() {
								$location(`/concepts/${conceptPage.id}`);
							},
						};
					},
					retryPreviousQuestion: function(questionHistory, gameboard) {
						var previousQuestionId = questionHistory.pop();
						var urlParameters = [];
						if (questionHistory.length) {
							urlParameters.push('questionHistory=' + questionHistory.join(','));
						}
						if (gameboard) {
							urlParameters.push('board=' + gameboard);
						}
						var previousQuestionLocation = '/questions/' + previousQuestionId;
						if (urlParameters.length) {
							previousQuestionLocation += '?' + urlParameters.join('&');
						}
						// TODO MT need to check that there are no , & etc in url or we need to escape them
						return {
							prototype: defaultAction,
							label: "Retry previous question",
							onClick: function() {
								$location.url(previousQuestionLocation);
							},
						};
					},
					goToNextQuestionPart: function() {
						// some js to select the next textbox and ensure it is in view
						return {
							prototype: defaultAction,
							label: "Try next quesiton part",
							disabled: true,
							onClick: function() {
								// link to content page
								console.log('Go to next Q Part');
							},
						};
					},
					goToNextBoardQuestion: function() {
						// might already be implemented but commented out
						return {
							prototype: defaultAction,
							label: "Go to next board Q",
							onClick: function() {
								// link to content page
								console.log('Go to next board Q')
							},
						};
					}
				}

				var calculatePrimaryAction = function(questionPart, questionPage, questionHistory, gameboard) {
					var questionPartAnsweredCorrectly = questionPart.validationResponse && questionPart.validationResponse.correct;
					if (questionPartAnsweredCorrectly) {
						if (questionPart.pageCompleted) {
							if (questionHistory.length) {
								return ActionBuilder.retryPreviousQuestion(questionHistory, gameboard);
							} else {
								if (gameboard  && !questionPart.gameBoardCompletedPerfect) {
									return ActionBuilder.goToNextBoardQuestion(gameboard);
								} else {
									return null;
								}
							}
						} else {
							return ActionBuilder.goToNextQuestionPart();
						}
					} else  {
						return ActionBuilder.checkMyAnswer();
					}
				}

				var calculateSecondaryAction = function(questionPart, questionPage, questionHistory, gameboard) {
					var questionPartNotAnsweredCorrectly = !(questionPart.validationResponse && questionPart.validationResponse.correct);
					if (questionPartNotAnsweredCorrectly && questionPart.relatedUnansweredEasierQuestions.length) {
						var easierQuestion = questionPart.relatedUnansweredEasierQuestions[0];
						return ActionBuilder.tryEasierQuestion(easierQuestion, questionPage.Id, questionPart.pageCompleted, questionHistory, gameboard);

					} else if (questionPart.relatedUnansweredSupportingQuestions.length) {
						var supportingQuestion = questionPart.relatedUnansweredSupportingQuestions[0];
						return ActionBuilder.trySupportingQuestion(supportingQuestion);

					} else if (questionPart.relatedConcepts.length) {
						var relatedConcept = questionPart.relatedConcepts[0];
						return ActionBuilder.showRelatedConceptPage(relatedConcept);

					} else {
						return null;
					}
				}

				var calculateActions = function() {
					scope.primaryAction = calculatePrimaryAction(scope.question, scope.page, scope.questionHistory, scope.gameboard);
					scope.secondaryAction = calculateSecondaryAction(scope.question, scope.page, scope.questionHistory, scope.gameboard);
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
					calculateActions();
				});

				scope.$on("ensureVisible", function(e) {
					if (e.targetScope == scope)
						return;

					e.stopPropagation();

					var i = e.targetScope.questionTabIndex;

					scope.activateTab(i);

					scope.$emit("ensureVisible");
				});

				calculateActions();
				scope.question.pageCompleted = isPageCompleted(scope.page);

				//TODO MT value.type == "isaacFastTrackQuestionPage" && value.level
				//console.log('TODO MT QUESTION PART -------------')
				//console.log('TODO MT scope', scope);
				//console.log('TODO MT scope.doc', scope.doc);
				//console.log('TODO MT scope.page', scope.page);
				//console.log('TODO MT scope.question', scope.question);

			}
		};
	}];
});
