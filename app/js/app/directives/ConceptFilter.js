define([], function() {


	return ["$state", "api", "tags", function($state, api, tags) {

		return {

			scope: {
				selectedConceptIds: "=conceptFilter"
			},

			restrict: "A",

			templateUrl: "/partials/concept_filter.html",

			link: function(scope, element, attrs) {

				function matchSize() {
					var header = element.find("h3");
					var input = element.find("input");
					element.find("#concept-search-data").width(input.innerWidth());
					element.find("#concept-search-data").css('top', header.outerHeight(true) + input.innerHeight());
				}

				// TODO: Make sure this happens properly on load.
				// At the moment, I think it's being called before the input box has a width.
				
				$(window).on("resize", matchSize);
				matchSize();

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

					// Resize again to try and ensure it's correct
					matchSize();
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