define([], function() {

	var PageController = ['$scope', 'auth', '$stateParams', function($scope, auth, $stateParams) {

		$scope.auth = auth;
		$scope.target = $stateParams.target;
		
	}]

	return {
		PageController: PageController,
	};
})