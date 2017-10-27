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
	return ["$state", "$location", function($state, $location) {
		var MAX_LABEL_LENGTH = 24;
		var defaultAction = {
			disabled: false
		}

		this.checkMyAnswer = function(scope, api) { // TODO refactor so that less is passed to this function
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
					s.$promise.then(function foo(validationResponse) {
						scope.question.validationResponse = validationResponse;
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

				}
			};

			return {
				prototype: defaultAction,
				label: "Check my answer",
				disabled: !scope.canSubmit,
				onClick: checkAnswer,
				title: "Submit answer for marking",
			};
		};

		this.tryEasierQuestion = function(easierQuestion, currentQuestionId, pageCompleted, questionHistory, gameboardId) {			
			var fullLabel = `${easierQuestion.level == '2' ? 'Revise' : 'Practice'} ${easierQuestion.title.toLowerCase()}`;
			var abbreviatedLabel = `${easierQuestion.level == '2' ? 'Revise' : 'Practice'} this concept`;
			if (fullLabel.length <= MAX_LABEL_LENGTH) {
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
			if (fullLabel.length <= MAX_LABEL_LENGTH) {
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
				title: "Read suggested related concept page",
				label: "Read related concept page",
				onClick: function() {
					$state.go('concept', {id:conceptPage.id});
				},
			};
		};

		this.retryPreviousQuestion = function(questionHistory, gameboardId) {
			var previousQuestionId = questionHistory.pop();
			var commaSeparatedQuestionHistory = questionHistory.join(',')

			return {
				prototype: defaultAction,
				title: "Retry previous question page",
				label: "Return to previous question",
				onClick: function() {
					$state.go('question', {id:previousQuestionId, questionHistory:commaSeparatedQuestionHistory, board:gameboardId})
				}
			};
		};

		this.backToBoard = function(gameboardId) {
			// could go to next board question
			return {
				prototype: defaultAction,
				title: "This question is completed, return to gameboard",
				label: "Return to Top 10",
				onClick: function() {
					$location.url("/gameboards#" + gameboardId);
				},
			};
		};

		// TOOD MT for each method in factory wrap result with prototype default action

		return this;
	}];
});