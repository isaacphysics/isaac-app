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
define(["/partials/school_dropdown.html"], function(templateUrl) {

	return ["api", function(api) {

		return {
			scope: {
				selectedSchoolUrn: "=",
			},

			templateUrl: templateUrl,

			restrict: "A",

			link: function(scope, element, attrs) {
			 	scope.searchText = "";
			 	scope.selection = {};

			 	// Load the initially selected school, if there is one.

			 	scope.$watch("selectedSchoolUrn", function(newUrn, oldUrn) {
			 		if (newUrn) {
			 			api.schools.query({urn: newUrn}).$promise.then(function(s) {
				 			if (s.length >= 1) {
				 				scope.selection.school = s[0];
			 				} else {
			 					scope.selectedSchoolUrn = null;
			 				}
				 		});
			 		}
			 	});
				 	
			

				// When the search text changes to something longer than 2 chars, search school.
				scope.$watch("searchText", function(newText) {

					if (newText.length > 2) {
						scope.searchResults = api.schools.query({query: scope.searchText});
					} else {
						// We don't have enough text. Clear search results.
						scope.searchResults = [];
					}
				})

				scope.$watch("selection.school", function(newSchool, oldSchool) {
					if (newSchool === oldSchool)
						return; // Init

					if (newSchool) {
						scope.selectedSchoolUrn = newSchool.urn;
						scope.searchText = '';
					} else {
						scope.selectedSchoolUrn = null;
					}
				})
			},
		};
	}]
});