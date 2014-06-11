define([], function() {

	var HeaderController = ['$scope', 'page', function($scope, page) {
		$scope.title = page.contentObject.title;
		$scope.subtitle = page.contentObject.subtitle;
		$scope.level = page.contentObject.level;
	}];

	var BodyController = ['$scope', 'page', function($scope, page) {
		$scope.doc = page.contentObject;
	}]

	return {
		HeaderController: HeaderController,
		BodyController: BodyController,
	};
})