define([], function() {

	var PageController = ['$scope', 'api', '$location', 'tags', '$sce', 'persistence', 'filterWarnings', 'auth', function($scope, api, $location, tags, $sce, persistence, filterWarnings, auth) {

		$scope.user = auth.getUser();

		$scope.filterPanelOpen = null;

		$scope.openFilterPanel = function(panelToOpen) {
			if ($scope.filterPanelOpen === panelToOpen) {
				$scope.filterPanelOpen = null;

			} else {
				$scope.filterPanelOpen = panelToOpen;
			}
		}

		$scope.filterSubjects = ["physics"];
		$scope.filterFields = [];
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

		function loadGameBoardById(id) {

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

				addFilterWatchers();
				setWarnings();

				buildBreadCrumb();

			}).catch(function() {
				$scope.gameBoardLoading = false;
				$scope.gameBoard = null;
			});
		}

		function loadGameBoardFromFilter() {

			console.log("Loading game board based on filter settings.")

			var params = {};

			if ($scope.filterSubjects.length > 0)
				params.subjects = $scope.filterSubjects.join(",");

			if ($scope.filterFields.length > 0)
				params.fields = $scope.filterFields.join(",");

			if ($scope.filterTopics.length > 0)
				params.topics = $scope.filterTopics.join(",");

			if ($scope.filterLevels.length > 0)
				params.levels = $scope.filterLevels.join(",");

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
				loadGameBoardById(hash);
			} else {
				loadGameBoardFromFilter();
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
                scrollTop: $(".hexagon_wrap").offset().top
            }, 1000);        }

        $scope.getGameboardTitle = function(gameboard) {
        	// Find the most specific filter tag that is the only one at its level.

        	// E.g. Physics > Mechanics > Dynamics = Dynamics
        	//      Physics > Mechanics > Dynamics, Statics = Mechanics
        	//      Physics > Mechanics = Mechanics
        	// Include special case:
        	//      Physics, Maths = Physics and Maths

        	
        }

	}]

	return {
		PageController: PageController,
	};
})
