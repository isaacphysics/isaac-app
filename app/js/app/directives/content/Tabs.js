define([], function() {


	return [function() {

		return {

			scope: true,

			restrict: 'A',

			templateUrl: '/partials/content/Tabs.html',

			link: function(scope, element, attrs) {

				scope.children = undefined;
				scope.$parent.$watch(attrs.children, function(newChildren) {
					scope.children = newChildren;
				});

				scope.activeTab = 0;

				scope.activateTab = function(i) {
					scope.activeTab = i;
				}
			},
		};
	}];
});