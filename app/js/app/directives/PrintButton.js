define([], function() {

	return function() {
		return {

			restrict: "A",

            template: '<div class="ru_print" ng-click="printPage()"></div>',

			link: function(scope, element, attrs) {
                scope.printPage = function() {
                    window.print();
                };
			}

		};
	}

});