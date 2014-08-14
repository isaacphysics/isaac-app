define([], function() {

	var PageController = ['$scope', 'auth', 'api', '$stateParams', '$location', function($scope, auth, api, $stateParams, $location) {

		$scope.auth = auth;
		$scope.target = $stateParams.target; 
		$scope.globalFlags.noSearch = true;

		$scope.login = function() {
			api.loginEndpoint.login($scope.user);
			//$location.path('/');
		}
		
	}]

	return {
		PageController: PageController,
	};
})