'use strict';

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
		'isaac.controllers'
	])

	.config(['$locationProvider', 'apiProvider', function($locationProvider, apiProvider) {

        // Only use html5 mode if we are on a real server, which should respect .htaccess
		$locationProvider.html5Mode(document.location.hostname != "localhost").hashPrefix("!");

        // Here we configure the api provider with the server running the API. Don't need to do this if we want to use the same server as the static content.
        if (document.location.hostname == "localhost")
            apiProvider.server("http://dev.isaacphysics.org");
	}])

	.run(['$rootScope', 'api', function($rootScope, api) {
/*
        api.pages.get({id: "events_index"}).$promise.then(function(d) {
            $rootScope.aboutPage = d.contentObject;
        });*/

        $rootScope.$on("$stateChangeStart", function() {
            $rootScope.isLoading = true;
        });

        $rootScope.$on("$stateChangeSuccess", function() {
            $rootScope.isLoading = false;
        })

        $rootScope.$on("$stateChangeError", function() {
            $rootScope.isLoading = false;
        })

        $rootScope.$on("$includeContentLoaded", function() {
            console.log("Partial loaded. Reinitialising document.");

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
                // Fast click
                FastClick.attach(document.body);
                
                // Mobile login drop down
                $("#mobile-login").click(function(e)
                {
                    e.preventDefault();
                    $("#mobile-login-form").ruDropDownToggle();
                });
                
                // Mobile search drop down
                $("#mobile-search").click(function(e)
                {
                    e.preventDefault();
                    $("#mobile-search-form").ruDropDownToggle();
                });
                
                // Force resize of vidoes on tab change and accordion change
                $(document).foundation(
                {
                    tab:{
                        callback : function (tab)
                        {
                            rv.forceResize();
                        }
                    }
                }); 
                $(".ru_accordion_titlebar").click(function()
                {
                    rv.forceResize();
                });
                
                // Toggle hide / show of share links
                $(".ru_share").click(function()
                {
                    $(".ru_share_link").toggleClass('ru_share_link_show');
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
