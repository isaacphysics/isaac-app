define([], function() {


	return [function() {

		return {

			scope: { 
				doc: "="
			},

			restrict: 'EA',

			templateUrl: '/partials/content/Tabs.html',

			link: function(scope, element, attrs) {

				scope.activeTab = 0;

				scope.activateTab = function(i) {
					scope.activeTab = i;
				}
			},
		};
	}];
});