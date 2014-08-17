define([], function() {

	var PageController = ['$scope', 'auth', 'api', function($scope, auth, api) {
		$scope.user = auth.getUser();


		$scope.filterOptions = [
			{label: "All Boards", val: null},
			{label: "Not Started", val: "not_attempted"},
			{label: "Incomplete", val: "in_progress"},
			{label: "Completed", val: "completed"},
		];

		$scope.sortOptions = [
			{label: "Date Created", val: "created"},
			{label: "Date Visited", val: "visited"},
			{label: "Subject", val: "subject"},
		];

		$scope.filterOption = $scope.filterOptions[0];
		$scope.sortOption = $scope.sortOptions[0];


		var updateBoards = function() {
			$scope.boards = api.userGameBoards($scope.filterOption.val, $scope.sortOption.val, 0);
		}

		$scope.loadMore = function() {
			api.userGameBoards($scope.filterOption.val, $scope.sortOption.val, $scope.boards.results.length).$promise.then(function(newBoards){
				$.merge($scope.boards.results, newBoards.results);
			});
		}
		$scope.deleteBoard = function(){
			api.deleteGameBoard();
		}

		$scope.$watch("filterOption", updateBoards);
		$scope.$watch("sortOption", updateBoards);
	}]

	return {
		PageController: PageController,
	};
})