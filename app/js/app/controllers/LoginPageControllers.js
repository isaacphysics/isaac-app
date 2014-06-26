define([], function() {

	var PageController = ['$scope', 'page', function($scope, page) {
		$scope.authEndpoint = page;
	}]

	return {
		PageController: PageController,
	};
})