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

	var PageController = ['$scope', 'page', 'tags', '$rootScope', function($scope, page, tags, $rootScope) {
		$scope.doc = page;

		var pageTags = page.tags;

		var subjects = tags.filter(function(t) { return t && !t.parent; });

		// Find subject tags on page.
		var pageSubject = null;
		for(var i in subjects) {
			if (pageTags.indexOf(subjects[i].id) > -1) {
				if (!pageSubject) {
					pageSubject = subjects[i].id;
				} else {
					pageSubject = "physics"; // We found tags for more than one subject.
				}
			}
		}


		$rootScope.pageSubject = pageSubject;
	}]

	return {
		PageController: PageController,
	};
})