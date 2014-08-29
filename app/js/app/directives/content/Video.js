define(["iframe_api"], function() {

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

				var onPlayerStateChange = function(e) {
					console.debug("Player state change:", e.data);

					var logData = {
						videoUrl: e.target.getVideoUrl(),
						videoPosition: e.target.getCurrentTime(),
					}

					if (scope.page) {
						logData.pageId = scope.page.id;
					}

					switch(e.data) {
						case YT.PlayerState.PLAYING:
							logData.type = "VIDEO_PLAY"
							break;
						case YT.PlayerState.PAUSED:
							logData.type = "VIDEO_PAUSE"
							break;
						case YT.PlayerState.ENDED:
							logData.type = "VIDEO_ENDED"
							delete logData.videoPosition;
							break;
						default:
							return; // Don't send a log message.
					}

					api.logger.log(logData);
				}

				scope.$parent.$watch(attrs.isaacVideo, function(newDoc) {
					scope.doc = newDoc;
					scope.videoSrc = $sce.trustAsResourceUrl(scope.doc.src.replace('watch?v=','embed/') + "?enablejsapi=1&theme=light&rel=0&fs=1");

					var player = new YT.Player(element.find("iframe")[0], {
						events: {
							'onStateChange': onPlayerStateChange,
						}
					})

				})
			}
		};
	}];
});