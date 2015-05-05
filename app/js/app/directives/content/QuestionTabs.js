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

				scope.checkAnswer = function() {
					if (scope.selectedChoice != null) {

						var s = api.questionValidator.validate({id: scope.doc.id}, scope.selectedChoice);

						s.$promise.then(function foo(r) {
							scope.validationResponse = r;

							if (scope.gameBoard) {

								// Re-load the game board to check for updated progress

								var initialGameBoardPercent = scope.gameBoard.percentageCompleted;

								api.gameBoards.get({id: scope.gameBoard.id}).$promise.then(function(board) {

									scope.state.gameBoardPercentComplete = board.percentageCompleted;

									if (initialGameBoardPercent < board.percentageCompleted) {
										// Something has actually changed. We must have either completed a question, or a question AND the board.
										scope.modals["congrats"].show();
/*
										if (board.percentageCompleted == 100) {
											// We completed the board.

										} else {
											// We completed a question.
										}*/
									}

								});
							}
						}, function bar(e) {
							console.error("Error validating answer:", e);
						});

					} else {
						// TODO: Somehow tell the user that they need to choose an option before clicking Check.
					}
				}

				scope.$watch("selectedChoice", function(newVal, oldVal) {
					if (newVal === oldVal)
						return; // Init

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