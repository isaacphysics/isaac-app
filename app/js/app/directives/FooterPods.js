define([], function() {

	return ["$filter", function($filter) {

		return {
			scope: {
				relatedContent: "="
			},

			restrict: "A",

			templateUrl: "/partials/footer_pods.html",

			link: function(scope, element, attrs) {

				scope.relatedConcepts = $filter('filter')(scope.relatedContent, {type: "isaacConceptPage"});
				scope.relatedQuestions = $filter('filter')(scope.relatedContent, {type: "isaacQuestionPage"});

			},
		};
	}];
});