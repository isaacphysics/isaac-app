define([], function() {


	return ["$state", "api", function($state, api) {

		return {

			scope: {
				selectedConcepts: "=conceptFilter"
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

				scope.concepts = api.getConceptList()

				scope.removeSelected = function(c) {
					return scope.selectedConcepts.indexOf(c) == -1;
				}

				scope.titleMatcher = function(actual, expected) {
					return (expected && expected.length >= 2 && actual.toLowerCase().indexOf(expected.toLowerCase()) > -1);
				}

				scope.selectConcept = function(c) {
					scope.selectedConcepts.push(c);
					scope.conceptInput = "";
				}

				scope.deselectConcept = function(i) {
					scope.selectedConcepts.splice(i,1);
				}

				scope.conceptInput = "";
			}
		};
	}]

});