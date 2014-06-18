define([], function() {

	var PageController = ['$scope', 'pageIndex', '$state', 'list', function($scope, pageIndex, $state, list) {
		$scope.list = list;
		$scope.pageNumber = pageIndex + 1;
	}]

	return {
		PageController: PageController,
	};
})