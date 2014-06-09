define([], function() {


	return ["api", function(api) {

		return {
			scope: {
				src: "=",
				isaacImage: "=",
			},

			restrict: 'EA',

			templateUrl: "/partials/content/Image.html",

			link: function(scope, element, attrs) {
				var src = scope.isaacImage || scope.src;

				// check if the image source is a fully qualified link (suggesting it is external to the Isaac site)
				if(src.indexOf("http") > -1){
					scope.path = src;
				}
				else{
					scope.path = api.getImageUrl(src);
				}
			}
		};
	}];
});