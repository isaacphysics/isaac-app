/**
 * Copyright 2014 Stephen Cummins
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import angular from "angular";

export const PageController = ['$scope', '$state', 'api', '$timeout', '$q', '$stateParams', '$window', 'boardProcessor', function($scope, $state, api, $timeout, $q, $stateParams, $window, boardProcessor) {
    // setup defaults.
    $scope.questionSearchText = $stateParams.query ? $stateParams.query : "";
    $scope.questionSearchSubject = $stateParams.subject ? $stateParams.subject : "";
    $scope.questionSearchLevel = $stateParams.level ? ($stateParams.level == "any" ? null : $stateParams.level) : "1";
    $scope.loading = false;
    $scope.isStaffUser = ($scope.user._id && ($scope.user.role == 'ADMIN' || $scope.user.role == 'EVENT_MANAGER' || $scope.user.role == 'CONTENT_EDITOR' || $scope.user.role == 'STAFF'));
    $scope.boardTags = boardProcessor.boardTags;
    $scope.bookShow = false;
    $scope.bookSelection = "problem_solving";

    let sortField = $stateParams.sort ? $stateParams.sort : null;

    let largeNumberOfResults = -1; // assumes -1 limit will return all possible results.
    let bookIds = ["physics_skills_14", "physics_skills_19", "phys_book_gcse", "pre_uni_maths", "chemistry_16"];

    $scope.hasGroups = false;
    $scope.boardCreatedSuccessfully = false;
    $scope.baseBoardId = null;

    api.groupManagementEndpoint.get().$promise.then(function(results){
        if (results.length > 0) {
            $scope.hasGroups = true;
        }
    });

    $scope.findBookQuestions = function(book_id) {
        $scope.questionSearchText = book_id;
        $scope.questionSearchSubject = "";
        $scope.questionSearchLevel = null;
        sortField = "title";
    }

    $scope.wildCardList = api.gameBoards.wildcards();

    // set default wildcard to the random one.
    $scope.userSelectedBoardWildCardId = "RANDOM";

    // place holder wildcard - will be replaced by the server so we should remove it before submitting it.
    let randomWildCard = {
        "title": "Random Wild Card",
        "type": "isaacWildcard",
        "description": "?",
        "url" : ""
    };

    $scope.doNotFilterByLevelOrSubject = function() {
        $scope.questionSearchSubject = "";
        $scope.questionSearchLevel = "";
    }

    $scope.currentGameBoard = {questions:[], wildCard: randomWildCard, title: null} // used for rendering the current version of the gameBoard
    $scope.enabledQuestions = {}; // used to track the selected question ids in the checkboxes.

    // Allow cloning of existing gameboards:
    if ($stateParams.base != null && $stateParams.base != '' && $stateParams.base != 'true') {
        api.gameBoards.get({id: $stateParams.base}).$promise.then(function(response) {
            $scope.baseBoardId = $stateParams.base;
            for (let i = 0; i < response.questions.length; i++) {
                let question = response.questions[i];
                if (!$scope.isStaffUser && question.tags && question.tags.indexOf("nofilter") > -1) {
                    continue;  // But don't allow including of nofilter questions!
                }
                $scope.enabledQuestions[question.id] = true;
                $scope.currentGameBoard.questions.push({id: question.id, tags: question.tags, level: question.level, title: question.title});
            }
        }).catch(function() {
            $scope.showToast($scope.toastTypes.Failure, "Can't Find Gameboard", "No gameboard found with ID: " + $stateParams.base);
        });
    }

    // get the index of a question in a gameboard by id.
    let getGameBoardIndex = function(questionId) {
        let gameBoardQuestionsToSearch = $scope.currentGameBoard.questions;
        for (let i = 0; i < gameBoardQuestionsToSearch.length; i++) {
            if (gameBoardQuestionsToSearch[i].id == questionId) {
                return i;
            }
        }

        return -1;
    }

    // get a full question object by id from the current question list
    let getQuestionObject = function(questionId) {
        let questionList = $scope.searchResults;
        for (let i = 0; i < questionList.length; i++) {
            if (questionList[i].id == questionId) {
                return questionList[i];
            }
        }
        return -1;
    }

    // question finder code.
    let mostRecentQueryID = 0;
    let doQuestionSearch = function(searchQuery, searchLevel, searchTags) {
        let isFastTrackQuery = searchQuery == "fasttrack";
        let isBookQuery = bookIds.indexOf(searchQuery) >= 0;
        return api.getQuestionsResource().query({
            searchString: isFastTrackQuery ? '' : searchQuery,
            tags: isBookQuery ? searchQuery : searchTags, //  If it's a book, just the book tags; ignore others!
            levels: searchLevel,
            limit: largeNumberOfResults,
            fasttrack: isFastTrackQuery
        });
    };

    // timer for the search box to minimise number of requests sent to api
    let timer = null;
    $scope.$watch('questionSearchText + questionSearchLevel + questionSearchSubject', function() { 
        if (timer) {
            $timeout.cancel(timer);
            timer = null;
        }

        timer = $timeout(function() {
            $scope.loading = true;
            let myQueryID = ++mostRecentQueryID; // increment then assign query id
            doQuestionSearch($scope.questionSearchText, $scope.questionSearchLevel, $scope.questionSearchSubject)
            .$promise.then(function(questionsFromServer) {
                // only display results for most recent query request (i.e. not most recent asynchronous repsonse)
                if (myQueryID == mostRecentQueryID) {
                    // update the view
                    $scope.searchResults = questionsFromServer.results.filter(function(r) {
                        let keepElement = (r.id != "_regression_test_" && (!r.tags || r.tags.indexOf("nofilter") < 0));
                        return keepElement || $scope.isStaffUser;
                    });
                    // try to sort the results if requested.
                    if (sortField) {
                        $scope.searchResults.sort((a, b) => { return a[sortField] > b[sortField] ? 1 : -1; });
                        sortField = null;
                    }
                    $scope.loading = false;
                }
            });
        }, 500);
    });
    
    let updateWildCard = function(){
        angular.forEach($scope.wildCardList, function(wildCard, _key){
            
            if(wildCard.id == $scope.userSelectedBoardWildCardId) {
                $scope.currentGameBoard.wildCard = wildCard;
            }

            if ($scope.userSelectedBoardWildCardId == "RANDOM") {
                $scope.currentGameBoard.wildCard = randomWildCard;
            }
        });
    }

    let updateGameBoardPreview = function(newThing, oldQuestionData) {
        // clone questions so that the gameboard knows to update.
        let questionCopies = JSON.parse(JSON.stringify($scope.currentGameBoard.questions))
        updateWildCard();

        let newGameBoard = {questions:questionCopies, wildCard: $scope.currentGameBoard.wildCard, title: $scope.currentGameBoard.title, id: $scope.currentGameBoard.id};
        for (let questionId in $scope.enabledQuestions) {
            let gameBoardIndex = getGameBoardIndex(questionId);

            if ($scope.enabledQuestions[questionId] && gameBoardIndex == -1) {
                if (newGameBoard.questions.length == 10) {
                    $scope.showToast($scope.toastTypes.Failure, "Too Many Questions", "There is a maximum of 10 questions per gameboard. Please remove one to add another.");
                    $scope.enabledQuestions = oldQuestionData;
                } else {
                    let questionToAdd = getQuestionObject(questionId);
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
    }


    $scope.$watch('bookSelection', function(newThing, oldThing) {
        if (newThing == "books") {
            $scope.bookShow = true;
        } else {
            $scope.bookShow = false;
            $scope.questionSearchText = "";
            $scope.questionSearchSubject = "";
            $scope.questionSearchLevel = "1";
            sortField = "title";
        }
    }, true);

    $scope.bookId = $stateParams.bookId ? $stateParams.bookId : "";

    $scope.$watch('bookId', function(newThing, oldThing) {
        if (newThing === "A-Level Book Old") {
            $scope.questionSearchText = "physics_skills_14";
            $scope.questionSearchSubject = "";
            $scope.questionSearchLevel = null;
            sortField = "title";
        }
        if (newThing === "A-Level Book New") {
            $scope.questionSearchText = "physics_skills_19";
            $scope.questionSearchSubject = "";
            $scope.questionSearchLevel = null;
            sortField = "title";
        }
        if (newThing === "GCSE Book") {
              $scope.questionSearchText = "phys_book_gcse";
              $scope.questionSearchSubject = "";
            $scope.questionSearchLevel = null;
            sortField = "title";
        }
        if (newThing === "Maths Book") {
            $scope.questionSearchText = "maths_book";
            $scope.questionSearchSubject = "";
            $scope.questionSearchLevel = null;
            sortField = "title";
        }
        if (newThing === "Chemistry Book") {
            $scope.questionSearchText = "chemistry_16";
            $scope.questionSearchSubject = "";
            $scope.questionSearchLevel = null;
            sortField = "title";
        }
    }, true);

    $scope.resetForm = function() {
        $scope.boardCreatedSuccessfully = false;
        $scope.currentGameBoard = {questions:[], wildCard: randomWildCard, title: null} // used for rendering the current version of the gameBoard
        $scope.enabledQuestions = {}; // used to track the selected question ids in the checkboxes.
        $scope.baseBoardId = null;
    }

    // detect changes in the selected questions list and update the gameboard
    $scope.$watchCollection("enabledQuestions", updateGameBoardPreview);
    $scope.$watch("userSelectedBoardWildCardId", updateGameBoardPreview);

    $scope.saveGameBoard = function() {
        let saveConfirmed = $window.confirm('Are you sure you want to save this game board?');   

        if (!saveConfirmed) {
            return;
        }

        let GameBoard = api.gameBoards;
        let gameBoardToSave = new GameBoard($scope.currentGameBoard);
        
        gameBoardToSave.gameFilter = {subjects:[]} 
        // calculate subjects used in this gameboard
        angular.forEach($scope.currentGameBoard.questions, function(question, _key){
            if (question.tags.indexOf("physics") != -1 && gameBoardToSave.gameFilter.subjects.indexOf("physics") == -1) {
                gameBoardToSave.gameFilter.subjects.push("physics");
            }

            if (question.tags.indexOf("maths") != -1 && gameBoardToSave.gameFilter.subjects.indexOf("maths") == -1) {
                gameBoardToSave.gameFilter.subjects.push("maths");
            }

            if (question.tags.indexOf("chemistry") != -1 && gameBoardToSave.gameFilter.subjects.indexOf("chemistry") == -1) {
                gameBoardToSave.gameFilter.subjects.push("chemistry");
            }

            if (question.tags.indexOf("biology") != -1 && gameBoardToSave.gameFilter.subjects.indexOf("biology") == -1) {
                gameBoardToSave.gameFilter.subjects.push("biology");
            }
        });

        // clear placeholder wildcard so that server picks one.
        if (gameBoardToSave.wildCard === randomWildCard) {
            gameBoardToSave.wildCard = null;
        }

        // empty the id field if not set so the server can create one
        if (gameBoardToSave.id == "") {
            gameBoardToSave.id = null;
        }

        // a board can currently only have one tag so this is good enough for now
        if (gameBoardToSave.tags) {
            gameBoardToSave.tags = [gameBoardToSave.tags]
        } else if (gameBoardToSave.tags == "") {
            gameBoardToSave.tags = [];
        }

        gameBoardToSave.$save().then(function(gb) {
            $scope.currentGameBoard = gb;

            if ($scope.baseBoardId != null) {
                api.logger.log({
                    type: "CLONE_GAMEBOARD",
                    gameboardId: $scope.baseBoardId,
                    newGameboardId: $scope.currentGameBoard.id
                });
            }

            $scope.modals.gameCreated.show();
            $scope.boardCreatedSuccessfully = true;

        }).catch(function(e) {
            $scope.showToast($scope.toastTypes.Failure, "Save Operation Failed", "With error message: (" + e.status + ") " + e.status + ") "+ e.data.errorMessage != undefined ? e.data.errorMessage : "");
            gameBoardToSave.wildCard = void 0;
        });
    }

    api.logger.log({
        type: "VIEW_BOARD_BUILDER"
    })

    let pageUnloadMessage = 'If you leave this page you are going to lose all unsaved changes.';

    $window.onbeforeunload = function (event) {        
        //Check if there was any change, if no changes, then simply let the user leave
        if ((!$scope.currentGameBoard.title && $scope.currentGameBoard.questions.length < 1) || $scope.boardCreatedSuccessfully){
            return;
        }

        if (typeof event == 'undefined') {
            event = window.event;
        }
        if (event) {
            event.returnValue = pageUnloadMessage;
        }

        return pageUnloadMessage;
    }

    //This works only when user changes routes via angularUI, not when user refreshes the browsers, goes to previous page or try to close the browser
    $scope.$on('$stateChangeStart', function( event ) {    
        if ((!$scope.currentGameBoard.title && $scope.currentGameBoard.questions.length < 1) || $scope.boardCreatedSuccessfully) 
            return;

        let answer = confirm(pageUnloadMessage + " Are you sure you would like to continue?")
        if (!answer) {
            event.preventDefault();
            // fix to prevent loading icon appearing forever.
            $scope.setLoading(false)
        }
    });    

    $scope.$on('$destroy', function() {
        delete window.onbeforeunload;
    });
}];
