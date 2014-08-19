define([], function() {

	var PageController = ['$scope', 'auth', 'api', '$stateParams', '$window', function($scope, auth, api, $stateParams, $window) {

		$scope.auth = auth;
		$scope.target = $stateParams.target; 
		$scope.globalFlags.noSearch = true;

		$scope.warnings = function(){
			resetpassword: false;
		}

		$scope.login = function() {
			api.login($scope.user);
				//$window.location.href = '/';
		}
		$scope.resetPassword = function() {
			if($scope.user != null){
				api.password.reset({'email': $scope.user.email});
				$scope.warnings.resetpassword = true;
			}
		}
		
	}]

	return {
		PageController: PageController,
	};
})