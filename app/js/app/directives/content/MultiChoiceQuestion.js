define([], function() {


	return ["api", function(api) {

		return {
			scope: {
				doc: "=isaacMultiChoiceQuestion"
			},

			restrict: 'EA',

			templateUrl: "/partials/content/MultiChoiceQuestion.html",

			link: function(scope, element, attrs) {

				scope.activeTab = -1;

				scope.activateTab = function(i) {
					scope.activeTab = i;
				}

				scope.selectedAnswer = -1;

				scope.$watch("selectedAnswer", function() {
					console.log("Selected answer changed", scope.selectedAnswer);
				})

			}
		};
	}];
});