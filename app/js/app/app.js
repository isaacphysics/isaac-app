'use strict';

// TODO: Implement site-wide search functionality.

define([
    "rsvp", 
    "foundation", 
    "app/router", 
    "app/honest/responsive_video", 
    "angular", 
    "angular-resource", 
    "app/controllers", 
    "app/directives", 
    "app/services", 
    "app/filters",
    "fastclick",
    "app/honest/dropdown",
    "app/honest/answer_reveal",
    "angulartics", 
    "angulartics-ga",
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
        'angulartics',
        'angulartics.google.analytics',
	])

	.config(['$locationProvider', 'apiProvider', function($locationProvider, apiProvider) {

        // Only use html5 mode if we are on a real server, which should respect .htaccess
		$locationProvider.html5Mode(document.location.hostname != "localhost").hashPrefix("!");

        // Here we configure the api provider with the server running the API. Don't need to do this if we want to use the same server as the static content.
        if (document.location.hostname == "localhost")
            apiProvider.server("http://dev.isaacphysics.org");
	}])

	.run(['$rootScope', 'api', '$state', function($rootScope, api, $state) {

        $rootScope.globalFlags = {
            siteSearchOpen: false,
            isLoading: false,
        };

        $rootScope.$state = $state;

        $rootScope.$on("$stateChangeStart", function() {
            $rootScope.globalFlags.isLoading = true;
        });

        $rootScope.$on("$stateChangeSuccess", function() {
            $rootScope.globalFlags.isLoading = false;
            $rootScope.globalFlags.displayLoadingMessage = false;
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
                                        'only screen and (min-width: 1024px) and (min-resolution: 2dppx)'
                    }
                }
            });
            $(document).foundation('interchange', 'reflow');

            // Global jQuery
            $(function()
            {

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
                
                // Fix up for Firefox scroll to
                if (navigator.userAgent.match(/firefox/i))
                {
                    $('html').css({overflow:'hidden', height:'100%'});
                    $('body').css({overflow:'auto', height:'100%'});
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
                        $link = $('a', $(this));
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
                $("#mobile-login").click(function(e)
                {
                    e.preventDefault();
                    $("#mobile-login-form").ruDropDownToggle(this);
                });
                
                // Mobile search drop down
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
                
                // Force resize of vidoes on tab change and accordion change
                $(document).foundation(
                {
                    tab:{
                        callback : function (tab)
                        {
                            rv.forceResize();
                            sliderResize();
                            // Determine location of tabs content and then pause any child videos
                            var obj = $($('a', tab).attr('href')).parent();
                            rv.pauseVideos(obj);
                        }
                    }
                }); 

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

	}]);


	/////////////////////////////////////
	// Bootstrap AngularJS
	/////////////////////////////////////

	var root = $("html");
	angular.bootstrap(root, ['isaac']);

});
