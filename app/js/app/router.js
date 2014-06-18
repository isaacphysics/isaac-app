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
                    "header-panel-mobile": {
                        templateUrl: "/partials/states/generic_page/header_panel_mobile.html",
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
                    "header-panel-mobile": {
                        templateUrl: "/partials/states/" + folder + "/header_panel_mobile.html",
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
            .state('apply_uni', genericPageState("/apply_uni", "apply_uni"))
            .state('featured_problems', genericPageState("/featured_problems", "featured_problems_index"))
            .state('bios', genericPageState("/bios", "bios"))
            .state('why_physics', genericPageState("/why_physics", "why_physics"))
            .state('contact', staticPageState("/contact", "contact"))

            .state('conceptsIndex', {
                url: "/concepts?page",
                resolve: {
                    "pageIndex" :['$stateParams', function($stateParams){
                        return parseInt($stateParams.page || "1") - 1;
                    }],
                    "list" : ['api', 'pageIndex', function(api, pageIndex){
                        return api.getConceptList(pageIndex).$promise;
                    }]
                },
                views: {
                    "header-panel": {
                        templateUrl: "/partials/states/concepts/header_panel.html",
                        controller: "ConceptsIndexPageHeaderController",
                    },
                    "header-panel-mobile": {
                        templateUrl: "/partials/states/concepts/header_panel_mobile.html",
                        controller: "ConceptsIndexPageHeaderController",
                    },
                    "body": {
                        templateUrl: "/partials/states/concepts/body.html",
                        controller: "ConceptsIndexPageBodyController",
                    }
                }
            })
            .state('questionsIndex', {
                url: "/questions?page",
                resolve: {
                    "pageIndex" :['$stateParams', function($stateParams){
                        return parseInt($stateParams.page || "1") - 1;
                    }],
                    "list" : ['api', 'pageIndex', function(api, pageIndex){
                        return api.getQuestionList(pageIndex).$promise;
                    }]
                },
                views: {
                    //TODO: Stop reusing ConceptsIndex controllers eventually - I was just being lazy.
                    "header-panel": {
                        templateUrl: "/partials/states/questions/header_panel.html",
                        controller: "ConceptsIndexPageHeaderController",
                    },
                    "header-panel-mobile": {
                        templateUrl: "/partials/states/questions/header_panel_mobile.html",
                        controller: "ConceptsIndexPageHeaderController",
                    },
                    "body": {
                        templateUrl: "/partials/states/questions/body.html",
                        controller: "ConceptsIndexPageBodyController",
                    }
                }
            })            

            .state('concept', {
                url: "/concepts/:id",
                resolve: {
                    "page": ["api", "$stateParams", function(api, $stateParams) {
                        return api.concepts.get({id: $stateParams.id}).$promise;
                    }]
                },                
                views: {
                    "header-panel": {
                        templateUrl: "/partials/states/concept/header_panel.html",
                        controller: "ConceptPageHeaderController",
                    },
                    "header-panel-mobile": {
                        templateUrl: "/partials/states/concept/header_panel_mobile.html",
                        controller: "ConceptPageHeaderController",
                    },
                    "body": {
                        templateUrl: "/partials/states/concept/body.html",
                        controller: "ConceptPageBodyController",
                    }
                }
            })

            .state('question', {
                url: "/questions/:id",
                resolve: {
                    "page": ["api", "$stateParams", function(api, $stateParams) {
                        return api.questions.get({id: $stateParams.id}).$promise;
                    }]
                },                
                views: {
                    "header-panel": {
                        templateUrl: "/partials/states/question/header_panel.html",
                        controller: "QuestionPageHeaderController",
                    },
                    "header-panel-mobile": {
                        templateUrl: "/partials/states/question/header_panel_mobile.html",
                        controller: "QuestionPageHeaderController",
                    },
                    "body": {
                        templateUrl: "/partials/states/question/body.html",
                        controller: "QuestionPageBodyController",
                    }
                }
            })            

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
                    "header-panel-mobile": {
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
                    "header-panel-mobile": {
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