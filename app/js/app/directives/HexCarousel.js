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
 define(["/partials/hex_carousel.html"], function(templateUrl) {

 	return ["api", "$interval", function(api, $interval) {

 		return {
 			scope: {
 				hexagonItems: "=",
 				hexagonIconClass: "@"
 			},

 			restrict: "A",

 			templateUrl: templateUrl,

 			link: function(scope, element, attrs) {

 				// Owl options - see owl.carousel.js
 				var defaultOptions = {
                    "nav": true, // Comment this to remove arrows
 					"navText": ['', ''],
 					"autoplay": false,
                    //"loop": true, // DO NOT SET THIS - CAUSES EMPTY PODS TO APPEAR ON THE RIGHT!
                    "margin": 15,
 					"rewind": true,
                    "autoPlayTimeout": 1500,
                    "autoplayHoverPause": true,
					"items": 1
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

				// Cleanup
				scope.$on('$destroy', function(){
					$('.owl-carousel').trigger('destroy');
				});

			},
		};
	}];
});