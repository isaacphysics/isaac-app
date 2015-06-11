/**
 * Copyright 2015 Ian Davies, Alistair Stead
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
 define([], function() {

 	return ["api", "$interval", function(api, $interval) {

 		return {
 			scope: true,

 			restrict: "A",

 			templateUrl: "/partials/pod_carousel.html",

 			link: function(scope, element, attrs) {

 				scope.intervalValue = 10000; //ms

 				// Owl options - see owl.carousel.js
 				var defaultOptions = {
					"nav" : true,
					"loop": false,
 					"lazyLoad": true,
 					"navText": ['<', '>'],
 					"autoplay": true,
 					"autoplayTimeout": scope.intervalValue,
 					"autoplayHoverPause":true,
 					"margin":10,
 					"dots":true,
 					"smartSpeed": 0,
 					"navRewind": true,
 					"responsive":{
 						0:{
 							"items":1,
 						},
 						600:{
 							"items":2,
 						},
 						900:{
 							"items":3,
 						}
 					}
                };

                var customOptions = scope.$eval($(element).attr('data-options'));

                // Combine the two options objects
                for(var key in customOptions) {
                    defaultOptions[key] = customOptions[key];
                }

 				// Function to initialise the Carousel
				scope.initCarousel = function() {
					$(element).owlCarousel(defaultOptions);
				};

				// Function to determine the order of pods to be displayed.
				scope.comparitor = function(pod) {
					var pos = scope.visiblePods.indexOf(pod);
					if(pos != -1) {
						return pos;
					} 

					return scope.pods.results.length;
				}

 				scope.pods = api.pods.get();

				scope.pods.$promise.then(function(){
					Array.prototype.sort.call(scope.pods.results,function(a,b) { return a.id > b.id; });
				});

				// Cleanup
				scope.$on('$destroy', function(){
					$('.owl-carousel').trigger('destroy');
				});
			},
		};
	}];
});