define([], function() {

	// TODO: Implement keyboard-only navigation of concept index page.
	// Use, e.g.
	/*
		.bind('click keyup', function(e) {
            if(e.type === 'click' || (e.type === 'keyup' && e.which === 13))
            {
                e.preventDefault();
                window.location.href = ...;
            }
        });	 
	*/

	var PageController = ['$scope', '$state', 'conceptList', 'persistence', '$location', function($scope, $state, conceptList, persistence, $location) {

		$scope.allConcepts = conceptList.results;

		$scope.includePhysics = true;
		$scope.includeMaths = true;

		$scope.subjectFilter = function(input) {
			if (!input.tags)
				return false;
			return (input.tags.indexOf("physics") > -1 && $scope.includePhysics) || (input.tags.indexOf("maths") > -1 && $scope.includeMaths);
		}

		persistence.session.save("conceptPageSource", $location.url());

	}]

	return {
		PageController: PageController,
	};
})