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

	var PageController = ['$scope', '$state', 'api', '$timeout', '$q', '$stateParams', function($scope, $state, api, $timeout, $q, $stateParams) {
		// setup defaults.
		$scope.questionSearchText = $stateParams.query ? $stateParams.query : "";
		$scope.questionSearchSubject = $stateParams.subject ? $stateParams.subject : "";
		$scope.questionSearchLevel = $stateParams.level ? ($stateParams.level == "any" ? null : $stateParams.level) : "1";
		$scope.loading = false;

		var sortField = $stateParams.sort ? $stateParams.sort : null;

		var largeNumberOfResults = 99999; //TODO: Fix this when search works properly in the API

		// place holder wildcard - will be replaced by the server so we should remove it before submitting it.
		var wildCard = {
	        "title": "Random Wild Card",
	        "type": "isaacWildcard",
	        "description": "?",
	        "url" : ""
    	};

		$scope.currentGameBoard = {questions:[], wildCard: wildCard, title: "Game board title"} // used for rendering the current version of the gameBoard
		$scope.enabledQuestions = {}; // used to track the selected question ids in the checkboxes.

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
			var questionList = $scope.searchResults;
			for (var i = 0; i < questionList.length; i++) {
				if (questionList[i].id == questionId) {
					return questionList[i];
				}
			}
			return -1;
		}

		// question finder code.
		var httpCanceller = null;
		var doQuestionSearch = function(searchQuery, searchLevel, searchTags){
			// if we have a current promise outstanding cancel it.
			if (httpCanceller != null) {
				httpCanceller.resolve();
				httpCanceller = null;
			}

			// create a new promise so we can cancel it later.
			httpCanceller = $q.defer();
			var questionSearchResource = api.getQuestionsResource(httpCanceller);
			return questionSearchResource.query({searchString:searchQuery, tags:searchTags, levels:searchLevel, limit:largeNumberOfResults});
		};

		// timer for the search box to minimise number of requests sent to api
		var timer = null;
		$scope.$watch('questionSearchText + questionSearchLevel + questionSearchSubject', function() { 
	        if (timer) {
	        	$timeout.cancel(timer);
	        	timer = null;
	        }

	        timer = $timeout(function() {
            	$scope.loading = true;

            	doQuestionSearch($scope.questionSearchText, $scope.questionSearchLevel, $scope.questionSearchSubject)
            	.$promise.then(function(questionsFromServer){
					httpCanceller = null;
        			// update the view
        			$scope.searchResults = questionsFromServer.results;
        			// try to sort the results if requested.
        			if (sortField) {
	        			$scope.searchResults.sort(function(a,b) {
	        				return a[sortField] > b[sortField] ? 1 : -1;
	        			})        				
        			}
        			$scope.loading = false;
            	});
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
        				$scope.showToast($scope.toastTypes.Failure, "Too Many Questions", "There is a maximum of 10 questions per gameboard. Please remove one to add another.");
						$scope.enabledQuestions = oldThing;
					} else {
						var questionToAdd = getQuestionObject(questionId);
						// remove fields that don't mean anything to gameboards as otherwise the api will complain. 
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

        $scope.saveGameBoard = function() {
        	var GameBoard = api.gameBoards;
        	var gameBoardToSave = new GameBoard($scope.currentGameBoard);
      	
			gameBoardToSave.gameFilter = {subjects:[]} 
        	// calculate subjects used in this gameboard
        	angular.forEach($scope.currentGameBoard.questions, function(question, key){
				if (question.tags.indexOf("physics") != -1 && gameBoardToSave.gameFilter.subjects.indexOf("physics") == -1) {
					gameBoardToSave.gameFilter.subjects.push("physics")
				}

				if (question.tags.indexOf("maths") != -1 && gameBoardToSave.gameFilter.subjects.indexOf("maths") == -1) {
					gameBoardToSave.gameFilter.subjects.push("maths")
				}
			});

        	// clear placeholder wildcard so that server picks one.
        	gameBoardToSave.wildCard = null

        	if (gameBoardToSave.id == "") {
        		gameBoardToSave.id = null;
        	}
        	var savedItem = gameBoardToSave.$save().then(function(gb) {
        		$scope.currentGameBoard = gb;
        		$state.go('board', {id: gb.id})
        	}).catch(function(e) {
        		$scope.showToast($scope.toastTypes.Failure, "Save Operation Failed", "With error message: (" + e.status + ") " + e.status + ") "+ e.data.errorMessage != undefined ? e.data.errorMessage : "");
        		gameBoardToSave.wildCard = wildCard
        	});
        }

		api.logger.log({
			type: "VIEW_BOARD_BUILDER"
		})        
	}]

	return {
		PageController: PageController,
	};
})