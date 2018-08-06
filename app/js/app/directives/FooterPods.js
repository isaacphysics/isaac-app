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
define(["/partials/footer_pods.html"], function(templateUrl) {

	return ["$filter", function($filter) {

		return {
			scope: true,

			restrict: "A",

			templateUrl: templateUrl,

			link: function(scope, _element, _attrs) {

				scope.questionId = scope.page.id;
				scope.relatedConcepts = $filter('filter')(scope.page.relatedContent, {type: "isaacConceptPage"});
				scope.relatedQuestions = $filter('filter')(scope.page.relatedContent, {type: "isaacQuestionPage"});	

				scope.relatedEasierQuestions = $filter('filter')(scope.page.relatedContent, function(value){
					return value.type == "isaacFastTrackQuestionPage" && value.level < scope.page.level;
				})

				scope.relatedHarderQuestions = $filter('filter')(scope.page.relatedContent, function(value){
					return value.type == "isaacFastTrackQuestionPage" && value.level >= scope.page.level;
				})
			},
		};
	}];
});