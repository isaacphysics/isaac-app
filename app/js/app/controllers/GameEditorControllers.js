/**
 * Copyright 2014 Stephen Cummins
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

	var PageController = ['$scope', 'pageIndex', '$state', 'list', 'api', '$timeout', function($scope, pageIndex, $state, list, api, $timeout) {
		var defaultQuestions = list;
		$scope.list = list; // the question search results
		$scope.questionSearchText = "";
		$scope.pageNumber = pageIndex + 1;

		$scope.currentGameBoard = {questions:[], wildCard: wildCard, title: "Game board title"} // used for rendering the current version of the gameBoard
		$scope.enabledQuestions = {}; // used to track the selected question ids.

		var doQuestionSearch = function(searchQuery){
			return api.searchEndpoint.search({searchTerms:searchQuery, types:"isaacQuestionPage"});
		};

		var timer = null;
		$scope.$watch('questionSearchText', function() { 
	        if (timer) {
	        	$timeout.cancel(timer);
	        	timer = null;
	        }

	        timer = $timeout(function() {
	            if ($scope.questionSearchText != "") {
	            	$scope.list = doQuestionSearch($scope.questionSearchText);	
	            } else {
	            	$scope.list = defaultQuestions
	            }
	        }, 500);
		});
		
		var getGameBoardIndex = function(questionId) {
			var gameBoardQuestionsToSearch = $scope.currentGameBoard.questions;
			for (var i = 0; i < gameBoardQuestionsToSearch.length; i++) {
				if (gameBoardQuestionsToSearch[i].id == questionId) {
					return i;
				}
			}

			return -1;
		}

		var getQuestionObject = function(questionId) {
			var questionList = $scope.list.results;
			for (var i = 0; i < questionList.length; i++) {
				if (questionList[i].id == questionId) {
					return questionList[i];
				}
			}
			return -1;
		}

		// detect changes in the selected questions list.
		$scope.$watchCollection("enabledQuestions", function(newThing, oldThing){
			// clone questions so that the gameboard knows to update.
			var questionCopies = JSON.parse(JSON.stringify($scope.currentGameBoard.questions))

			var newGameBoard = {questions:questionCopies, wildCard: wildCard, title: $scope.currentGameBoard.title};
			for (questionId in $scope.enabledQuestions) {
				var gameBoardIndex = getGameBoardIndex(questionId);

				if ($scope.enabledQuestions[questionId] && gameBoardIndex == -1) {
					if (newGameBoard.questions.length == 10) {
						alert("Error Gameboards can have a maximum of 10 questions - please remove a question if you wish to add another.");
						$scope.enabledQuestions = oldThing;
					} else {
						newGameBoard.questions.push(getQuestionObject(questionId))	
					}
				} else if (gameBoardIndex != -1 && !$scope.enabledQuestions[questionId]){
					newGameBoard.questions.splice(gameBoardIndex, 1)
				}
			}
			$scope.currentGameBoard = newGameBoard;
		})

		var wildCard = {
	        "id": "16f256e0-52e0-4a52-a2d4-458f42e00b75",
	        "title": "Why study physics?",
	        "type": "isaacWildcard",
	        "canonicalSourceFile": "content/wildcards/whyphysics.json",
	        "children": [],
	        "published": true,
	        "tags": [],
	        "description": "Why become a physicist?",
	        "url": "/pages/why_physics"
    	};

	}]

	return {
		PageController: PageController,
	};
})