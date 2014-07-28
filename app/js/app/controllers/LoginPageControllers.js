define([], function() {

	var PageController = ['$scope', 'auth', function($scope, auth) {

		$scope.auth = auth;
	}]

	return {
		PageController: PageController,
	};
})