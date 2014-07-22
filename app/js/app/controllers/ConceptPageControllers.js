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

	var PageController = ['$scope', 'page', 'tags', '$rootScope', 'persistence', '$location', '$window', function($scope, page, tags, $rootScope, persistence, $location, $window) {
		$scope.doc = page;
		$scope.page = page;

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
		$scope.sourceUrl = persistence.session.load("conceptPageSource");

		if($scope.sourceUrl.indexOf("/questions") == 0) {
			$scope.backText = "Back to your question";
		} else if ($scope.sourceUrl == "/concepts") {
			$scope.backText = "Back to concepts";
		} else {
			$scope.backText = "Back";
			$scope.sourceUrl = "BACK"
		}

		$rootScope.pageSubject = pageSubject;

		$scope.go = function(url) {
			if (url == "BACK") {
				$window.history.back();
			} else {
				$location.url(url);
			}
		}

		$scope.figures = {};
	}]

	return {
		PageController: PageController,
	};
})