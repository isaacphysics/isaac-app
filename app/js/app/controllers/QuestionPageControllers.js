define([], function() {

	// TODO: Implement orbit (carousel) thing
	// See problem.js and problem.html in final code drop.

	var PageController = ['$scope', 'page', function($scope, page) {
		$scope.doc = page;
	}]

	return {
		PageController: PageController,
	};
})