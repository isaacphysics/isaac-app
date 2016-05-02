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

			restrict: 'A',

			transclude: true,

			templateUrl: "/partials/content/QuestionTabs.html",

			link: function(scope, element, attrs, ctrls, transclude) {

				scope.previousAnswerChoice = null;

				if (scope.accordionChildMetrics) {
					scope.accordionChildMetrics.questionCount++;
				}

				if (scope.doc.bestAttempt) {
					scope.validationResponse = scope.doc.bestAttempt;
					scope.selectedChoice = scope.validationResponse.answer;
				} else {

					// We have to explicitly initialise to null so that the 
					// validationResponse watcher fires on the question. This
					// can allow it to remove the accordion watcher.

					scope.validationResponse = null;
				}
				scope.validationResponseSet = true;

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

				// prevent undefined errors when we don't know which gameboard a person is working on.
				if(scope.gameBoard){
					scope.state.gameBoardCompletedPassed = false;
					scope.state.gameBoardCompletedPerfect = false;					
				}

				scope.checkAnswer = function() {
					if (scope.selectedChoice != null && scope.selectedChoice != scope.previousAnswerChoice) {
						scope.previousAnswerChoice = scope.selectedChoice;

						if (scope.doc.type == "isaacSymbolicQuestion") {
							var symbols = JSON.parse(scope.selectedChoice.value).symbols;
							if (Object.keys(symbols).length == 0) {
								return;
							}
						}

						var s = api.questionValidator.validate({id: scope.doc.id}, scope.selectedChoice);

						s.$promise.then(function foo(r) {
							scope.validationResponse = r;

							// Check the gameboard progress 
							if (scope.gameBoard) {
								// Re-load the game board to check for updated progress
								var initialGameBoardPercent = scope.gameBoard.percentageCompleted;
								var gameBoardCompletedPassed =  true;
								var gameBoardCompletedPerfect =  true;

								api.gameBoards.get({id: scope.gameBoard.id}).$promise.then(function(board) {
									scope.state.gameBoardPercentComplete = board.percentageCompleted;

									//We want to know if they have (a) completed the gameboard, (b) passed the gameboard
									for(var i = 0; i < board.questions.length; i++){
										if(board.questions[i].state != "PERFECT" ){
											gameBoardCompletedPerfect = false;
										}
										if(board.questions[i].state != "PASSED" && board.questions[i].state != "PERFECT"){
											gameBoardCompletedPassed = false;
										}
									}

									// If things have changed, and the answer is correct, show the modal
									if ((gameBoardCompletedPassed != !!scope.state.gameBoardCompletedPassed || 
									   gameBoardCompletedPerfect != !!scope.state.gameBoardCompletedPerfect ||
									   initialGameBoardPercent < board.percentageCompleted) && r.correct) {
										scope.state.gameBoardCompletedPassed = gameBoardCompletedPassed;
										scope.state.gameBoardCompletedPerfect = gameBoardCompletedPerfect;
										scope.modals["congrats"].show();
									}

									// NOTE: We can't just rely on percentageCompleted as it gives us 100% when there is one 
									// question for a gameboard and the question has been passed, not completed. See issue #419

								});
							}

						}, function bar(e) {
							console.error("Error validating answer:", e);
							scope.showToast(scope.toastTypes.Failure, "Can't Submit Answer", e.data.errorMessage != undefined ? e.data.errorMessage : "");
						});

					} else {
						// TODO: Somehow tell the user that they need to choose an option before clicking Check.
					}
				}

				scope.$watch("selectedChoice", function(newVal, oldVal) {
					if (newVal === oldVal)
						return; // Init
					scope.previousAnswerChoice = null;
					delete scope.validationResponse;
				}, true);


				// Prevent the transcluded template from getting a new child scope - attach it to our scope.
				transclude(scope, function(clone, scope) {
					element.find(".transclude-here").append(clone);
				})

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