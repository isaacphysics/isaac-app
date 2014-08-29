define([], function() {


	return ["api", function(api) {

		return {
			scope: true,

			restrict: 'A',

			templateUrl: "/partials/content/QuickQuestion.html",

			link: function(scope, element, attrs) {

				scope.doc = undefined;
				scope.$parent.$watch(attrs.isaacQuickQuestion, function(newDoc) {
					scope.doc = newDoc;
				})

				scope.$watch("isVisible", function(visible) {
					if (visible) {
						api.logger.log({
							type: "QUICK_QUESTION_SHOW_ANSWER",
							questionId: scope.doc.id,
						})
					}
				})
			},
		};
	}];
});