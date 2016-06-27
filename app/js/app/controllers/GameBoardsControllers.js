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
define([], function() {

	var PageController = ['$scope', 'api', '$location', 'tags', '$sce', 'persistence', 'filterWarnings', 'auth', 'gameBoardTitles', '$stateParams', function($scope, api, $location, tags, $sce, persistence, filterWarnings, auth, gameBoardTitles, $stateParams) {

		// TODO: Reset filterPanelOpen when resizing between mobile and desktop.

		if ($stateParams.filter) {
			$scope.filterPanelOpen = "desktop-filter";
		} else {
			$scope.filterPanelOpen = null;
		}

		$scope.$root.openFilterPanel = function(panelToOpen) {
			if ($scope.filterPanelOpen === panelToOpen) {
				$scope.filterPanelOpen = null;

			} else {
				$scope.filterPanelOpen = panelToOpen;
			}
		}

		var recordCurrentGameboard = function() {
			if (!$scope.gameBoard)
				return;
			
			persistence.save("lastGameBoardId", $scope.gameBoard.id);

			api.logger.log({
				type: "VIEW_GAMEBOARD_BY_ID",
				gameBoardId: $scope.gameBoard.id, 
			})
		}

		$scope.filterSubjects = ["physics"];
		$scope.filterFields = ["mechanics", "waves", "circuits"];
		$scope.filterTopics = [];
		$scope.filterLevels = [1];
		$scope.filterConcepts = [];

		function setWarnings() {
			$scope.warnings = filterWarnings($scope.filterSubjects, $scope.filterFields, $scope.filterTopics, $scope.filterLevels, $scope.filterConcepts);
		}

		var watchers = [];

		function addFilterWatchers() {
			watchers.push($scope.$watchCollection("filterSubjects", filterChanged));
			watchers.push($scope.$watchCollection("filterFields", filterChanged));
			watchers.push($scope.$watchCollection("filterTopics", filterChanged));
			watchers.push($scope.$watchCollection("filterLevels", filterChanged));
			watchers.push($scope.$watchCollection("filterConcepts", filterChanged));
		}

		function clearFilterWatchers() {
			var w = null;
			while(w = watchers.pop())
				w();
		}

		function loadGameBoardById(id, preventWarning) {

			console.log("Loading game board by id: ", id)

			$scope.gameBoardLoading = true;
			$scope.gameBoard = api.gameBoards.get({id: id})

			$scope.gameBoard.$promise.then(function(board) {
				$scope.gameBoardLoading = false;

				clearFilterWatchers();

				$scope.filterSubjects = board.gameFilter.subjects || [];
				$scope.filterFields = board.gameFilter.fields || [];
				$scope.filterTopics = board.gameFilter.topics || [];
				$scope.filterLevels = board.gameFilter.levels || [];
				$scope.filterConcepts = board.gameFilter.concepts || [];

				// TODO: Do this somewhere else.

				addFilterWatchers();
				setWarnings();

				buildBreadCrumb();
				recordCurrentGameboard();

			}).catch(function(e) {
				$scope.gameBoardLoading = false;
				$scope.gameBoard = null;

				if (!preventWarning) {
					if (e.statusText == "Not Found") {
        				$scope.showToast($scope.toastTypes.Failure, "Board Does Not Exist", "The specified game board does not exist.");
						// Something went wrong. This gameboard probably doesn't exist anymore.
						loadGameBoardFromFilter();
        			} else {
        				// The server is misbehaving, no point trying to load a new gameboard. Hope the user tries again later.
        				$scope.showToast($scope.toastTypes.Failure, "Error Loading Board", "There was an error loading the gameboard.");
        			}
				}
			});
		}

		function loadGameBoardFromFilter() {

			console.log("Loading game board based on filter settings.")

			var params = {};

			if ($scope.filterSubjects.length > 0) {
				params.subjects = $scope.filterSubjects.join(",");
			} else {
				params.subjects = "physics,maths";
			}

			if ($scope.filterFields.length > 0)
				params.fields = $scope.filterFields.join(",");

			if ($scope.filterTopics.length > 0)
				params.topics = $scope.filterTopics.join(",");

			if ($scope.filterLevels.length > 0) {
				params.levels = $scope.filterLevels.join(",");
			}
			else {
				params.levels = "1,2,3,4,5,6";
			}


			if ($scope.filterConcepts.length > 0)
				params.concepts = $scope.filterConcepts.join(",");

			$scope.gameBoardLoading = true;
			$scope.gameBoard = api.gameBoards.filter(params);

			$scope.gameBoard.$promise.then(function(board) {
				$scope.gameBoardLoading = false;

				if (!board.id) {
					$scope.gameBoard = null;
					return;
				}

				recordCurrentGameboard();

				if (!$location.hash()) {
					$location.replace();
				}
				$location.hash(board.id);

				lastHash = board.id;

			}).catch(function() {
				$scope.gameBoardLoading = false;
				$scope.gameBoard = null;
			})
		}

		function filterChanged(newVal, oldVal) {
			if (newVal !== undefined && newVal === oldVal)
				return; // Initialisation

			$scope.shuffleStack.length = 0;
			buildBreadCrumb();

			setWarnings();

			loadGameBoardFromFilter();
		}

		var lastHash = null;
		function hashChanged() {
			var hash = $location.hash();

			if (hash == lastHash)
				return;

			console.log("Hash changed:", hash);
			lastHash = hash;

			if (hash) {

				// We have requested a specific game board in the URL. Load it.
				loadGameBoardById(hash);

			} else {

				// We have not requested a specific game board in the URL.
				// Load the last one we saw. This will adjust the filter
				// settings to match.

				var savedGameboardId = persistence.load("lastGameBoardId");

				if (savedGameboardId) {

					$location.replace();
					$location.hash(savedGameboardId);
					lastHash = savedGameboardId;

					loadGameBoardById(savedGameboardId, true);

				} else {
					loadGameBoardFromFilter();
				}
			}
		}

		function buildBreadCrumb() {

			delete $scope.breadCrumbSubject;
			delete $scope.breadCrumbField;
			delete $scope.breadCrumbTopic;

			if ($scope.filterSubjects.length == 1) {
				$scope.breadCrumbSubject = $scope.filterSubjects[0];

				if ($scope.filterFields.length == 1) {
					$scope.breadCrumbField = $scope.filterFields[0];

					if ($scope.filterTopics.length == 1) {
						$scope.breadCrumbTopic = $scope.filterTopics[0];
					} else if ($scope.filterTopics.length > 1) {
						$scope.breadCrumbTopic = "multiple_topics";
					}

				} else if ($scope.filterFields.length > 1) {
					$scope.breadCrumbField = "multiple_fields";
				}

			} else if ($scope.filterSubjects.length > 1) {
				$scope.breadCrumbSubject = "multiple_subjects";
			}

		}

		$scope.shuffleStack = [];

		$scope.shuffleBoard = function() {
			$scope.shuffleStack.push($scope.gameBoard.id);
			var logMsg = {
				type: "SHUFFLE_BOARD",
				questions: {}
			};

			for (var i in $scope.gameBoard.questions) {
				var q = $scope.gameBoard.questions[i];
				logMsg.questions[q.id] = q.state;
			}

			api.logger.log(logMsg);
			
			loadGameBoardFromFilter();

		}

		$scope.undoShuffle = function() {
			newId = $scope.shuffleStack.pop();
			if (newId) {
				$location.hash(newId);
				loadGameBoardById(newId);
			}
		}

		$scope.getTagTitle = function(id) {

			switch(id) {
				case "multiple_subjects":
					return $sce.trustAsHtml("Physics&nbsp;&amp;&nbsp;Maths");
				case "multiple_fields":
					return $sce.trustAsHtml("Multiple Fields");
				case "multiple_topics":
					return $sce.trustAsHtml("Multiple Topics");
			}

			for (var i in tags.tagArray) {
				if (tags.tagArray[i].id == id)
					return $sce.trustAsHtml(tags.tagArray[i].title);
			}
		}

		hashChanged();

		addFilterWatchers();

		buildBreadCrumb();

		$(window).on('hashchange', hashChanged);
		$scope.$on('$stateChangeStart', function() {
			$(window).off('hashchange', hashChanged);
        });

        $scope.scrollToQuestions = function() {
			$('html, body').animate({
                scrollTop: $(".ru-board-title").offset().top
            }, 1000);        }
        $scope.scrollToWarnings = function() {
			$('html, body').animate({
                scrollTop: $(".warnings").offset().top
            }, 1000);        }

        $scope.generateGameBoardTitle = gameBoardTitles.generate;

        $scope.editedGameBoardTitle = null;

        $scope.saveGameBoardTitle = function() {
        	if (!$scope.editedGameBoardTitle)
        		return;

        	var oldTitle = $scope.gameBoard.title;
        	$scope.gameBoard.title = $scope.editedGameBoardTitle;
        	$scope.editedGameBoardTitle = null;

        	$scope.gameBoard.$save().then(function(gb) {
        		$scope.gameBoard.title = gb.title;
        	}).catch(function() {
        		$scope.gameBoard.title = oldTitle;
        	});
        }



        $("body").on("click", ".hex-filter-warning", $scope.scrollToWarnings);
        $scope.$on("destroy", function() {
        	$("body").off("click", ".hex-filter-warning", $scope.scrollToWarnings);
        })
	}]

	return {
		PageController: PageController,
	};
})
