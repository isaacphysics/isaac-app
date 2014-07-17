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
			},
		};
	}];
});