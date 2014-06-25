define([], function() {



	var PageController = ['$scope', 'api', function($scope, api) {

		$scope.filterSubjects = [];
		$scope.filterFields = [];
		$scope.filterTopics = [];
		$scope.filterLevels = [2,4];
		$scope.filterConcepts = [];

		function updateGameBoard() {

			$scope.gameBoard = api.gameBoards.get({
				subjects: $scope.filterSubjects,
				fields: $scope.filterFields,
				topics: $scope.filterTopics,
				levels: $scope.filterLevels,
				concepts: $scope.filterConcepts.map(function(c) { return c.id }),
			});
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