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
		let defaultAction = {
			disabled: false
		}

		let TEMP_GRAPH_SKETCHER_RESULT = {
			correct:true,
			explanation: {
				children:[{
					encoding:"markdown",
					published:false,
					tags:[],
					type:"content",
					value:"Thank you for your help!<br />As we are not yet marking these test questions, they will not affect your progress statistics."
				}],
				encoding:"markdown",
				published:true,
				tags:[],
				type:"content"
			},
		};

		this.checkMyAnswer = function(scope, api) { // TODO refactor so that less is passed to this function
			let checkAnswer = function() {
				if (scope.question.selectedChoice != null && scope.canSubmit) {
					scope.canSubmit = false;

					if (["isaacSymbolicQuestion", "isaacSymbolicChemistryQuestion", "isaacSymbolicLogicQuestion"].indexOf(scope.doc.type) >= 0) {
						let selectedChoice = JSON.parse(scope.question.selectedChoice.value);
						if (selectedChoice.hasOwnProperty("symbols")) {
							// If we have symbols, this was definitely the graphical editor. Ensure an answer was provided:
							if (Object.keys(selectedChoice.symbols).length == 0) {
								return;
							}
						}
					}

					let s = api.questionValidator.validate({id: scope.doc.id}, scope.question.selectedChoice);
					s.$promise.then(function foo(validationResponse) {
						scope.question.validationResponse = validationResponse;
					}, function bar(e) {
						console.error("Error validating answer:", e);
						let eMessage = e.data.errorMessage;
						let eTitle = "Can't Submit Answer";
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
			if (!pageCompleted) {
				questionHistory.push(currentQuestionId);
			}
			let commaSeparatedQuestionHistory = questionHistory.join(',');

			return {
				prototype: defaultAction,
				title: "Try an easier question on " + easierQuestion.title.toLowerCase(),
				label: "Easier question?",
				onClick: function() {
					$state.go('question', {id:easierQuestion.id, questionHistory:commaSeparatedQuestionHistory, board:gameboardId});
				}
			};
		};

		this.trySupportingQuestion = function(supportingQuestion, currentQuestionId, pageCompleted, questionHistory, gameboardId) {
			let fullLabel = "Try more questions of a similar difficulty on " + supportingQuestion.title.toLowerCase();
			if (!pageCompleted) {
				questionHistory.push(currentQuestionId);
			}
			let commaSeparatedQuestionHistory = questionHistory.join(',');

			return {
				prototype: defaultAction,
				title: fullLabel,
				label: "More practice questions?",
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
			let previousQuestionId = questionHistory.pop();
			let commaSeparatedQuestionHistory = questionHistory.join(',')

			return {
				prototype: defaultAction,
				title: "Retry previous question page",
				label: "Return to Previous Question",
				onClick: function() {
					$state.go('question', {id:previousQuestionId, questionHistory:commaSeparatedQuestionHistory, board:gameboardId})
				}
			};
		};

		this.backToBoard = function(gameboardId) {
			return {
				prototype: defaultAction,
				title: "Return to Top 10 question gameboard",
				label: "Return to Top 10 Questions",
				onClick: function() {
					$location.url("/gameboards#" + gameboardId);
				},
			};
		};

		return this;
	}];
});