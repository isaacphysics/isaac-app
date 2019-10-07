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

export const PageController = ['$scope', 'page', 'tags', '$sce', '$rootScope', 'persistence', '$location', '$stateParams', 'api', '$timeout', 'subject', 'EditorURL', 'questionActions', 'fastTrackProgressEnabledBoards', function($scope, page, tags, $sce, $rootScope, persistence, $location, $stateParams, api, _$timeout, subject, editorURL, questionActions, fastTrackProgressEnabledBoards) {
	$scope.page = page;
	$scope.questionPage = page;

	$rootScope.pageTitle = page.title;
	$scope.modalPerfectDisplayed = false;
	$scope.modalPassedDisplayed = false;
	$scope.fastTrackProgressEnabledBoards = fastTrackProgressEnabledBoards;

	$scope.state = {};

	$scope.contentEditorURL = editorURL + page.canonicalSourceFile;
	$scope.staging2URL = window.location.href.replace(window.location.origin, 'https://staging-2.isaacphysics.org');

	let pageTags = page.tags || [];

	// Find subject tags on page.
	let pageSubject = (tags.getPageSubjectTag(page.tags) || subject).id;
	let pageField = null;
	let pageTopic = null;

	if (pageSubject) {
		let fields = tags.getAllFieldTags(pageTags);

		if (fields.length == 1) {
			pageField = fields[0].id;
		} else if (fields.length > 1) {
			pageField = "multiple_fields"; // We found tags for more than one field.
		}

		if (pageField) {
			let topics = tags.getAllTopicTags(pageTags);

			if (topics.length == 1) {
				pageTopic = topics[0].id;
			} else if (topics.length > 1) {
				pageTopic = "multiple_topics"; // We found tags for more than one topic.
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

	let updateBoardProgressDetails = function() {
		$scope.gameboardId = $stateParams.board;
		$scope.backToTopTen = questionActions.backToBoard($scope.gameboardId);
		$scope.gameBoard = api.gameBoards.get({id: $stateParams.board});
		$scope.gameBoard.$promise.then(function(board) {

			console.debug("Question is from board:", board);
			// Cause this board to be persisted for the current user.
			// This will fail if we're not logged in, but that doesn't matter.
			api.saveGameBoard(board.id);
			// Find the index of this question on the game board.

			let thisIndex = null;
			for(let i = 0; i < board.questions.length; i++) {

				let q = board.questions[i];

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

	$scope.getTagTitle = function(id) {

		switch(id) {
			case "multiple_subjects":
				return $sce.trustAsHtml("Physics&nbsp;&amp;&nbsp;Maths");
			case "multiple_fields":
				return $sce.trustAsHtml("Multiple Fields");
			case "multiple_topics":
				return $sce.trustAsHtml("Multiple Topics");
		}

		for (let i in tags.tagArray) {
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
	$scope.$on('pageCompleted', function(_event) {
		if ($scope.gameboardId != undefined) {
			updateBoardProgressDetails();
		}
	})
	persistence.session.save("conceptPageSource", $location.url());

	if ($stateParams.board) {
		updateBoardProgressDetails();
	}

	$scope.questionHistory = $stateParams.questionHistory ? $stateParams.questionHistory.split(',') : [];
	if ($scope.questionHistory.length) {
		$scope.backToPreviousQuestion = questionActions.retryPreviousQuestion($scope.questionHistory.slice(), $scope.gameboardId);
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

	$scope.fastTrackConceptEnumerator = function(questionId) {
		// Magic, unfortunately
		return "_abcdefghijk".indexOf(questionId.split('_')[2].slice(-1));
	}

	$scope.$on("accordionsectionopen", function(_event, idx, _doc) {
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
}];
