define([], function() {

	var PageController = ['$scope', '$window','authenticationEndpoint', function($scope, $window, authenticationEndpoint) {
		$scope.authEndpoint = authenticationEndpoint;

		$scope.redirectToProvider = function(provider, redirectUrl){
			$window.location.href = authenticationEndpoint + '/' + provider +"/authenticate?redirect=" + redirectUrl;
		};
	}]

	return {
		PageController: PageController,
	};
})