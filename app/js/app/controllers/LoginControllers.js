define([], function() {

	var PageController = ['$scope', 'auth', 'api', '$stateParams', '$window', function($scope, auth, api, $stateParams, $window) {

		$scope.auth = auth;
		$scope.target = $stateParams.target;

		$scope.login = function() {
			// Only submit if form is valid
			if($scope.form.$valid) {
				api.authentication.login($scope.user).$promise.then(function(){
					// Success
					$window.location.href = '/';
				},
				function(reason){
					// Error
					$scope.errorMessage = reason.data.errorMessage;
				});
			}
		}
		$scope.socialLogin = function(provider, target) {
			auth.loginRedirect(provider, target).$promise.then(function(){
				// Success
				console.log('Successful login');
			},
			function(reason){
				// Error
				console.log(reason.data.errorMessage);
			});
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
		
		$scope.hideMobileForm = function() {
			// Hide mobile log in form if shown
			// TODO: Find a better place for this, or just angularize the entire mobile log in form
			if ($("#mobile-login-form").hasClass('ru-drop-show')) {
				$("#mobile-login-form").ruDropDownToggle();
			}
		}
	}]

	return {
		PageController: PageController,
	};
})