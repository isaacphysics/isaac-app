define([], function() {

	var PageController = ['$scope', 'page', function($scope, page) {
		$scope.doc = page;
		$scope.figures = {};
	}]

	return {
		PageController: PageController,
	};
})