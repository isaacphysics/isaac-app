define([], function() {

	var PageController = ['$scope', '$state', 'conceptList', function($scope, $state, conceptList) {

		$scope.allConcepts = conceptList.results;

		$scope.includePhysics = true;
		$scope.includeMaths = true;

	}]

	return {
		PageController: PageController,
	};
})