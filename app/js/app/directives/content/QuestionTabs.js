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

	return ["api", function(api) {

		return {

			restrict: 'A',

			scope: true,

			templateUrl: "/partials/content/QuestionTabs.html",

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
			
				scope.checkAnswer = function() {
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
										if(board.questions[i].state != "PERFECT" ){
											gameBoardCompletedPerfect = false;
										}
										if(board.questions[i].state != "PASSED" && board.questions[i].state != "PERFECT"){
											gameBoardCompletedPassed = false;
										}
									}
									console.debug(board.percentageCompleted);
									// If things have changed, and the answer is correct, show the modal
									if ((gameBoardCompletedPassed != !!scope.question.gameBoardCompletedPassed ||
									   gameBoardCompletedPerfect != !!scope.question.gameBoardCompletedPerfect ||
									   initialGameBoardPercent < board.percentageCompleted) && r.correct) {
										scope.question.gameBoardCompletedPassed = gameBoardCompletedPassed;
										scope.question.gameBoardCompletedPerfect = gameBoardCompletedPerfect;
										scope.$emit('gameBoardCompletedPassed', scope.question.gameBoardCompletedPassed);
										scope.$emit('gameBoardCompletedPerfect', scope.question.gameBoardCompletedPerfect);

										if(!scope.modalPassedDisplayed && scope.question.gameBoardCompletedPassed) {
											console.log("scope.modalPassedDisplayed", scope.modalPassedDisplayed);
											scope.modals["congrats"].show();
											scope.$emit("modalPassedDisplayed", true);
										}

										if(!scope.modalPerfectDisplayed && scope.question.gameBoardCompletedPerfect) {
											console.log("scope.modalPerfectDisplayed", scope.modalPerfectDisplayed);
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

			}
		};
	}];
});
