define([], function() {



	var PageController = ['$scope', 'api', function($scope, api) {

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
		$scope.filterTopics = [];
		$scope.filterLevels = [2,4];
		$scope.filterConcepts = [];

		function updateGameBoard() {

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

			$scope.gameBoard = api.gameBoards.get(params);
		}

		$scope.$watchCollection("filterSubjects", updateGameBoard);
		$scope.$watchCollection("filterFields", updateGameBoard);
		$scope.$watchCollection("filterTopics", updateGameBoard);
		$scope.$watchCollection("filterLevels", updateGameBoard);
		$scope.$watchCollection("filterConcepts", updateGameBoard);
	}]

	return {
		PageController: PageController,
	};
})