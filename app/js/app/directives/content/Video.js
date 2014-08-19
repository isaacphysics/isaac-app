define([], function() {

	return ["api", "$sce", function(api, $sce) {

		return {

			scope: {
				doc: "=isaacVideo",
			},

			restrict: 'A',

			templateUrl: "/partials/content/Video.html",

			link: function(scope, element, attrs) {

				scope.doc = undefined;
				scope.videoSrc = undefined;

				scope.$parent.$watch(attrs.isaacVideo, function(newDoc) {
					scope.doc = newDoc;
					scope.videoSrc = $sce.trustAsResourceUrl(scope.doc.src.replace('watch?v=','embed/') + "?theme=light&rel=0&fs=1");
				})
			}
		};
	}];
});