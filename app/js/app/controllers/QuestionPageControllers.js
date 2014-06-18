define([], function() {

	var PageController = ['$scope', 'page', function($scope, page) {
		$scope.doc = page.contentObject;
	}]

	return {
		PageController: PageController,
	};
})