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
		$scope.questionList = list.results;

		$scope.questionSearchText = "";
		$scope.pageNumber = pageIndex + 1;

		$scope.currentGameBoard = {questions:[], wildCard: wildCard, title: "Game board title"} // used for rendering the current version of the gameBoard
		$scope.enabledQuestions = {}; // used to track the selected question ids.

		// get the index of a question in a gameboard by id.
		var getGameBoardIndex = function(questionId) {
			var gameBoardQuestionsToSearch = $scope.currentGameBoard.questions;
			for (var i = 0; i < gameBoardQuestionsToSearch.length; i++) {
				if (gameBoardQuestionsToSearch[i].id == questionId) {
					return i;
				}
			}

			return -1;
		}

		// get a full question object by id from the current question list
		var getQuestionObject = function(questionId) {
			var questionList = $scope.questionList;
			for (var i = 0; i < questionList.length; i++) {
				if (questionList[i].id == questionId) {
					return questionList[i];
				}
			}
			return -1;
		}

		// use the global search endpoint to find questions by the search query provided
		var doQuestionSearch = function(searchQuery){
			return api.searchEndpoint.search({searchTerms:searchQuery, types:"isaacQuestionPage"});
		};

		// merge the results of a question search with currently selected questions.
		var mergeWithSelectedQuestions = function(questionList, newQuestions) {
			arrayToReturn = [];

			for (var i = 0; i < questionList.length; i++) {
				if (questionList[i].id in $scope.enabledQuestions && $scope.enabledQuestions[questionList[i].id]){
					arrayToReturn.push(questionList[i])	
				}
			}

			for (var i=0; i < newQuestions.length; i++) {
				if (!(newQuestions[i].id in $scope.enabledQuestions)) {
					arrayToReturn.push(newQuestions[i])	
				}
			}

			return arrayToReturn;
		}

		// timer for the search box to minimise number of requests sent to api
		var timer = null;
		$scope.$watch('questionSearchText', function() { 
	        if (timer) {
	        	$timeout.cancel(timer);
	        	timer = null;
	        }

	        timer = $timeout(function() {
	            if ($scope.questionSearchText != "") {
	            	doQuestionSearch($scope.questionSearchText)
	            	.$promise.then(function(questionsFromServer){
	            		$scope.list = questionsFromServer;
	            		$scope.questionList = mergeWithSelectedQuestions($scope.questionList, questionsFromServer.results);
	            	});
	            } else {
	            	$scope.list = defaultQuestions.results;
	            	$scope.questionList = mergeWithSelectedQuestions($scope.questionList, defaultQuestions.results);
	            }
	        }, 500);
		});
		
		// detect changes in the selected questions list and update the gameboard
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
						var questionToAdd = getQuestionObject(questionId);
						// remove fields that don't mean anything to gameboards. 
						delete questionToAdd["type"];
						delete questionToAdd["url"];
						delete questionToAdd["summary"];
						newGameBoard.questions.push(questionToAdd)	
					}
				} else if (gameBoardIndex != -1 && !$scope.enabledQuestions[questionId]){
					newGameBoard.questions.splice(gameBoardIndex, 1)
				}
			}
			$scope.currentGameBoard = newGameBoard;
		})
		
		// place holder wildcard - will be replaced by the server
		var wildCard = {
	        "title": "Random Wild Card",
	        "type": "isaacWildcard",
	        "description": "?"
    	};

        $scope.saveGameBoard = function() {
        	var GameBoard = api.gameBoards;

        	var gameBoardToSave = new GameBoard($scope.currentGameBoard);
        	gameBoardToSave.gameFilter = {subjects:["physics"]} // TODO default to physics for now
        	
        	// clear placeholder wildcard so that server picks one.
        	gameBoardToSave.wildCard = null
        	var savedItem = gameBoardToSave.$save().then(function(gb) {
        		$scope.currentGameBoard = gb;
        		$state.go('board', {id: gb.id})
        	}).catch(function() {
        		alert("Game board Save operation failed.")
        	});
        }
	}]

	return {
		PageController: PageController,
	};
})