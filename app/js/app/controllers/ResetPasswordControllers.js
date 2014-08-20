define([], function() {

	var PageController = ['$scope', 'auth', 'api', '$stateParams', function($scope, auth, api, $stateParams) {
		$scope.user = {
			password: '',
			confirmPassword: ''
		};
		$scope.submitted = false;

		$scope.resetPassword = function() {
			api.password.reset({'token': $stateParams.token}, { 'password': $scope.user.password }).$promise.then(function(response) {
				console.log(response);
				$scope.submitted = true;
				$scope.message = "Your password has been reset successfully, you may now log in with your new password.";
			}, function(error) {
				$scope.submitted = true;
				$scope.message = "An error occurred whilst attempting to reset your password, please try again.";
			});
		}
	}];

	return {
		PageController: PageController
	};
});