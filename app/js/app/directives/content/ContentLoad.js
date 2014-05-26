define([], function() {


	return ["api", function(api) {

		return {

			scope: {
				doc: "=",
			},

			restrict: 'A',

			template: '<isaac-content doc="content" />',

			link: function(scope, element, attrs) {
				var id = attrs.isaacContentLoad;

				api.content.get({id: id}).$promise.then(function(c) {
					scope.content = c.contentObject;
				});
			},
		};
	}];
});