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


	return ["$state", "api", "tags", function($state, api, tags) {

		return {

			scope: {
				selectedConceptIds: "=conceptFilter"
			},

			restrict: "A",

			templateUrl: "/partials/concept_filter.html",

			link: function(scope, element, attrs) {
				
				scope.allConcepts = api.getConceptList();

				scope.allConcepts.$promise.then(function(d) {
					scope.conceptMap = {};

					for(var i in d.results) {
						scope.conceptMap[d.results[i].id] = d.results[i];
						var subject = tags.getSubjectTag(d.results[i].tags);
						if (subject != null) {
							scope.conceptMap[d.results[i].id].subject = subject.id;
						}
					}
				});

				scope.removeSelected = function(c) {
					return scope.selectedConceptIds.indexOf(c.id) == -1;
				}

				scope.titleMatcher = function(actual, expected) {
					return (expected && expected.length >= 2 && actual.toLowerCase().indexOf(expected.toLowerCase()) > -1);
				}

				scope.selectConcept = function(c) {
					scope.selectedConceptIds.push(c);
					scope.conceptInput = "";
				}

				scope.deselectConcept = function(i) {
					scope.selectedConceptIds.splice(i,1);
				}

				scope.conceptInput = "";
			}
		};
	}]

});