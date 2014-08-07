define([], function() {

	return ["api", function(api) {

		return {
			scope: {
				selectedSchoolUrn: "=",
			},

			templateUrl: "/partials/school_dropdown.html",

			restrict: "A",

			link: function(scope, element, attrs) {
			 	scope.searchText = "";
			 	scope.selection = {};

			 	// Load the initially selected school, if there is one.

			 	if (scope.selectedSchoolUrn) {
				 	api.schools.query({query: scope.selectedSchoolUrn}).$promise.then(function(s) {
				 		if (s.length >= 1)
				 			scope.selectedSchool = s[0];
				 	});
				}

				// When the search text changes to something longer than 2 chars, search school.
				scope.$watch("searchText", function(newText) {

					if (newText.length > 2) {
						scope.searchResults = api.schools.query({query: scope.searchText});
					} else {
						// We don't have enough text. Clear search results.
						scope.searchResults = [];
					}
				})

				scope.$watch("selection.school", function(newSchool) {
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