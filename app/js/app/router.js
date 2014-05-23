define(["angular-ui-router"], function() {

	// Declare app level module which depends on filters, and services
	angular.module('isaac.router', [
        'ui.router',
	])

	.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

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

	}])


})