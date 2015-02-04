/**
 * Copyright 2015 Luke McLean
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

    return ["$location", function($location) {
		return {

			scope: true,
			restrict: "A",
            templateUrl: '/partials/navigation.html',

            link: function(scope, element, attrs) {
            	// Global var
            	var $flyin;

            	scope.menuToggle = function(e) {
            		scope.isVisible = ! scope.isVisible;

            		$('.dl-nav').slideToggle(600);
            	}

            	scope.menuForward = function(e) {
            		if($.ru_IsMobile()){
            			var item = e.currentTarget.parentNode,
                    		submenu = $(item).children('.dl-level2');

                    	
                		if(submenu.length) {
                    		$flyin = submenu.clone().addClass('dl-clone').insertAfter('.dl-level1');

                    		$('.dl-level1').animate({marginLeft: '-100%', opacity: 0}, 500, function(){
                        		$(this).stop().hide(300, function(){
                            		$(this).addClass('dl-hide').removeAttr('style');
                        		});
                    		});
                    		$flyin.animate({marginLeft: '0', opacity: 1}, 500);
                		}
            		}
            	}

            	scope.menuBack = function() {
            		$('.dl-level1').show(300, function(){
                		$(this).animate({marginLeft: '0', opacity: 1}, 500);
                		$flyin.animate({marginRight: '-100%', opacity: 0}, 500, function(){
                    		$flyin.hide(300, function(){
                        		$flyin.remove();
                    		});
                		});
            		});
            	}


                element.on("click", ".dl-back", scope.menuBack);
            }

		};
	}]
});