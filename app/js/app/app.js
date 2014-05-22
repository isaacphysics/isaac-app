'use strict';

define(["foundation", "app/responsive_video", "angular", "angular-route", "angular-resource", "app/controllers", "app/directives", "app/services", "app/filters"], function() {

	var rv = require("app/responsive_video");

	// Declare app level module which depends on filters, and services
	angular.module('isaac', [
		'ngRoute',
		'isaac.filters',
		'isaac.services',
		'isaac.directives',
		'isaac.controllers'
	])

	.config(['$routeProvider', '$locationProvider', 'apiProvider', function($routeProvider, $locationProvider, apiProvider) {

		$locationProvider.html5Mode(true).hashPrefix("!");

		$routeProvider.when('/view1', {templateUrl: 'partials/partial1.html', controller: 'MyCtrl1'});
		$routeProvider.when('/view2', {templateUrl: 'partials/partial2.html', controller: 'MyCtrl2'});
		$routeProvider.otherwise({redirectTo: '/view1'});

        // Here we configure the api provider with the server running the API. Don't need to do this if it's local.
        apiProvider.server("http://isaac-dev.dtg.cl.cam.ac.uk");
	}])

	.run(['$rootScope', 'api', function($rootScope, api) {


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
        });

	}]);


	/////////////////////////////////////
	// Bootstrap AngularJS
	/////////////////////////////////////

	var root = $("html");
	angular.bootstrap(root, ['isaac']);

});
