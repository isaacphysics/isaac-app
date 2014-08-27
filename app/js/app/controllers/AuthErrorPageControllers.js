define([], function() {

	var PageController = ['$scope', '$stateParams', function($scope, $stateParams) {
		$scope.errorMessage = $stateParams.errorMessage;
		$scope.statusText = $stateParams.statusText;
	}]

	return {
		PageController: PageController,
	};
})