define([], function() {

	var PageController = ['$scope', 'page', function($scope, page) {
		$scope.doc = page;
	}]

	return {
		PageController: PageController,
	};
})