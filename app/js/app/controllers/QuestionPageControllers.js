define([], function() {

	// TODO: Implement orbit (carousel) thing
	// See problem.js and problem.html in final code drop.

	var PageController = ['$scope', 'page', 'tags', '$sce', '$rootScope', 'persistence', '$location', '$stateParams', 'api', '$timeout', function($scope, page, tags, $sce, $rootScope, persistence, $location, $stateParams, api, $timeout) {
		$scope.page = page;
		$scope.questionPage = page;
		$scope.figures = {};

		var pageTags = page.tags || [];

		var subjects = tags.filter(function(t) { return t && !t.parent; });

		// Find subject tags on page.
		var pageSubject = "physics";
		for(var i in subjects) {
			if (pageTags.indexOf(subjects[i].id) > -1) {
				pageSubject = subjects[i].id;
				break;
			}
		}

		if (pageSubject) {

			var fields = tags.filter(function(t) { return t && t.parent == pageSubject; });

			// Find field tags on page
			var pageField = null;
			for (var i in fields) {
				if (pageTags.indexOf(fields[i].id) > -1) {
					if (!pageField) {
						pageField = fields[i].id;
					} else {
						pageField = null; // We found tags for more than one field.
					}
				}
			}


			if (pageField) {

				var topics = tags.filter(function(t) { return t && t.parent == pageField; });

				// Find topic tags on page
				var pageTopic = null;
				for (var i in topics) {
					if (pageTags.indexOf(topics[i].id) > -1) {
						if (!pageTopic) {
							pageTopic = topics[i].id;
						} else {
							pageTopic = null; // We found tags for more than one topic.
						}
					}
				}
			}
		}

		$scope.breadCrumbs = [];

		if (pageSubject) {
			$rootScope.pageSubject = pageSubject;
			$scope.breadCrumbs.push(pageSubject);
			if (pageField) {
				$scope.breadCrumbs.push(pageField);
				if (pageTopic) {
					$scope.breadCrumbs.push(pageTopic);
				}
			}
		}

		$scope.getTagTitle = function(id) {

			for (var i in tags) {
				if (tags[i].id == id)
					return $sce.trustAsHtml(tags[i].title);
			}
		}

		persistence.session.save("conceptPageSource", $location.url());

		if ($stateParams.board) {
			$scope.gameBoard = api.gameBoards.get({id: $stateParams.board});
			$scope.gameBoard.$promise.then(function(board) {

				// Find the index of this question on the game board.

				var thisIndex = null;
				for(var i = 0; i < board.questions.length; i++) {

					var q = board.questions[i];

					if(q.id == page.id) {
						thisIndex = i;
						break;
					}
				}

				if (thisIndex == null) {
					console.error("Question not found in linked game board.");
					return;
				}

				$scope.nextQuestion = board.questions[thisIndex + 1];

			});
		}

		$scope.backToBoard = function() {
			$location.url("/#" + $stateParams.board)
		}

	}]

	return {
		PageController: PageController,
	};
})