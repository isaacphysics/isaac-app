define([], function() {

	var PageController = ['$scope', 'auth', 'api', '$stateParams', '$window', function($scope, auth, api, $stateParams, $window) {

		$scope.auth = auth;
		$scope.target = $stateParams.target;

		

		$scope.login = function() {

			// Only submit if form is valid
			if($scope.form.$valid) {
				api.loginEndpoint.login($scope.user).$promise.then(function(){
					// On login redirect to home
					$window.location.href = '/';
				});
			}
		}
		$scope.resetPassword = function() {
			$scope.forgottenPassword = true;

			// Only submit if an email has been entered
			if($scope.form.email.$valid) {
				api.password.reset({'email': $scope.user.email}).$promise.then(function(){
					// Alert user that email has been sent
					$scope.passwordRestFlag = true;
				});
			}
		}
		
	}]

	return {
		PageController: PageController,
	};
})