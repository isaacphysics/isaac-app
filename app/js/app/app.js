'use strict';

define(["rsvp", "foundation", "angular-ui-router", "app/responsive_video", "angular", "angular-resource", "app/controllers", "app/directives", "app/services", "app/filters"], function() {

    window.Promise = RSVP.Promise;
    window.Promise.defer = RSVP.defer;

	var rv = require("app/responsive_video");

	// Declare app level module which depends on filters, and services
	angular.module('isaac', [
        'ui.router',
		'isaac.filters',
		'isaac.services',
		'isaac.directives',
		'isaac.controllers'
	])

	.config(['$stateProvider', '$urlRouterProvider', '$locationProvider', 'apiProvider', function($stateProvider, $urlRouterProvider, $locationProvider, apiProvider) {

        $urlRouterProvider.when("", "/");
        $urlRouterProvider.otherwise(function($injector, $location) {
            var $state = $injector.get("$state");
            $state.go("404", {target: $location.url()});
        });

        var genericPageState = function(url, id) {
            return {
                url: url,
                resolve: {
                    "page": ["api", function(api) {
                        return api.pages.get({id: id}).$promise;
                    }]
                },                
                views: {
                    "header-panel": {
                        templateUrl: "/partials/states/generic_page/header_panel.html",
                        controller: "GenericPageHeaderController",
                    },
                    "body": {
                        templateUrl: "/partials/states/generic_page/body.html",
                        controller: "GenericPageBodyController",
                    }
                }
            };
        }

        var staticPageState = function(url, folder) {
            return {
                url: url,
                views: {
                    "header-panel": {
                        templateUrl: "/partials/states/" + folder + "/header_panel.html",
                    },
                    "body": { 
                        templateUrl: "/partials/states/" + folder + "/body.html"
                    },
                },
            }
        }

        $stateProvider
            .state('home', staticPageState("/", "home"))
            .state('about', genericPageState("/about", "about_us_index"))
            .state('events', genericPageState("/events", "events_index"))
            .state('contact', staticPageState("/contact", "contact"))
            .state('random_content', {
                url: "/content/:id",
                resolve: {
                    "page": ["api", "$stateParams", function(api, $stateParams) {
                        return api.content.get({id: $stateParams.id}).$promise;
                    }]
                },
                views: {
                    "header-panel": {
                        templateUrl: "/partials/states/generic_page/header_panel.html",
                        controller: ["$scope", "page", function($scope, page) {
                            $scope.title = "Content object: " + page.contentObject.id;
                        }],
                    },
                    "body": {
                        templateUrl: "/partials/states/generic_page/body.html",
                        controller: ["$scope", "page", function($scope, page) {
                            $scope.doc = page.contentObject;
                        }],
                    }
                }
            })
            .state('404', {
                params: ["target"],
                views: {
                    "header-panel": {
                        template: "<h1>Page not found</h1>",
                    },
                    "body": {
                        template: "Page not found: {{target}}",
                        controller: function($scope, $stateParams) {
                            $scope.target = $stateParams.target;
                        }
                    },
                },
            })

        // Only use html5 mode if we are on a real server, which should respect .htaccess
		$locationProvider.html5Mode(document.location.hostname != "localhost").hashPrefix("!");

        // Here we configure the api provider with the server running the API. Don't need to do this if it's local.
        apiProvider.server("http://isaac-dev.dtg.cl.cam.ac.uk");
	}])

	.run(['$rootScope', 'api', function($rootScope, api) {
/*
        api.pages.get({id: "events_index"}).$promise.then(function(d) {
            $rootScope.aboutPage = d.contentObject;
        });*/

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
