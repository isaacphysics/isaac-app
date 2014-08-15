define([], function() {

	var PageController = ['$scope', 'auth', 'api', '$stateParams', '$window', function($scope, auth, api, $stateParams, $window) {

		$scope.auth = auth;
		$scope.target = $stateParams.target; 
		$scope.globalFlags.noSearch = true;

		$scope.login = function() {
			api.loginEndpoint.login($scope.user, function() {
				$window.location.href = '/';
			});
		}
		
	}]

	return {
		PageController: PageController,
	};
})