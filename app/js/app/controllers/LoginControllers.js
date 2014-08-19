define([], function() {

	var PageController = ['$scope', 'auth', 'api', '$stateParams', '$window', function($scope, auth, api, $stateParams, $window) {

		$scope.auth = auth;
		$scope.target = $stateParams.target; 
		$scope.globalFlags.noSearch = true;

		// Some basic warning flags for validation
		$scope.warnings = {
			resetpassword: false,
			email: false
		}

		$scope.login = function() {
			// Either email or password haven't been set
			if($scope.user == null || $scope.user.email == '' || $scope.user.password == '') {
				$scope.warnings.email = true;		
			}
			else {
				api.loginEndpoint.login($scope.user).$promise.then(function(){
					// Send user to homepage when login is successful
					$window.location.href = '/';
				});
			}
		}
		$scope.resetPassword = function() {
			if($scope.user == null || $scope.user.email == '') {
				// Show email required error message
				$scope.warnings.email = true;
			}
			else {
				// Send email and show message
				api.password.reset({'email': $scope.user.email});
				$scope.warnings.resetpassword = true;
			}
		}
		
	}]

	return {
		PageController: PageController,
	};
})