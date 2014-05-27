define([], function() {


	return [function() {

		return {

			scope: {
				doc: "=",
			},

			restrict: 'EA',

			templateUrl: "/partials/content/Accordion.html",

			link: function(scope, element, attrs) {

				scope.openChildren = {
					0: true
				};

				scope.toggleChild = function(i) {
					scope.openChildren[i] = !scope.openChildren[i];
				}

			}
		};
	}];
});