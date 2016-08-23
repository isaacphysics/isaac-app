/**
 * Copyright 2014 Ian Davies
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
'use strict';

define([
    "app/honest/responsive_video",
    "lib/rsvp",
    "foundation",
    "app/router",
    "angular",
    "angular-resource",
    "angular-cookies",
    "angular-ui-date",
    "app/controllers",
    "app/directives",
    "app/services",
    "app/filters",
    "d3",
    "owl-carousel2",
    "app/honest/dropdown",
    "angulartics",
    "angulartics-google-analytics",
    "app/MathJaxConfig",
    "lib/opentip-jquery.js",
    "js/templates.js",
    "angular-google-maps",
    ], function(rv, ineq) {

    window.Promise = RSVP.Promise;
    window.Promise.defer = RSVP.defer;

	//var rv = System.amdRequire("app/honest/responsive_video.js");

	// Declare app level module which depends on filters, and services
	angular.module('isaac', [
        'isaac.router',
		'isaac.filters',
		'isaac.services',
		'isaac.directives',
		'isaac.controllers',
        'isaac.templates',
        'angulartics',
        'angulartics.google.analytics',
        'uiGmapgoogle-maps',
        'ngCookies',
        'ui.date',
	])

	.config(['$locationProvider', 'apiProvider', '$httpProvider', '$rootScopeProvider', function($locationProvider, apiProvider, $httpProvider, $rootScopeProvider) {

        $rootScopeProvider.digestTtl(50);
        // Send session cookies with the API requests.
        $httpProvider.defaults.withCredentials = true;

        $httpProvider.interceptors.push(["$q", "$injector", function($q, $injector) {
            return {
                response: function(response) {
                    // same as above
                    if (response.status >= 500) {
                        console.warn("Uncaught error from API:", response);
                    }
                    return response;
                },
                responseError: function(response) {
                    if (response.status >= 500 && (response.data.errorMessage == null || response.data.errorMessage.indexOf("ValidatorUnavailableException") != 0)) {
                        var $state = $injector.get("$state");
                        $injector.get("$rootScope").setLoading(false);
                        $state.go('error');
                        console.warn("Error from API:", response);
                    }
                    return $q.reject(response);
                }
            };
        }]);

		$locationProvider.html5Mode(true).hashPrefix("!");

        // Here we configure the api provider with the server running the API. Don't need to do this if we want to use the same server as the static content.
        if (document.location.hostname == "localhost") {
            apiProvider.urlPrefix("https://isaacphysics-api.eu.ngrok.io/isaac-api/api");
        } else {
            apiProvider.urlPrefix("https://isaacphysics-api.eu.ngrok.io/isaac-api/api");
        }

        NProgress.configure({ showSpinner: false });
	}])

	.run(['$rootScope', 'api', '$state', 'auth', '$location' , '$timeout', 'persistence', '$compile', function($rootScope, api, $state, auth, $location, $timeout, persistence, $compile) {

        /*
            Tooltip settings
        */
        Opentip.lastZIndex = 9999;
        Opentip.styles.globalStyle = {
            target: true,
            background: '#333333',
            borderColor: '#333333',
            borderRadius: 0,
            removeElementsOnHide: true,
        };
        Opentip.styles.ru_boards = {
            className: 'boards',
            fixed: true,
            stem: false,
            background: 'rgba(255, 255, 255, 0.95)',
            borderColor: '#814ba0',
            borderRadius: 0,
            removeElementsOnHide: true,
        };
        Opentip.defaultStyle = "globalStyle";

        auth.updateUser();

        var mathjaxRenderTimeout = null;

        $rootScope.requestMathjaxRender = function() {
            if (mathjaxRenderTimeout)
                clearTimeout(mathjaxRenderTimeout);

            setTimeout(function() {
                MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
            }, 50);
        }

        $rootScope.figures = {};

        var loadingRefCount = 0;
        $rootScope.setLoading = function(isLoadingOrIncrement) {

            if (typeof(isLoadingOrIncrement) == "number") {
                loadingRefCount += isLoadingOrIncrement;
            } else {
                loadingRefCount += isLoadingOrIncrement ? 1 : -1;
            }

            if (loadingRefCount < 0)
                loadingRefCount = 0;

            $rootScope.globalFlags.loading = loadingRefCount > 0;

            if ($rootScope.globalFlags.loading) {
                NProgress.start();
            } else {
                NProgress.done();
            }
        }

        $rootScope.globalFlags = {
            siteSearchOpen: false,
            loading: false,
            noSearch: false
        };

        $rootScope.$state = $state;

        $rootScope.$on("$stateChangeStart", function() {
            $rootScope.setLoading(true);
            $rootScope.pageTitle = "";
            $rootScope.isHomePage = false;
        });

        $rootScope.$on("$stateChangeSuccess", function() {
            $timeout(function() {
                // Run this in a $timeout to make sure that $apply is called.
                $rootScope.setLoading(false);

                // TODO: find a better way to hide the search
                $rootScope.globalFlags.noSearch = false;
            });

            $(document).scrollTop(0);
            $rootScope.figurePaths = {};
            $rootScope.figureNumbers = {};
            $rootScope.relativeCanonicalUrl = $location.path();

            // we need to tell opentip to reapply everytime we change state
            setTimeout(function(){
                Opentip.findElements();
            }, 0);
        })

        $rootScope.snoozeEmailVerification = function(){
            $(".verification-message").remove();
        }

        $rootScope.requestEmailVerification = function(){
            api.verifyEmail.requestEmailVerification({'email': $rootScope.user.email}).$promise.then(function(response){
                $rootScope.showToast($rootScope.toastTypes.Success, "Email verification request succeeded.", "Please follow the verification link given in the email sent to your address. ");
            }, function(e){
                $rootScope.showToast($rootScope.toastTypes.Failure, "Email verification request failed.", "Sending an email to your address failed with error message: " + e.data.errorMessage != undefined ? e.data.errorMessage : "");
            });
        }

        $rootScope.$on("$stateChangeError", function() {
            $rootScope.setLoading(false);
        })

        $rootScope.$on("$includeContentLoaded", function() {

            // Make all videos responsive
            rv.updateAll();

            $(document).foundation({
                // Queries for retina images for data interchange
                interchange:
                {
                    named_queries :
                    {
                        small_retina :  'only screen and (min-width: 1px) and (-webkit-min-device-pixel-ratio: 2),'+
                                        'only screen and (min-width: 1px) and (min--moz-device-pixel-ratio: 2),'+
                                        'only screen and (min-width: 1px) and (-o-min-device-pixel-ratio: 2/1),'+
                                        'only screen and (min-width: 1px) and (min-device-pixel-ratio: 2),'+
                                        'only screen and (min-width: 1px) and (min-resolution: 192dpi),'+
                                        'only screen and (min-width: 1px) and (min-resolution: 2dppx)',
                        medium_retina : 'only screen and (min-width: 641px) and (-webkit-min-device-pixel-ratio: 2),'+
                                        'only screen and (min-width: 641px) and (min--moz-device-pixel-ratio: 2),'+
                                        'only screen and (min-width: 641px) and (-o-min-device-pixel-ratio: 2/1),'+
                                        'only screen and (min-width: 641px) and (min-device-pixel-ratio: 2),'+
                                        'only screen and (min-width: 641px) and (min-resolution: 192dpi),'+
                                        'only screen and (min-width: 641px) and (min-resolution: 2dppx)',
                        large_retina :  'only screen and (min-width: 1024px) and (-webkit-min-device-pixel-ratio: 2),'+
                                        'only screen and (min-width: 1024px) and (min--moz-device-pixel-ratio: 2),'+
                                        'only screen and (min-width: 1024px) and (-o-min-device-pixel-ratio: 2/1),'+
                                        'only screen and (min-width: 1024px) and (min-device-pixel-ratio: 2),'+
                                        'only screen and (min-width: 1024px) and (min-resolution: 192dpi),'+
                                        'only screen and (min-width: 1024px) and (min-resolution: 2dppx)',
                        medium_large :  'only screen and (min-width: 54.115em)'
                    }
                }
            });

            // we need to tell foundation to reapply everytime new content may have been added
            $(document).foundation('interchange', 'reflow');
            // we also need to tell open tip to reinitialise when new content is added.
            Opentip.findElements();

            // Global jQuery
            $(function()
            {


                // IE console debug - bug fix
                if(!(window.console)) {
                    var noop = function(){};
                    console = {
                        log: noop,
                        debug: noop,
                        info: noop,
                        warn: noop,
                        error: noop
                    };
                }

                // Mobile detection based on presence of mobile header
                /**
                 * Are we on a mobile? (Safe on any browser without needing media queries via JS)
                 * @returns {Boolean}
                 */
                $.ru_IsMobile = function()
                {
                    return ($(".ru-mobile-header").css('display') !== 'none');
                };
                // Fix ups for iOS
                if((navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i)))
                {
                    $('.accordion.ru_accordion dd a.ru_accordion_titlebar .ru_accordion_title').addClass('iphone');
                    $('.ru-answer-orbit .ru-answer-orbit-content p').addClass('iphone');
                }

                // Safari - accordion titles
                if (navigator.userAgent.search("Safari") >= 0 && navigator.userAgent.search("Chrome") < 0)
                {
                    $('.accordion.ru_accordion dd a.ru_accordion_titlebar .ru_accordion_title').addClass('safari');
                }

                // Fix up for custom check box 2nd label
                $('.ru-drop-big-label,.ru-drop-mid-label,span.ru-drop-check~label').each(function()
                {
                    var $drop = $(this).prev('.ru-drop-check');
                    var id = $('input', $drop).attr('id');
                    $(this).attr('for', id);
                }).css('user-select','none');

                // Set tab indexes for some things
                // Header nav
                $('.ru-desktop-nav-item').attr('tabindex', 0).bind('keydown', function(e)
                {
                    // Follow link for tab on top level nav
                    if(e.which === 13)
                    {
                        var $link = $('a', $(this));
                        if(!$link.hasClass('active'))
                        {
                            window.location.href = $link.attr('href');
                        }
                    }
                });
                $('.ru-desktop-nav-item .active').parent().attr('tabindex', null);
                // Footer social icons
                $("[class*='ru-social-icon-']").attr('tabindex',0).bind('keydown', function(e)
                {
                    // Follow link for tab on top level nav
                    if(e.which === 13)
                    {
                        window.location.href = $(this).attr('href');
                    }
                });
                // Custom tick boxes
                $('span.ru-drop-check').each(function()
                {
                    // Add tab index
                    var span = $(this);
                    span.attr('tabindex', 0);
                    // Blur span on click
                    $('input', span).click(function()
                    {
                        $(this).parent().blur();
                    });
                    // Enter on checkbox
                    span.bind('keyup', function(e)
                    {
                        if(e.which === 13)
                        {
                            $('input', span).click();
                        }
                    });
                });

                // Mobile login drop down
	            $("#mobile-login").off("click");
                $("#mobile-login").click(function(e)
                {
                    e.preventDefault();
                    $("#mobile-login-form").ruDropDownToggle(this);
                });

                // Mobile search drop down
	            $("#mobile-search").off("click");
                $("#mobile-search").click(function(e)
                {
                    e.preventDefault();
                    $("#mobile-search-form").ruDropDownToggle(this);
                });

                // Resize slider on tab change (copes with resize when slider tab not visible)
                var sliderResize = function()
                {
                    $(".bxslider").each(function()
                    {
                        var slider = $(this).data('slider');
                        slider.reloadSlider();
                        var orbit = $(this).closest('.ru-answer-orbit');
                        var item = parseInt($('.ru-answer-orbit-bullets>.active', orbit).attr('data-target'));
                        slider.goToSlide(item);
                    });
                    // Also - remove iphone override on p carousel text as it is not needed after a change of tab
    //                if((navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i)))
    //                {
    //                    $('.ru-answer-orbit .ru-answer-orbit-content p').removeClass('iphone');
    //                }
                };
                var cookie = {
                    create: function(name, value, days) {
                        // Only do time calculation if a day has been passed in
                        if (days) {
                            var date = new Date();
                            var maxCookiesExpiry = days*24*60*60*1000;
                            // convert day to a Unix timestamp
                                date.setTime(date.getTime()+maxCookiesExpiry);
                            // formate date ready to be passed to the DOM
                            var expires = "; expires="+date.toGMTString();
                        }
                        else var expires = "";
                        // Build cookie and send to DOM
                        document.cookie = name+"="+value+expires+"; path=/";
                    },
                    read: function(name) {
                        var nameEQ = name + "=";
                        // Create array containing all cookies
                        var cookieArray = document.cookie.split(';');

                        // Loop through array of cookies checking each one
                        for(var i=0; i < cookieArray.length; i++) {
                            var cookie = cookieArray[i];

                            // Check to see first character is a space
                            while (cookie.charAt(0) == ' ') {
                                // Strip any subsequent spaces until the first character is not a space
                                cookie = cookie.substring(1, cookie.length);
                            }

                            if (cookie.indexOf(nameEQ) == 0) {
                                // Hurrah this is the cookie we wanted, now to return just the name
                                return cookie.substring(nameEQ.length,cookie.length);
                            }
                        }
                        return null;
                    },
                    remove: function(name) {
                        // make it expire
                        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/';
                    }
                }

                var cookiesAccepted = cookie.read('isaacCookiesAccepted');

                if (!cookiesAccepted) {
                    // If cookies haven't been accepted show cookie message
                    $(".cookies-message").show();
                } else {
                    // If cookies have been accepted remove the cookie message from the DOM
                    $(".cookies-message").remove();
                }

                // delete old cookies
                cookie.remove("cookiesAccepted");

                // Set cookie on click without overriding Foundations close function
                $(document).on('close.cookies-accepted.fndtn.alert-box', function(event) {
                    if (!cookie.read('isaacCookiesAccepted'))
                    {
                        api.logger.log({
                            type: "ACCEPT_COOKIES"
                        })
                        cookie.create('isaacCookiesAccepted',1,720);
                    }
                });

                var totalJoyridePageCount = 0;
                // Force resize of vidoes on tab change and accordion change
                $(document).foundation(
                {
                    tab:{
                        callback : function (tab)
                        {
                            rv.forceResize();
                            sliderResize();
                        }
                    },
                    joyride: {
                        expose: true,
                        next_button: false,
                        prev_button: false,
                        template : {
                            link: ''
                        },
                        abort_on_close: false,
                        pre_ride_callback: function() {
                            // add custom controls
                            $('body').append('<div class="joyride-custom-controls"><div class="row"><div class="custom-controls-wrap"><a class="joyride-prev-tip"></a><a class="joyride-next-tip"></a></div><a class="closeJoyride joyride-close-tip"></a><div class="joyride-page-indicator"></div></div></div>')
                            totalJoyridePageCount = $("#" + $rootScope.joyrideTutorial + " .joyride-list").children().length;
                        },
                        pre_step_callback: function(index) {
                            $(".joyride-page-indicator").empty();

                            for (var i = 0; i < totalJoyridePageCount; i++) {
                                if (i <= index) {
                                    $(".joyride-page-indicator").append('<img src="/assets/tutorial-page-viewed.png">');
                                } else {
                                    $(".joyride-page-indicator").append('<img src="/assets/tutorial-page-future.png">');
                                }
                            }

                            if (index == 0) {
                                $(".joyride-prev-tip").css("visibility","hidden");
                            } else {
                                $(".joyride-prev-tip").css("visibility","visible");
                            }

                            if (index == totalJoyridePageCount-1) {
                                $(".joyride-next-tip").css("visibility","hidden");
                            } else {
                                $(".joyride-next-tip").css("visibility","visible");
                            }
                        },
                        post_expose_callback: function (index){
                            // Work out what to wrap the exposed element with e.g. square, circle or rectangle
                            	var tutorial = document.getElementById($rootScope.joyrideTutorial)
                                                   .getElementsByClassName("joyrideTutorialItem")[index]
                                                   .getAttribute('data-shape');
                            if(tutorial != null) {
                                $('.joyride-expose-wrapper').addClass(tutorial);
                            }

                            // Triggering a resize fixes inital positioning issue on chrome
                            $(window).resize();
                        },
                        post_ride_callback: function() {
                            // remove controls when tutorial has finished
                            $('.joyride-custom-controls').detach();
                        }
                    },
                    reveal: {
                        animation: 'none', // Can change back to 'fadeAndPop', but it's horribly jumpy.
                          animation_speed: 500,
                          close_on_background_click: true,
                          dismiss_modal_class: 'close-reveal-modal',
                          multiple_opened: false,
                          bg_class: 'reveal-modal-bg',
                          root_element: 'body',
                          on_ajax_error: $.noop,
                          bg : $('.reveal-modal-bg'),
                          css : {
                            open : {
                              'opacity': 0,
                              'visibility': 'visible',
                              'display' : 'block'
                            },
                            close : {
                              'opacity': 1,
                              'visibility': 'hidden',
                              'display': 'none'
                            }
                          }
                    }
                });
                // var tutorialShown = cookie.read('tutorialShown');

                var isOutOfDateBrowser = $('.lt-ie7, .lt-ie8, .lt-ie9, .lt-ie10').size() > 0;

                // we don't want the google bot or out of date browsers to see the tutorial.
                // stop tutorial from loading for new users as no one reads it anyway.
                // if (!tutorialShown && navigator.userAgent.search("Googlebot") < 0 && !isOutOfDateBrowser) {
                //     if ($.ru_IsMobile()) {
                //         if ($('#mobile-tutorial').length > 0) {
                //             setTimeout(function() {
                //                 // Launch the tutorial asynchronously. No idea why this is required.
                //                 $('#mobile-tutorial').foundation('joyride', 'start');
                //                 cookie.create('tutorialShown',1,720);
                //             }, 1000)
                //         }
                //     } else {
                //         if ($('#desktop-tutorial').length > 0) {
                //             $('#desktop-tutorial').foundation('joyride', 'start');
                //             cookie.create('tutorialShown',1,720);
                //         }
                //     }
                // }

                // Toggle hide / show of share links
                $(".ru_share").click(function()
                {
                    if($(".ru_share_link").width() === 258)
                    {
                        $(".ru_share_link").animate({width:0}, {duration:400});
                    }
                    else
                    {
                        $(".ru_share_link").animate({width:260}, {duration:400});
                    }
                });

                // Image zoom
                $('.ru-expand div').click(function(e)
                {
                    e.preventDefault();

                    // Invoke browser full screen
                    function requestFullScreen(element)
                    {
                        // Supports most browsers and their versions.
                        var requested = false;
                        var requestMethod = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullScreen;

                        if (requestMethod)
                        {
                            // Native full screen.
                            requestMethod.call(element);
                            requested = true;
                        }
                        else if (typeof window.ActiveXObject !== "undefined")
                        {
                            // Older IE.
                            var wscript = new ActiveXObject("WScript.Shell");
                            if (wscript !== null)
                            {
                                wscript.SendKeys("{F11}");
                                requested = true;
                            }
                        }
                        return requested;
                    }

                    // Get target img element
                    var elem = $(this).parent().find('img');
                    var url = elem.attr('src');
                    // Mobile - follow link
                    if($.ru_IsMobile())
                    {
                        window.location.href = url;
                    }
                    // Desktop - full screen mode, else revert to opening link
                    else
                    {
                        if(!requestFullScreen(elem.get(0)))
                        {
                            window.location.href = url;
                        }
                    }
                });
            });

        });
		$('body').on('click', '.joyride-close-tip', function() {
            // remove controls if tutorial is closed part way through
            $('.joyride-custom-controls').detach();
            api.logger.log({
                type: "CLOSE_TUTORIAL",
                tutorialId: $rootScope.joyrideTutorial,
            });
        });
        $('body').on('click', '.desktop-tutorial-trigger', function() {
            if ($rootScope.relativeCanonicalUrl == "/") {
                $rootScope.joyrideTutorial = "home-page-tutorial";
                $('#home-page-tutorial').foundation('joyride', 'start');
            } else if ($rootScope.relativeCanonicalUrl == "/gameboards") {
                $rootScope.joyrideTutorial = "filter-tutorial";
                $('#filter-tutorial').foundation('joyride', 'start');
            } else {
                $rootScope.joyrideTutorial = "desktop-tutorial";
                $('#desktop-tutorial').foundation('joyride', 'start');
            }
            api.logger.log({
                type: "VIEW_TUTORIAL",
                tutorialId: $rootScope.joyrideTutorial,
            });
        });
        $('body').on('click', '.mobile-tutorial-trigger', function() {
            $rootScope.joyrideTutorial = "mobile-tutorial";
            $('#mobile-tutorial').foundation('joyride', 'start');
            api.logger.log({
                type: "VIEW_TUTORIAL",
                tutorialId: $rootScope.joyrideTutorial,
            });
        });
        $('body').on('click', '.joyride-expose-cover', function(){
            $('.joyride-modal-bg').trigger('click');
        });

        var checkForNotifications = function() {

            $rootScope.user.$promise.then(function() {
                // We are logged in

                var lastNotificationTime = persistence.load("lastNotificationTime") || 0;

                if (Date.now() - $rootScope.user.registrationDate > 2*24*60*60*1000) {
                    // User registration was at least two days ago

                    if (Date.now() - lastNotificationTime > 24*60*60*1000) {
                        // Last notification was at least one day ago

                        api.notifications.query().$promise.then(function(ns) {

                            if (ns.length > 0) {

                                $rootScope.notificationDoc = ns[0];

                                $rootScope.modals.notification.show();

                                persistence.save("lastNotificationTime", Date.now());
                            }
                        })
                    }
                }
            })

            // Check again in five minutes
            $timeout(checkForNotifications, 300000);
        }

        $timeout(checkForNotifications, 5000);

        $rootScope.notificationResponse = function(notification, response) {
            api.notifications.respond({id: notification.id, response: response}, {});

            // if they respond with dismissed then it means we should show them the external link if there is one
            if (response == 'DISMISSED' && notification.externalReference.url) {
                var userIdToken = "{{currentUserId}}";

                // if they have a token representing the user id then replace it.
                if (notification.externalReference.url.indexOf(userIdToken) != -1) {
                    $rootScope.user.$promise.then(function(user){
                        var newUrl = notification.externalReference.url.replace(userIdToken, user._id);

                        window.open(newUrl, "_blank");
                    });
                } else {
                    window.open(notification.externalReference.url, "_blank");
                }
            }

            $rootScope.modals.notification.hide();
        }


        // Used in equation editor in ng-show or ng-hide. Both flags act as toggles for each mode.
        var isLandscape = function() {
            return window.innerWidth > window.innerHeight || window.innerWidth > 640;
        };

        $(window).on("resize", function(e) {
            var newLandscape = isLandscape();
            if (newLandscape != $rootScope.isLandscape) {
                $rootScope.isLandscape = newLandscape
                $rootScope.$apply();
            }
        });

        $rootScope.isLandscape = isLandscape();


        $rootScope.mathMode = true;

        $rootScope.padIndex = function(index) {
            return ("0000"+index).slice(-4);
        }

        $rootScope.updateFigureNumbers = function() {

            var figures = [];
            for (var id in $rootScope.figurePaths)
                figures.push({id: id, path: $rootScope.figurePaths[id]});

            figures.sort(function(a,b) {
                if (a.path < b.path)
                    return -1;
                else if (a.path > b.path)
                    return 1;
                else
                    return 0;
            });

            $rootScope.figureNumbers = {};
            for (var i in figures) {
                $rootScope.figureNumbers[figures[i].id] = parseInt(i)+1;
            }
        }

	}]);

	/////////////////////////////////////
	// Bootstrap AngularJS
	/////////////////////////////////////

	var root = $("html");
	angular.bootstrap(root, ['isaac']);

});
