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

			console.debug("Loading game board by id: ", id)

			$scope.gameBoard = api.gameBoards.get({id: id}).$promise.then(function(board) {

				clearFilterWatchers();

				$scope.filterSubjects = board.gameFilter.subjects || [];
				$scope.filterFields = board.gameFilter.fields || [];
				$scope.filterTopics = board.gameFilter.topics || [];
				$scope.filterLevels = board.gameFilter.levels || [];
				$scope.filterConcepts = board.gameFilter.concepts || [];

				addFilterWatchers();

				$scope.gameBoard = board;

			});
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
				params.concepts = $scope.filterConcepts.join(",");

			$scope.gameBoard = api.gameBoards.filter(params);

			$scope.gameBoard.$promise.then(function(board) {
				$location.hash(board.id);
				lastHash = board.id;
			})
		}

		function filterChanged(newVal, oldVal) {
			if (newVal !== undefined && newVal === oldVal)
				return; // Initialisation

			loadGameBoardFromFilter();
		}

		var lastHash = null;
		function hashChanged() {
			var hash = $location.hash();

			if (hash == lastHash)
				return;

			console.debug("Hash changed:", hash);
			lastHash = hash;

			if (hash) {
				loadGameBoardById(hash);
			} else {
				loadGameBoardFromFilter();
			}			
		}

		hashChanged();

		addFilterWatchers();

		$(window).on('hashchange', hashChanged);	
		$scope.$on('$stateChangeStart', function() {
			$(window).off('hashchange', hashChanged);
        });	

	}]

	return {
		PageController: PageController,
	};
})