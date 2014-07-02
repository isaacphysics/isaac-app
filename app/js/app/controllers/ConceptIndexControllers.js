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

	var PageController = ['$scope', '$state', 'conceptList', function($scope, $state, conceptList) {

		$scope.allConcepts = conceptList.results;

		$scope.includePhysics = true;
		$scope.includeMaths = true;

	}]

	return {
		PageController: PageController,
	};
})