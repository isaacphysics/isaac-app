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

    return ["$location", "$timeout", "api", function($location, $timeout, api) {
		return {
			scope: true,
			restrict: "A",
            templateUrl: '/partials/global_navigation.html',

            link: function(scope, element, attrs) {
            	// Global var
            	var flyin;
                var loginTooltips = [];
                scope.contentProblems = 0;
                
                scope.myIncompleteAssignments = 0;

                // determine whether we should disable any global nav links
                var applyDisabledToolTips = function() {
                    
                    // as the user logged in?
                    scope.user.$promise.then(function(result){
                        // if we are logged in we can remove the tooltips
                        if (result._id && loginTooltips.length != 0) {
                            angular.forEach(loginTooltips, function(value, key){
                                value.hide();
                                value.deactivate();
                            })
                            loginTooltips = [];                        
                        } 
                    }).catch(function(){
                        // if we are not logged in we need to disable the links
                        element.find('.login-required a').each(function(index, element){
                            var ot = new Opentip(element, "Click to log in and use this feature.");
                            loginTooltips.push(ot);
                        })

                        $timeout(function(){
                            Opentip.findElements();
                        }, 1000)
                    })
                }

            	scope.menuToggle = function(e) {
            		scope.isVisible = !scope.isVisible;

                    if (scope.isVisible) {
                        // NOTE: in reality the api considers IN_PROGRESS as including NOT_STARTED for assignments
                        // The intension here is to get all that haven't been completed.
                        api.assignments.getMyAssignments({assignmentStatus:"IN_PROGRESS"}).$promise.then(function(results) {
                            scope.myIncompleteAssignments = results.length;

                        });                    

                        scope.user.$promise.then(function(user) {
                            if (user.role == 'STAFF' || user.role == 'CONTENT_EDITOR' || user.role == 'ADMIN') {
                                api.contentProblems.get().$promise.then(function(result){
                                    scope.contentProblems = result.totalErrors;
                                })
                            }
                        });
                    }

            		$('.dl-nav').slideToggle(200);
            	}

            	scope.menuForward = function(e) {
            		if($.ru_IsMobile()){
            			var item = e.currentTarget.parentNode,
                    		submenu = $(item).children('.dl-level2');
                    	
                		if(submenu.length) {
                    		flyin = submenu.clone().addClass('dl-clone').insertAfter('.dl-level1');

                    		$('.dl-level1').animate({marginLeft: '-100%', opacity: 0}, 500, function(){
                        		$(this).stop().hide(300, function(){
                            		$(this).addClass('dl-hide').removeAttr('style');
                        		});
                    		});

                    		flyin.animate({marginLeft: '0', opacity: 1}, 500);
                		}

                        applyDisabledToolTips();
            		}
            	}

            	scope.menuBack = function() {
            		$('.dl-level1').show(300, function(){
                		$(this).animate({marginLeft: '0', opacity: 1}, 500);
                		flyin.animate({marginRight: '-100%', opacity: 0}, 500, function(){
                    		flyin.hide(300, function(){
                        		flyin.remove();
                    		});
                		});
            		});
            	}

                element.on("click", ".dl-back", scope.menuBack);

                scope.menuClose = function() {
                    scope.isVisible = false;

                    $('.dl-nav').hide();
                }
                scope.$on("$stateChangeStart", scope.menuClose);

                scope.$watch('isVisible', function(){
                    applyDisabledToolTips();                    
                })
            }
		};
	}]
});