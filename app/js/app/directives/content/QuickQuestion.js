define([], function() {


	return ["api", function(api) {

		return {
			scope: {
				doc: "=isaacQuickQuestion"
			},

			restrict: 'EA',

			templateUrl: "/partials/content/QuickQuestion.html",

			link: function(scope, element, attrs) {
		       scope.isVisible = false;
		       scope.toggleVisibility = function(){
		       		scope.isVisible = !scope.isVisible;
		       }
			}
		};
	}];
});