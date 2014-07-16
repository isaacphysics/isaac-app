define([],function() {

	return [function() {

		return {

			restrict: "A",

			templateUrl: "/partials/mobile_panel.html",

			transclude: true,
			link: function(scope, element, attrs) {

				if (attrs.arrowBlock != undefined) {
					element.find(".ru-mobile-panel").addClass(" ru-panel-arrow-block");
				}

			}
		};
	}]
})