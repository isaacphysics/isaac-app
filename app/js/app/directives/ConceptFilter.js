define([], function() {


	return ["$state", "api", function($state, api) {

		return {

			scope: {
				selectedConceptIds: "=conceptFilter"
			},

			restrict: "A",

			templateUrl: "/partials/concept_filter.html",

			link: function(scope, element, attrs) {

				function matchSize() {
					element.find("#concept-search-data").width(element.find('input').width());
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