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
    "lib/rsvp",
    "foundation", 
    "app/router", 
    "app/honest/responsive_video", 
    "angular", 
    "angular-resource", 
//    "angular-animate",
    "angular-cookies",
    "angular-ui-date",
    "app/controllers", 
    "app/directives", 
    "app/services", 
    "app/filters",
    "fastclick",
    "app/honest/dropdown",
    "app/honest/answer_reveal",
    "angulartics", 
    "angulartics-ga",
    "app/MathJaxConfig",
    "lib/opentip-jquery",
    "templates",

    ], function() {

    window.Promise = RSVP.Promise;
    window.Promise.defer = RSVP.defer;

	var rv = require("app/honest/responsive_video");


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
//        'ngAnimate',
        'ngCookies',
        'ui.date',
	])

	.config(['$locationProvider', 'apiProvider', '$httpProvider', function($locationProvider, apiProvider, $httpProvider) {

        // Send session cookies with the API requests.
        $httpProvider.defaults.withCredentials = true;

        // Only use html5 mode if we are on a real server, which should respect .htaccess
		$locationProvider.html5Mode(document.location.hostname != "localhost").hashPrefix("!");

        // Here we configure the api provider with the server running the API. Don't need to do this if we want to use the same server as the static content.
        if (document.location.hostname == "localhost")
            apiProvider.server("http://localhost:8080/isaac-api");
	}])

	.run(['$rootScope', 'api', '$state', 'auth', '$location' , function($rootScope, api, $state, auth, $location) {

        /* 
            Tooltip settings
        */
        Opentip.lastZIndex = 9999; 
        Opentip.styles.globalStyle = {
            target: true,
            background: '#333333',
            borderColor: '#333333',
            borderRadius: 0
        };
        Opentip.styles.ru_boards = {
            className: 'boards',
            fixed: true,
            stem: false,
            background: 'rgba(255, 255, 255, 0.95)',
            borderColor: '#814ba0',
            borderRadius: 0
        };
        Opentip.defaultStyle = "globalStyle";

        auth.updateUser();

        $rootScope.figures = {};

        $rootScope.globalFlags = {
            siteSearchOpen: false,
            isLoading: false,
            noSearch: false
        };

        $rootScope.$state = $state;

        $rootScope.$on("$stateChangeStart", function() {
            $rootScope.globalFlags.isLoading = true;
            $rootScope.pageTitle = "";
        });

        $rootScope.$on("$stateChangeSuccess", function() {
            $rootScope.globalFlags.isLoading = false;
            $rootScope.globalFlags.displayLoadingMessage = false;
            // TODO: find a better way to hide the search
            $rootScope.globalFlags.noSearch = false;

            $(document).scrollTop(0);
            $rootScope.figures = {};
            $rootScope.relativeCanonicalUrl = $location.path();
        })

        $rootScope.$on("$stateChangeError", function() {
            $rootScope.globalFlags.isLoading = false;
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

            // we need to tell foundation and opentip to reapply everytime new content may have been added
            $(document).foundation('interchange', 'reflow');
            Opentip.findElements()

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
            
                 // Fast click
                FastClick.attach(document.body);
                
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
                    }
                }

                var cookiesAccepted = cookie.read('cookiesAccepted');
            
                if (!cookiesAccepted) {
                    // If cookies haven't been accepted show cookie message
                    $(".cookies-message").show();
                } else {
                    // If cookies have been accepted remove the cookie message from the DOM
                    $(".cookies-message").remove();
                }

                // Set cookie on click without overriding Foundations close function
                $(document).on('close.cookies-accepted.fndtn.alert-box', function(event) {
                    cookie.create('cookiesAccepted',1,720);
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
                            pre_ride_callback: function() {
                                // add custom controls
                                $('body').append('<div class="joyride-custom-controls"><div class="row"><div class="custom-controls-wrap"><a class="joyride-prev-tip"></a><a class="joyride-next-tip"></a></div><a class="closeJoyride joyride-close-tip"></a><div class="joyride-page-indicator"></div></div></div>')
                                if ($.ru_IsMobile()) {
                                    totalJoyridePageCount = $("#mobile-tutorial .joyride-list").children().length;
                                } else {
                                    totalJoyridePageCount = $("#desktop-tutorial .joyride-list").children().length;
                                }
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
                                	var tutorial = document.getElementById(($(window).width() < 640) ? 'mobile-tutorial' : 'desktop-tutorial')
                                                       .getElementsByTagName("li")[index]
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
                        }
                }); 
                var tutorialShown = cookie.read('tutorialShown');

                if (!tutorialShown && navigator.userAgent.search("Googlebot") < 0) { // we don't want the google bot to see the tutorial.
                    if ($.ru_IsMobile()) {
                        if ($('#mobile-tutorial').length > 0) {
                            setTimeout(function() {
                                // Launch the tutorial asynchronously. No idea why this is required.
                                $('#mobile-tutorial').foundation('joyride', 'start');
                                cookie.create('tutorialShown',1,720);
                            }, 1000)
                        }
                    } else {
                        if ($('#desktop-tutorial').length > 0) {
                            $('#desktop-tutorial').foundation('joyride', 'start');
                            cookie.create('tutorialShown',1,720);
                        }
                    }
                }

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
        });
        $('body').on('click', '.desktop-tutorial-trigger', function() {
          	$('#desktop-tutorial').foundation('joyride', 'start');
        });
        $('body').on('click', '.mobile-tutorial-trigger', function() {
            $('#mobile-tutorial').foundation('joyride', 'start');
        });
        $('body').on('click', '.joyride-expose-cover', function(){
            $('.joyride-modal-bg').trigger('click');
        });

	}]);

	/////////////////////////////////////
	// Bootstrap AngularJS
	/////////////////////////////////////


    if (document.location.hash == "#_=_") {
        
        // This is necessary because of Facebook's stupid hackery. See http://stackoverflow.com/a/7297873

        if (document.location.hostname == "localhost")
            document.location.hash = "#!";
        else
            document.location.hash = "";

    }


	var root = $("html");
	angular.bootstrap(root, ['isaac']);

});
