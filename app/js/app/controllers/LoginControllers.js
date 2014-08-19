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
		$scope.resetPassword = function() {
			if($scope.user.email){
				api.password.reset($scope.user.email);
				console.log($scope.user.email);
			}
		}
		
	}]

	return {
		PageController: PageController,
	};
})