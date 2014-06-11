define([], function() {


	return ["api", function(api) {

		return {
			scope: {
				doc: "=isaacMultiChoiceQuestion"
			},

			restrict: 'EA',

			templateUrl: "/partials/content/MultiChoiceQuestion.html",

			link: function(scope, element, attrs) {

			}
		};
	}];
});