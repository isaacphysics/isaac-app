define([], function() {


	return ["api", function(api) {

		return {

			scope: {
				doc: "=isaacFeaturedProfile",
			},

			restrict: 'EA',

			templateUrl: "/partials/content/FeaturedProfile.html",

			link: function(scope, element, attrs) {
				if(doc.image){
					doc.image = api.getImageUrl(doc.image.src);	
				}
			}
		};
	}];
});