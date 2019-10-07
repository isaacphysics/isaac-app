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

export const PageController = ['$scope', 'page', 'tags', '$rootScope', 'persistence', '$location', '$window', 'api', 'subject', 'EditorURL', function($scope, page, tags, $rootScope, persistence, $location, $window, api, subject, editorURL) {
	$scope.page = page;

	$rootScope.pageTitle = page.title;

	$scope.contentEditorURL = editorURL + page.canonicalSourceFile;
	$scope.staging2URL = window.location.href.replace(window.location.origin, 'https://staging-2.isaacphysics.org');

	$scope.backButtonVisible = false;

	$rootScope.pageSubject = (tags.getPageSubjectTag(page.tags) || subject).id;

	$scope.sourceUrl = persistence.session.load("conceptPageSource");
	if ($scope.sourceUrl && $scope.sourceUrl.indexOf("/questions/") == 0) {
		$scope.backText = "Back to your question";
		$scope.backButtonVisible = true;
		// If we show this, it's *probably* the case that the user clicked a related concept:
		let qId = $scope.sourceUrl.split("?")[0].replace("/questions/","");
		api.logger.log({
			type: "VIEW_RELATED_CONCEPT",
			questionId: qId,
			conceptId: page.id,
		});
		// Reset the source, so no unwanted counting. Will stop "Back to Question" showing on reload, but probably no bad thing!
		persistence.session.save("conceptPageSource", $location.url());
	} else if ($scope.sourceUrl == "/concepts") {
		$scope.backText = "Back to concepts";
		$scope.backButtonVisible = true;
	} else if ($scope.sourceUrl && $scope.sourceUrl.indexOf("/concepts/") == 0) {
		// Explicitly log viewing of concept page related concepts, to be consistent with VIEW_RELATED_QUESTIONS events.
		let cId = $scope.sourceUrl.split("?")[0].replace("/concepts/","");
		if (cId != page.id) {
			api.logger.log({
				type: "VIEW_RELATED_CONCEPT",
				questionId: cId,
				conceptId: page.id,
			});
		}
		// Reset the source, so no unwanted counting. Will stop "Back to Question" showing on reload, but probably no bad thing!
		persistence.session.save("conceptPageSource", $location.url());
	}

	$scope.go = function(url) {
		if (url == "BACK") {
			$window.history.back();
		} else {
			$location.url(url);
		}
	}

	$scope.$on("accordionsectionopen", function(e, idx, doc) {
		api.logger.log({
			type: "CONCEPT_SECTION_OPEN",
			conceptPageId: page.id,
			conceptSectionIndex: idx,
			conceptSectionLevel: doc.level,
		})
	});

	$scope.$on("$destroy", function(){
		$rootScope.pageSubject = "";
	});

}];
