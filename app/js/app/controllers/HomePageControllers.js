define([], function() {

	var PageController = ['$scope', 'api', function($scope, api) {

		$scope.gameBoard = api.gameBoards.get();
	}]

	return {
		PageController: PageController,
	};
})