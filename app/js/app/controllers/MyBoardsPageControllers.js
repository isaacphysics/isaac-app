define([], function() {

	var PageController = ['$scope', 'auth', 'api', function($scope, auth, api) {
		$scope.user = auth.getUser();

		$scope.boards = api.userGameBoards.query();
	}]

	return {
		PageController: PageController,
	};
})