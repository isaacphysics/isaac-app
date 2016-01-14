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

	// TODO: Make the "Back to question" button work properly

	// Snippet from honest that might help:
	/*
            // Panel arrow
            $(".ru-panel-arrow").click(function()
            {
                window.location.href = $(this).attr('data-url');
            });
	*/

	var PageController = ['$scope', 'page', 'tags', '$rootScope', 'persistence', '$location', '$window', 'api', function($scope, page, tags, $rootScope, persistence, $location, $window, api) {
		$scope.page = page;

		$rootScope.pageTitle = page.title;

		var pageTags = page.tags || [];

		var subjects = tags.tagArray.filter(function(t) { return t && !t.parent; });

		$scope.backButtonVisible = false;

		// Find subject tags on page.
		var pageSubject = "physics";
		for(var i in subjects) {
			if (pageTags.indexOf(subjects[i].id) > -1) {
				pageSubject = subjects[i].id;
				break;
			}
		}
		$scope.sourceUrl = persistence.session.load("conceptPageSource");
		console.log($scope.sourceUrl);
		if($scope.sourceUrl && $scope.sourceUrl.indexOf("/questions") == 0) {
			$scope.backText = "Back to your question";
			$scope.backButtonVisible = true;
		} else if ($scope.sourceUrl == "/concepts") {
			$scope.backText = "Back to concepts";
			$scope.backButtonVisible = true;
		} 

		$rootScope.pageSubject = pageSubject;

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

	}]

	return {
		PageController: PageController,
	};
})