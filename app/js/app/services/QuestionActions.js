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
			disabled: false
		}

		this.checkMyAnswer = function(canSubmit, checkAnswer) {
			return {
				prototype: defaultAction,
				label: "Check my answer",
				disabled: !canSubmit,
				onClick: checkAnswer,
			};
		};

		this.tryEasierQuestion = function(easierQuestion, currentQuestionId, pageCompleted, questionHistory, gameboardId) {			
			// label
			var calculatedLabel = easierQuestion.level == '2' ? 'Revise ' : 'Practice ';
			var defaultConceptDescriptor = 'this concept'
			calculatedLabel += easierQuestion.title.length < defaultConceptDescriptor.length ? easierQuestion.title : defaultConceptDescriptor;
			
			// logic
			if (!pageCompleted) {
				questionHistory.push(currentQuestionId);
			}

			// link
			parameters = {
				id: easierQuestion.id,
				questionHistory: questionHistory.join(','),
				board: gameboardId,
			};

			return {
				prototype: defaultAction,
				label: calculatedLabel,
				onClick: function() {
					$state.go('question', parameters);
				},
			};
		};

		this.trySupportingQuestion = function(supportingQuestion, currentQuestionId, pageCompleted, questionHistory, gameboard) {
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
		};

		this.showRelatedConceptPage = function(conceptPage) {
			return {
				prototype: defaultAction,
				label: "Read related concept page",
				onClick: function() {
					$location(`/concepts/${conceptPage.id}`);
				},
			};
		};

		this.retryPreviousQuestion = function(questionHistory, gameboard) {
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
		};

		this.goToNextQuestionPart = function() {
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
		};

		this.goToNextBoardQuestion = function() {
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

		// TOOD MT for each method in factory wrap result with prototype default action

		return this;
	}];
});