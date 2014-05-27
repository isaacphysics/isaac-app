define([], function() {


	return [function() {

		return {

			scope: {
				doc: "=",
			},

			restrict: 'EA',

			templateUrl: "/partials/content/Accordion.html",

			link: function(scope, element, attrs) {

				scope.activeChild = 0;

				scope.activateChild = function(i) {
					if(scope.activeChild == i)
						scope.activeChild = -1;
					else
						scope.activeChild = i;
				}

			}
		};
	}];
});