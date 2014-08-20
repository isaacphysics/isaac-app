define([], function() {

	var PageController = ['$scope', function($scope) {
		// Hide search on Login page
		$scope.globalFlags.noSearch = true;
		
	}]

	return {
		PageController: PageController,
	};
})