define([], function() {


	return ["api", function(api) {

		return {

			scope: true,

			restrict: 'A',

			templateUrl: "/partials/content/FeaturedProfile.html",

			link: function(scope, element, attrs) {

				scope.doc = undefined;
				scope.$parent.$watch(attrs.isaacFeaturedProfile, function(newDoc) {
					scope.doc = newDoc;

					if(scope.doc.image){
						scope.doc.image.src = api.getImageUrl(scope.doc.image.src);	
					}
				});
			}
		};
	}];
});