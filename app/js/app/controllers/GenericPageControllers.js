define([], function() {

	var PageController = ['$scope', 'page', function($scope, page) {
		$scope.doc = page;
		$scope.page = page;
	}]

	return {
		PageController: PageController,
	};
})