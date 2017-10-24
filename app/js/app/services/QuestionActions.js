/**
 * Copyright 2017 Meurig Thomas
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
	// TODO MT View Service	is more suitable http://demisx.github.io/angularjs/2014/09/14/angular-what-goes-where.html
	return ["$state", function($state) {
		var defaultAction = {
			disabled: false,
			title: ''
		}

		this.checkMyAnswer = function(scope, api) {
			// TODO MT checkAnswer needs breaking up and passed less info
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
			};

			return {
				prototype: defaultAction,
				label: "Check my answer",
				disabled: !scope.canSubmit,
				onClick: checkAnswer,
			};
		};

		this.tryEasierQuestion = function(easierQuestion, currentQuestionId, pageCompleted, questionHistory, gameboardId) {			
			var fullLabel = `${easierQuestion.level == '2' ? 'Revise' : 'Practice'} ${easierQuestion.title.toLowerCase()}`;
			var abbreviatedLabel = `${easierQuestion.level == '2' ? 'Revise' : 'Practice'} this concept`;
			if (fullLabel.length <= abbreviatedLabel.length) {
				abbreviatedLabel = fullLabel;
			}

			if (!pageCompleted) {
				questionHistory.push(currentQuestionId);
			}
			commaSeparatedQuestionHistory = questionHistory.join(',');

			return {
				prototype: defaultAction,
				title: fullLabel,
				label: abbreviatedLabel,
				onClick: function() {
					$state.go('question', {id:easierQuestion.id, questionHistory:commaSeparatedQuestionHistory, board:gameboardId});
				}
			};
		};

		this.trySupportingQuestion = function(supportingQuestion, currentQuestionId, pageCompleted, questionHistory, gameboardId) {
			var fullLabel = `More ${supportingQuestion.title.toLowerCase()} ${supportingQuestion.level == '2' ? 'revision' : 'practice'}`;
			var abbreviatedLabel = `More ${supportingQuestion.level == '2' ? 'revision' : 'practice'} of this concept`; 
			if (fullLabel.length <= abbreviatedLabel.length) {
				abbreviatedLabel = fullLabel;
			}

			if (!pageCompleted) {
				questionHistory.push(currentQuestionId);
			}
			var commaSeparatedQuestionHistory = questionHistory.join(',');

			return {
				prototype: defaultAction,
				title: fullLabel,
				label: abbreviatedLabel,
				onClick: function() {
					$state.go('question', {id:supportingQuestion.id, questionHistory:commaSeparatedQuestionHistory, board:gameboardId});
				},
			};
		};

		this.showRelatedConceptPage = function(conceptPage) {
			return {
				prototype: defaultAction,
				label: "Read related concept page",
				onClick: function() {
					$state.go('concept', {id:conceptPage.id}); //TODO MT need to test this
				},
			};
		};

		this.retryPreviousQuestion = function(questionHistory, gameboardId) {
			var previousQuestionId = questionHistory.pop();
			var commaSeparatedQuestionHistory = questionHistory.join(',')

			return {
				prototype: defaultAction,
				label: "Retry previous question",
				onClick: function() {
					$state.go('question', {id:previousQuestionId, questionHistory:commaSeparatedQuestionHistory, board:gameboardId})
				}
			};
		};

		this.goToNextQuestionPart = function() {
			// TODO MT some js to select the next textbox and ensure it is in view
			return {
				prototype: defaultAction,
				label: "Try next quesiton part",
				disabled: true,
				onClick: function() {
					// link to content page
					console.log('Go to next Q Part');
				},
			};
		};

		this.goToNextBoardQuestion = function() {
			// TODO MT might already be implemented but commented out
			return {
				disabled: true,
				prototype: defaultAction,
				label: "Go to next board Question",
				onClick: function() {
					// link to content page
					console.log('Go to next board Quesiton')
				},
			};
		}

		// TOOD MT for each method in factory wrap result with prototype default action

		return this;
	}];
});