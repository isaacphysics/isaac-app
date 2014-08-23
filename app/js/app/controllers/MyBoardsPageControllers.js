define([], function() {

	var PageController = ['$scope', 'auth', 'api', 'gameBoardTitles', function($scope, auth, api, gameBoardTitles) {
		$scope.globalFlags.isLoading = true;
		$scope.user = auth.getUser();

		$scope.generateGameBoardTitle = gameBoardTitles.generate;

		$scope.filterOptions = [
			{label: "All Boards", val: null},
			{label: "Not Started", val: "not_attempted"},
			{label: "In Progress", val: "in_progress"},
			{label: "Completed", val: "completed"}
		];

		$scope.sortOptions = [
			{label: "Date Created", val: "created"},
			{label: "Date Visited", val: "visited"},
			{label: "Subject", val: "subject"}
		];

		$scope.filterOption = $scope.filterOptions[0];
		$scope.sortOption = $scope.sortOptions[0];

		var updateBoards = function() {
			$scope.globalFlags.isLoading = true;
			api.userGameBoards($scope.filterOption.val, $scope.sortOption.val, 0).$promise.then(function(boards) {
				$scope.boards = boards;
				$scope.globalFlags.isLoading = false;
				$scope.globalFlags.displayLoadingMessage = false;
			})
		};

		// update boards when filters have been selected
		$scope.$watch("filterOption", function(newVal, oldVal) {
			// TODO: For some reason these watch functions are being fired for no reason
			if (newVal === oldVal) {
				return;
			}
			updateBoards();
		});

		$scope.$watch("sortOption", function(newVal, oldVal) {
			if (newVal === oldVal) {
				return;
			}
			updateBoards();
		});

		// Perform initial load
		updateBoards();

		$scope.loadMore = function() {
			api.userGameBoards($scope.filterOption.val, $scope.sortOption.val, $scope.boards.results.length).$promise.then(function(newBoards){
				// Merge new boards into results 
				$.merge($scope.boards.results, newBoards.results);
			});
		};

		$scope.deleteBoard = function(id, name){
			// Warn user before deleting
			var confirmation = confirm("You are about to delete "+name+" board?");
			if (confirmation){
       			// TODO: This needs to be reviewed
       			// Currently reloading boards after delete
       			var inView = $scope.boards.results.length;
       			api.deleteGameBoard(id).$promise.then(function(){
       				api.userGameBoards($scope.filterOption.val, $scope.sortOption.val, 0, inView).$promise.then(function(boards) {
						$scope.boards = boards;
					});
       			});
			}
		}
	}];

	return {
		PageController: PageController
	};
})