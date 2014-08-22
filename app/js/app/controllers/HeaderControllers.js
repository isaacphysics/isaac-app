define([], function() {

	var PageController = ['$scope', 'auth', 'api', function($scope, auth, api) {
		$scope.user = auth.getUser();
	}];

	return {
		PageController: PageController
	};
});