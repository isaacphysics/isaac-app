define([], function() {

	var PageController = ['$scope', 'auth', 'api', function($scope, auth, api) {
		$scope.user = auth.getUser();


		$scope.filterOptions = [
			{label: "All", val: null},
			{label: "Not started", val: "not_attempted"},
			{label: "Incomplete", val: "in_progress"},
			{label: "Completed", val: "completed"},
		];

		$scope.sortOptions = [
			{label: "Date created", val: "created"},
			{label: "Date visited", val: "visited"},
			{label: "Subject", val: "subject"},
		];

		$scope.filterOption = $scope.filterOptions[0];

		$scope.sortOption = $scope.sortOptions[0];

		var updateBoards = function() {

			$scope.boards = api.userGameBoards.query({
				sort: $scope.sortOption.val,
				show_only: $scope.filterOption.val,
			});
		}

		$scope.loadMore = function() {
			
			api.userGameBoards.query({
				sort: $scope.sortOption.val,
				show_only: $scope.filterOption.val,
				start_index: $scope.boards.length,
			}).$promise.then(function(newBoards) {
				$scope.boards = Array.prototype.concat.call($scope.boards,newBoards);
			})
		}


		updateBoards();

		$scope.$watch("filterOption", updateBoards);
		$scope.$watch("sortOption", updateBoards);
	}]

	return {
		PageController: PageController,
	};
})