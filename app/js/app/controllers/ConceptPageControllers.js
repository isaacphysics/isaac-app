define([], function() {

	// TODO: Make the "Back to question" button work properly

	// Snippet from honest that might help:
	/*
            // Panel arrow
            $(".ru-panel-arrow").click(function()
            {
                window.location.href = $(this).attr('data-url');
            });
	*/

	var PageController = ['$scope', 'page', function($scope, page) {
		$scope.doc = page.contentObject;
	}]

	return {
		PageController: PageController,
	};
})