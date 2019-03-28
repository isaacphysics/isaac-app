/**
 * Copyright 2015 Ian Davies
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
define([], function() {
    return ['$compile', '$location', '$anchorScroll', '$timeout', function($compile, $location, $anchorScroll, $timeout) {
        return {
            restrict: 'A',
            compile: function(element) {
                // Take a copy of the element before Angular has done any compilation.
                let rawClone = element.clone();

                return function(scope, _element, attrs) {

                    scope.modals = scope.modals || {};

                    scope.$on("$stateChangeStart", function(e, toState, toParams) {
                        if (toParams['#'] != "isaacModal") {
                            $("#isaacModal").foundation("reveal", "close");
                        }
                    });

                    scope.modals[attrs.isaacModal] = {
                        show: function() {

                            let r = $compile(rawClone)(scope);
                            
                            // Safely call $digest, even if we're already in the digest loop. Ew.
                            $timeout(function() {
                                $timeout(function() {
                                    // After outer timeout completes and safely calls digest(), use inner timeout
                                    // to reposition the modal now the height can be correctly measured! "Ew" still applies!
                                    let windowHeight = $(window).height();
                                    let modalHeight = $("#isaacModal").height();
                                    let modalPosition = (windowHeight / 2) - (modalHeight / 2);
                                    let scrollPos = $(window).scrollTop();

                                    $("#isaacModal").css("top", modalPosition > 0 ? (scrollPos + modalPosition)+'px' : (scrollPos + 15)+'px');
                                });
                            });

                            $("#isaacModal").empty().append(r);

                            $("#isaacModal").foundation("reveal", "open");

                            // Initially position the modal at the top of the screen:
                            let scrollPos = $(window).scrollTop();
                            $("#isaacModal").css((scrollPos + 15)+'px');

                            // make sure the top of the modal is in view.
                            if (!('noHash' in attrs)) {
                                $location.hash('isaacModal');
                            }
                        },
                        hide: function() {
                            $("#isaacModal").foundation("reveal", "close");
                        },
                    }
                }
            }
        }
    }];
});