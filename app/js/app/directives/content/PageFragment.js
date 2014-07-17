define([], function() {


	return ["api", function(api) {

		return {

			scope: true,

			restrict: 'A',

			template: '<isaac-content doc="content" />',

			link: function(scope, element, attrs) {

				var id = attrs.isaacPageFragment;

				api.pageFragments.get({id: id}).$promise.then(function(c) {
					scope.content = c;
				});
			},
		};
	}];
});