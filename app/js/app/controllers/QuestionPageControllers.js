/**
 * Copyright 2014 Ian Davies
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at
 * 		http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
define([], function() {

	// TODO: Implement orbit (carousel) thing
	// See problem.js and problem.html in final code drop.

	var PageController = ['$scope', 'page', 'tags', '$sce', '$rootScope', 'persistence', '$location', '$stateParams', 'api', '$timeout', 'EditorURL', function($scope, page, tags, $sce, $rootScope, persistence, $location, $stateParams, api, $timeout, editorURL) {
		$scope.page = page;
		$scope.questionPage = page;

		$rootScope.pageTitle = page.title;
		$scope.modalPerfectDisplayed = false;
		$scope.modalPassedDisplayed = false;

		$scope.state = {};

		$scope.contentEditorURL = editorURL + page.canonicalSourceFile;

		var pageTags = page.tags || [];

		var subjects = tags.tagArray.filter(function(t) { return t && !t.parent; });

		// Find subject tags on page.
		var pageSubject = "physics";
		for(var i in subjects) {
			if (pageTags.indexOf(subjects[i].id) > -1) {
				pageSubject = subjects[i].id;
				break;
			}
		}

		if (pageSubject) {

			var fields = tags.tagArray.filter(function(t) { return t && t.parent == pageSubject; });

			// Find field tags on page
			var pageField = null;
			for (var i in fields) {
				if (pageTags.indexOf(fields[i].id) > -1) {
					if (!pageField) {
						pageField = fields[i].id;
					} else {
						pageField = "multiple_fields"; // We found tags for more than one field.
					}
				}
			}


			if (pageField) {

				var topics = tags.tagArray.filter(function(t) { return t && t.parent == pageField; });

				// Find topic tags on page
				var pageTopic = null;
				for (var i in topics) {
					if (pageTags.indexOf(topics[i].id) > -1) {
						if (!pageTopic) {
							pageTopic = topics[i].id;
						} else {
							pageTopic = "multiple_topics"; // We found tags for more than one topic.
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

			switch(id) {
				case "multiple_subjects":
					return $sce.trustAsHtml("Physics&nbsp;&amp;&nbsp;Maths");
				case "multiple_fields":
					return $sce.trustAsHtml("Multiple Fields");
				case "multiple_topics":
					return $sce.trustAsHtml("Multiple Topics");
			}

			for (var i in tags.tagArray) {
				if (tags.tagArray[i].id == id)
					return $sce.trustAsHtml(tags.tagArray[i].title);
			}
		}
		$scope.$on("modalPerfectDisplayed", function(e, b) {
			$scope.modalPerfectDisplayed = b;
		});
		$scope.$on("modalPassedDisplayed", function(e, b) {
			$scope.modalPassedDisplayed = b;
		});
		$scope.$on('gameBoardCompletedPassed', function(e, data) {
			$scope.gameBoardCompletedPassed = data;
		});
		$scope.$on('gameBoardCompletedPerfect', function(e, data) {
			$scope.gameBoardCompletedPerfect = data;
		});
		persistence.session.save("conceptPageSource", $location.url());

		if ($stateParams.board) {
			$scope.gameBoard = api.gameBoards.get({id: $stateParams.board});
			$scope.gameBoard.$promise.then(function(board) {

				console.debug("Question is from board:", board);
				// Cause this board to be persisted for the current user.
				// This will fail if we're not logged in, but that doesn't matter.
				api.saveGameBoard(board.id);
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
			$location.url("/gameboards#" + $stateParams.board)
		}

		$scope.logClickSupersededBy = function(){
			api.logger.log({
				type: "VIEW_SUPERSEDED_BY_QUESTION",
				questionId: page.id,
				supersededBy: page.supersededBy,
			});
		};

		$scope.$on("accordionsectionopen", function(e, idx, doc) {
			api.logger.log({
				type: "QUESTION_PART_OPEN",
				questionPageId: page.id,
				questionPartIndex: idx,
			})
		});

		//Hide hints or answers when printing
		$scope.printingVisibility = {
			hints : true
		};

		$scope.$on("$destroy", function(){
			$rootScope.pageSubject = "";
		});


	}]

	return {
		PageController: PageController,
	};
})
