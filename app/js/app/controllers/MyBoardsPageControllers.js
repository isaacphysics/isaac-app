define([], function() {

	var PageController = ['$scope', 'auth', 'api', 'gameBoardTitles', function($scope, auth, api, gameBoardTitles) {
		$scope.user = auth.getUser();

		$scope.generateGameBoardTitle = gameBoardTitles.generate;

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
				// Merge new boards into results 
				$.merge($scope.boards.results, newBoards.results);
			});
		}
		$scope.deleteBoard = function(id, name){
			// Warn user before deleting
			var confirmation = confirm("You are about to delete "+name+" board?");
			if (confirmation){
       			// TODO: This needs to be reviewed
       			// Currently reloading boards after delete
       			var inView = $scope.boards.results.length;
       			api.deleteGameBoard(id).$promise.then(function(){
       				$scope.boards = api.userGameBoards($scope.filterOption.val, $scope.sortOption.val, 0, inView);
       			});
			}
		}

		// update boards when filters have been selected
		$scope.$watch("filterOption", updateBoards);
		$scope.$watch("sortOption", updateBoards);
	}]

	return {
		PageController: PageController,
	};
})