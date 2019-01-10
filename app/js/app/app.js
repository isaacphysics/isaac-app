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
    "./honest/responsive_video",
    "../lib/rsvp",
    "require",
    "./router",
    "angular",
    "angular-resource",
    "angular-cookies",
    "angular-ui-date",
    "./controllers",
    "./directives",
    "./services",
    "./filters",
    "d3",
    "./honest/dropdown",
    "angulartics",
    "angulartics-google-analytics",
    "./MathJaxConfig",
    "angular-simple-logger",
    "angular-google-maps",
    "../lib/opentip-jquery.js",
    "foundation-sites/js/vendor/modernizr",
    ], function(rv, ineq, require) {

    // Require polyfill script to enable packages which are dependent on older versions of jQuery
    require('../script/polyfill.js')

    window.Promise = RSVP.Promise;
    window.Promise.defer = RSVP.defer;

    RSVP.on('error', function(reason) {
        console.assert(false, reason);
    });

    // Load all of foundation
    let req = require.context("foundation-sites/js/foundation", true);
    for(let r of req.keys()) {
        req(r);
    }

    require("owl.carousel/src/js/owl.carousel.js");
    require("owl.carousel/src/js/owl.autorefresh.js");
    require("owl.carousel/src/js/owl.lazyload.js");
    require("owl.carousel/src/js/owl.autoheight.js");
    require("owl.carousel/src/js/owl.video.js");
    require("owl.carousel/src/js/owl.animate.js");
    require("owl.carousel/src/js/owl.autoplay.js");
    require("owl.carousel/src/js/owl.navigation.js");
    require("owl.carousel/src/js/owl.hash.js");
    require("owl.carousel/src/js/owl.support.js");


	//var rv = System.amdRequire("./honest/responsive_video.js");

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
        'ui.date'
	])

	.config(['$locationProvider', 'apiProvider', '$httpProvider', '$rootScopeProvider', 'uiGmapGoogleMapApiProvider', '$analyticsProvider',
        function($locationProvider, apiProvider, $httpProvider, $rootScopeProvider, uiGmapGoogleMapApiProvider, $analyticsProvider) {

        // Support multiple Google Analytics accounts
        // TODO REMOVE ANALYTICS - Remove 'Isaac' once old account is closed
        $analyticsProvider.settings.ga.additionalAccountNames = ['Isaac', 'IsaacAnalytics'];

        $rootScopeProvider.digestTtl(50);
        // Send session cookies with the API requests.
        $httpProvider.defaults.withCredentials = true;
        // Polyfill a console for browsers (IE) that don't support one!
        // https://github.com/h5bp/html5-boilerplate/blob/master/src/js/plugins.js
        (function() {
            var method;
            var noop = function () {};
            var methods = [
                'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
                'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
                'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
                'timeStamp', 'trace', 'warn'
            ];
            var length = methods.length;
            var console = (window.console = window.console || {});

            while (length--) {
                method = methods[length];

                // Only stub undefined methods.
                if (!console[method]) {
                    console[method] = noop;
                }
            }
        }());

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
                    if (response.status >= 500 && (response.data.errorMessage == null || response.data.errorMessage.indexOf("ValidatorUnavailableException") != 0) && !response.data.bypassGenericSiteErrorPage) {
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
            apiProvider.urlPrefix("http://localhost:8080/isaac-api/api");
        } else if (document.location.hostname.indexOf(".eu.ngrok.io") > -1) {
            // Have reserved domians on ngrok.io, hardcode them for ease of use:
            apiProvider.urlPrefix("https://isaacscience.eu.ngrok.io/isaac-api/api");
        } else {
            apiProvider.urlPrefix("/api/v2.7.5/api");
        }

        NProgress.configure({ showSpinner: false });

        uiGmapGoogleMapApiProvider.configure({
                key: 'AIzaSyBcVr1HZ_JUR92xfQZSnODvvlSpNHYbi4Y',
        });

	}])

	.run(['$rootScope', 'api', '$state', 'auth', '$location' , '$timeout', 'persistence', '$compile', 'subject', function($rootScope, api, $state, auth, $location, $timeout, persistence, $compile, subject) {

        $rootScope.$subject = subject;
        /*
            Tooltip settings
        */
        Opentip.lastZIndex = 9999;
        Opentip.styles.globalStyle = {
            escapeContent: true, // Explicitly override with data-ot-escape-content="false" after user input is escaped
            target: true,
            background: '#333333',
            borderColor: '#333333',
            borderRadius: 0,
            removeElementsOnHide: true,
        };
        Opentip.styles.ru_boards = {
            escapeContent: true, // Explicitly override with data-ot-escape-content="false" after user input is escaped
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
            api.verifyEmail.requestEmailVerification({'email': $rootScope.user.email}).$promise.then(function(_response){
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
                    window.console = {
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
                var cookiesUtils = {
                    create: function(name, value, days) {
                        // Only do time calculation if a day has been passed in
                        let expires = "";
                        if (days) {
                            var date = new Date();
                            var maxCookiesExpiry = days*24*60*60*1000;
                            // convert day to a Unix timestamp
                                date.setTime(date.getTime()+maxCookiesExpiry);
                            // formate date ready to be passed to the DOM
                            expires = "; expires="+date.toGMTString();
                        }
                        // Build cookie and send to DOM
                        document.cookie = name+"="+value+expires+"; path=/";
                    },
                    read: function(name) {
                        var nameEQ = name + "=";
                        // Create array containing all cookies
                        var cookieArray = document.cookie.split(';');

                        // Loop through array of cookies checking each one
                        for(var i=0; i < cookieArray.length; i++) {
                            let cookie = cookieArray[i];

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

                var cookiesAccepted = cookiesUtils.read('isaacCookiesAccepted');

                if (!cookiesAccepted) {
                    // If cookies haven't been accepted show cookie message
                    $(".cookies-message").show();
                } else {
                    // If cookies have been accepted remove the cookie message from the DOM
                    $(".cookies-message").remove();
                }

                // delete old cookies
                cookiesUtils.remove("cookiesAccepted");

                // Set cookie on click without overriding Foundation's close function
                $(document).on('close.cookies-accepted.fndtn.alert', function(_event) {
                    if (!cookiesUtils.read('isaacCookiesAccepted'))
                    {
                        api.logger.log({
                            type: "ACCEPT_COOKIES"
                        })
                        cookiesUtils.create('isaacCookiesAccepted',1,720);
                    }
                });

                // Force resize of vidoes on tab change and accordion change
                $(document).foundation(
                {
                    tab: {
                        callback: function(_tab)
                        {
                            rv.forceResize();
                            sliderResize();
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

                // var isOutOfDateBrowser = $('.lt-ie7, .lt-ie8, .lt-ie9, .lt-ie10').size() > 0;


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



        // USER NOTIFICATIONS VIA WEBSOCKETS

        //$rootScope.notificationList = [];
        //$rootScope.notificationPopups = [];
        //$rootScope.notificationListLength = 0;
        //var signOnTime = Number(new Date());
        $rootScope.notificationWebSocket = null;
        $rootScope.webSocketCheckTimeout = null;
        var lastKnownServerTime = null;

        var openNotificationSocket = function() {

            if ($rootScope.notificationWebSocket != null) {
                return;
            }

            $rootScope.user.$promise.then(function() {

                if (!$rootScope.user._id) {
                    // Promise resolved, but no user!
                    return;
                }

                // Set up websocket and connect to notification endpoint:
                $rootScope.notificationWebSocket = api.getWebsocket("user-alerts");


                $rootScope.notificationWebSocket.onopen = function(_event) {
                    $rootScope.webSocketCheckTimeout = $timeout($rootScope.checkForWebSocket, 10000);
                }


                $rootScope.notificationWebSocket.onmessage = function(event) {

                    var websocketMessage = JSON.parse(event.data);

                    if (websocketMessage.heartbeat) {
                        // Update the last known server time from the message heartbeat.
                        var newServerTime = websocketMessage.heartbeat;
                        if (null != lastKnownServerTime && new Date(lastKnownServerTime).getDate() != new Date(newServerTime).getDate()) {
                            // If the server time has passed midnight, streaks reset, so request a snapshot update:
                            $rootScope.notificationWebSocket.send("user-snapshot-nudge");
                        }
                        lastKnownServerTime = newServerTime;
                    }

                    if (websocketMessage.userSnapshot) {
                        $rootScope.user.userSnapshot = websocketMessage.userSnapshot;
                        var currentActivity = websocketMessage.userSnapshot.streakRecord ? websocketMessage.userSnapshot.streakRecord.currentActivity : 0;
                        $rootScope.streakDialToggle(currentActivity);

                    } else if (websocketMessage.notifications) {
                        websocketMessage.notifications.forEach(function(entry) {
                            var notificationMessage = JSON.parse(entry.message);
                            // specific user streak update
                            if (notificationMessage.streakRecord) {
                                $rootScope.user.userSnapshot.streakRecord = notificationMessage.streakRecord;
                                $rootScope.streakDialToggle($rootScope.user.userSnapshot.streakRecord.currentActivity);
                            }
                        });
                    }


                    /*notificationReccord.notifications.forEach(function(entry) {
                        $rootScope.notificationList.unshift(entry);

                        if (entry.seen == null) {
                            $rootScope.notificationListLength++;

                            // only display popup notifications for events that happen after sign on
                            if (entry.created > signOnTime) {

                                var json = {
                                    "id": entry.id,
                                    "entry": entry,
                                    "timeout": setTimeout(function() {
                                        $rootScope.notificationPopups.shift();
                                    },12000)
                                }

                                $rootScope.notificationPopups.push(json);

                                $rootScope.notificationWebSocket.send(JSON.stringify({
                                    "feedbackType" : "SEEN",
                                    "notificationId" : entry.id

                                }));


                            }
                        }
                    });*/

                }


                $rootScope.notificationWebSocket.onerror = function(error) {
                    console.error("WebSocket error:", error);
                }


                $rootScope.notificationWebSocket.onclose = function(event) {
                    // Check if a server error caused the problem, and if so prevent retrying.
                    // The abnormal closure seems to be mainly caused by network interruptions.
                    switch (event.code) {
                        case 1000:  // 'Normal': should try to reopen connection.
                        case 1001:  // 'Going Away': should try to reopen connection.
                        case 1006:  // 'Abnormal Closure': should try to reopen connection.
                        case 1013:  // 'Try Again Later': should attempt to reopen, but in at least a minute!
                            // Cancel any existing WebSocket poll timeout:
                            if ($rootScope.webSocketCheckTimeout != null) {
                                $timeout.cancel($rootScope.webSocketCheckTimeout);
                            }
                            // Attempt to re-open the WebSocket later, with timeout depending on close reason:
                            if (event.reason == 'TRY_AGAIN_LATER') {
                                // The status code 1013 isn't yet supported properly, and IE/Edge don't support custom codes.
                                // So use the event 'reason' to indicate too many connections, try again in 1 min.
                                console.log("WebSocket endpoint overloaded. Trying again later!")
                                $rootScope.webSocketCheckTimeout = $timeout($rootScope.checkForWebSocket, 60000);
                            } else {
                                // This is likely a network interrupt or else a server restart.
                                // For the latter, we really don't want all reconnections at once.
                                // Wait a random time between 10s and 60s, and then attempt reconnection:
                                var randomRetryIntervalSeconds = 10 + Math.floor(Math.random() * 50);
                                console.log("WebSocket connection lost. Reconnect attempt in " + randomRetryIntervalSeconds + "s.");
                                $rootScope.webSocketCheckTimeout = $timeout($rootScope.checkForWebSocket, randomRetryIntervalSeconds * 1000);
                            }
                            break;
                        default: // Unexpected closure code: log and abort retrying!
                            console.error("WebSocket closed by server error (Code " + event.code + "). Aborting retry!");
                            if ($rootScope.webSocketCheckTimeout != null) {
                                $timeout.cancel($rootScope.webSocketCheckTimeout);
                            }
                    }
                    $rootScope.notificationWebSocket = null;
                }

            });
        }

        $rootScope.checkForWebSocket = function() {
            if ($rootScope.notificationWebSocket != null) {
                if (!$rootScope.user.userSnapshot) {
                    // If we don't have a snapshot, request one.
                    $rootScope.notificationWebSocket.send("user-snapshot-nudge");
                } else {
                    // Else just ping to keep connection alive.
                    $rootScope.notificationWebSocket.send("heartbeat");
                }
                $timeout.cancel($rootScope.webSocketCheckTimeout);
                $rootScope.webSocketCheckTimeout = $timeout($rootScope.checkForWebSocket, 60000);
            } else {
                openNotificationSocket();
            }
        }

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

                                // dirty hack for student/teacher questionnaires, but notifications wont be like this for long (05/17)
                                for (var i = 0; i < ns.length; i++) {

                                    if ($rootScope.user.role.toLowerCase() == ns[i].tags[0]) {

                                        $rootScope.notificationDoc = ns[i];
                                        $rootScope.modals.notification.show();
                                        break;
                                    }

                                }

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

            // if they respond with 'acknowledged' then it means we should show them the external link if there is one
            if (response == 'ACKNOWLEDGED' && notification.externalReference.url) {
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

        $(window).on("resize", function(_event) {
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

        // We have to have *some* Easter Eggs for dedicated users. 

        // For now, just a popup message:
        var konamiCodeUsed = false;
        var onKonamiCode = function(cb) {
          var input = '';
          var konamiCode = '38384040373937396665';
          document.addEventListener('keyup', function (e) {
            if (!e.keyCode) return;
            input += ("" + e.keyCode);
            if (input === konamiCode) {
              return cb();
            }
            if (!konamiCode.indexOf(input)) return;
            input = ("" + e.keyCode);
          });
        }
        onKonamiCode(function () {
            $rootScope.showToast($rootScope.toastTypes.Failure, "Cheat Mode Denied", "Sorry, but we don't believe in cheating on your homework! \u{1F607}");
            $rootScope.$apply();
            if (!konamiCodeUsed) {
                api.logger.log({type: "USE_KONAMI_CODE"});
                konamiCodeUsed = true;
            }
        });

        // And a Christmas surprise:
        let now = new Date();
        let isChristmas = (now.getMonth() + 1 == 12 && now.getDate() >= 24 && now.getDate() <= 26);
        if (isChristmas) {
            $timeout(function() {
                $('a > img[data-interchange]').each(function( index ) {
                    let logoElement = $(this);
                    // FIXME: this assumes and requires that the logos exist. They may not, and if they don't: no logo shown!
                    // Replace all logos with the Christmas version!
                    logoElement.attr('data-interchange', logoElement.attr('data-interchange').replace(/isaac-logo/g, 'isaac-logo-christmas'));
                });
            }, 0);
        }

        // End easter egg madness.

	}]);

	/////////////////////////////////////
	// Bootstrap AngularJS
	/////////////////////////////////////


	var root = $("html");
	angular.bootstrap(root, ['isaac']);

});
