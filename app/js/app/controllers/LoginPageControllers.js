define([], function() {

	var PageController = ['$scope', 'auth', '$stateParams', function($scope, auth, $stateParams) {

		$scope.auth = auth;
		$scope.target = $stateParams.target;
		$scope.globalFlags.noSearch = true;
		
	}]

	return {
		PageController: PageController,
	};
})