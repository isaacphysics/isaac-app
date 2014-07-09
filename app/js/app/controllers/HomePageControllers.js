define([], function() {



	var PageController = ['$scope', 'api', '$location', function($scope, api, $location) {

		$scope.userInformation = api.currentUserInformation.get();

		$scope.filterPanelOpen = null;

		$scope.openFilterPanel = function(panelNumberToOpen) {
			if ($scope.filterPanelOpen === panelNumberToOpen) {
				// it turns into a toggle
				$scope.filterPanelOpen = null;
			}
			else{
				$scope.filterPanelOpen = panelNumberToOpen;	
			}
		}

		$scope.filterSubjects = ["physics"];
		$scope.filterFields = ["mechanics"];
		$scope.filterTopics = ["shm"];
		$scope.filterLevels = [2,4];
		$scope.filterConcepts = [];

		function loadGameBoardById(id) {

			console.debug("Loading game board by id: ", id)
			$scope.gameBoard = api.gameBoards.get({id: id});

			// TODO: Set filter to match game board
		}

		function loadGameBoardFromFilter() {

			console.debug("Loading game board based on filter settings.")

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
				params.concepts = $scope.filterConcepts.map(function(c) { return c.id }).join(",");

			$scope.gameBoard = api.gameBoards.filter(params);

			$scope.gameBoard.$promise.then(function(board) {
				$location.hash(board.id);
			})
		}

		function filterChanged(newVal, oldVal) {
			if (newVal !== undefined && newVal === oldVal)
				return; // Initialisation

			loadGameBoardFromFilter();

		}

		var hash = $location.hash();

		if (hash) {
			loadGameBoardById(hash);
		} else {
			loadGameBoardFromFilter();
		}

		$scope.$watchCollection("filterSubjects", filterChanged);
		$scope.$watchCollection("filterFields", filterChanged);
		$scope.$watchCollection("filterTopics", filterChanged);
		$scope.$watchCollection("filterLevels", filterChanged);
		$scope.$watchCollection("filterConcepts", filterChanged);
	}]

	return {
		PageController: PageController,
	};
})