/**
 * Copyright 2014 Ian Davies
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at
 * 		http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
define(["../../../lib/iframe_api", "/partials/content/Video.html"], function(iframe_api, templateUrl) {

	return ["api", "$sce", function(api, $sce) {

		return {

			scope: true,

			restrict: 'A',

			templateUrl: templateUrl,

			link: function(scope, element, attrs) {

				scope.videoSrc = undefined;

				let onPlayerStateChange = function(e) {

					let logData = {
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

				scope.videoSrc = $sce.trustAsResourceUrl(scope.doc.src.replace('watch?v=','embed/').replace("youtube.com", "youtube-nocookie.com") + "?enablejsapi=1&theme=light&rel=0&fs=1&modestbranding=1");

				YT.ready(function() {
					new YT.Player(element.find("iframe")[0], {
						events: {
							'onStateChange': onPlayerStateChange,
						}
					});				
				});

			}
		};
	}];
});