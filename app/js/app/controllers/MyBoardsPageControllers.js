define([], function() {

	var PageController = ['$scope', 'auth', 'api', function($scope, auth, api) {
		$scope.user = auth.getUser();

		$scope.boards = api.gameBoards.filter($scope.user);
	}]

	return {
		PageController: PageController,
	};
})