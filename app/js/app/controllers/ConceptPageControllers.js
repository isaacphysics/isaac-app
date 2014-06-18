define([], function() {

	var HeaderController = ['$scope', 'page', function($scope, page) {
	}];

	var BodyController = ['$scope', 'page', function($scope, page) {
		$scope.doc = page.contentObject;
	}]

	return {
		HeaderController: HeaderController,
		BodyController: BodyController,
	};
})