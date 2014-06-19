define([], function() {

	return ["api", "$sce", function(api, $sce) {

		return {

			scope: {
				doc: "=isaacVideo",
			},

			restrict: 'A',

			templateUrl: "/partials/content/Video.html",

			link: function(scope, element, attrs) {
				scope.videoSrc = $sce.trustAsResourceUrl(scope.doc.src);
			}
		};
	}];
});