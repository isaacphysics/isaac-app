define([],function() {

	return [function() {

		return {

			restrict: "A",

			templateUrl: "/partials/desktop_panel.html",

			transclude: true,

			link: function(scope, element, attrs) {

				scope.$watch("globalFlags.siteSearchOpen", function(searchOpen) {

					// Do this the old-fashioned way, because we can't add an ngHide on the template.
					// This is because ngHide will create its own scope, preventing ngTransclude from working. Yuk.

					if(searchOpen) {
						//element.hide();
					} else {
						//element.show();
					}
				})
			}
		};
	}]
})