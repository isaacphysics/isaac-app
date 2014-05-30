define([], function() {

	var HeaderController = ['$scope', 'pageIndex', function($scope, pageIndex) {
		$scope.pageNumber = pageIndex + 1;
	}];

	var BodyController = ['$scope', 'pageIndex', '$state', 'list', function($scope, pageIndex, $state, list) {
		$scope.list = list;
		$scope.pageNumber = pageIndex + 1;
	}]

	return {
		HeaderController: HeaderController,
		BodyController: BodyController,
	};
})