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
                    "body": {
                        templateUrl: "/partials/states/generic_page.html",
                        controller: "GenericPageController",
                    }
                }
            };
        }

        var staticPageState = function(url, state, controller) {
            return {
                url: url,
                views: {
                    "body": { 
                        templateUrl: "/partials/states/" + state + ".html",
                        controller: controller
                    },
                },
            }
        }

        $stateProvider
            .state('home', staticPageState("/", "home", "HomePageController"))
            .state('about', genericPageState("/about", "about_us_index"))
            .state('events', genericPageState("/events", "events_index"))
            .state('apply_uni', genericPageState("/apply_uni", "apply_uni"))
            .state('featured_problems', genericPageState("/featured_problems", "featured_problems_index"))
            .state('bios', genericPageState("/bios", "bios"))
            .state('why_physics', genericPageState("/why_physics", "why_physics"))
            .state('contact', staticPageState("/contact", "contact"))
            //.state('login', staticPageState("/users/login", "login_page"))

            .state('conceptIndex', {
                url: "/concepts?page",
                resolve: {
                    "conceptList" : ['api', function(api){
                        return api.getConceptList().$promise;
                    }]
                },
                views: {
                    "body": {
                        templateUrl: "/partials/states/concept_index.html",
                        controller: "ConceptIndexController",
                    }
                }
            })
            .state('questionIndex', {
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
                    "body": {
                        templateUrl: "/partials/states/question_index.html",
                        controller: "QuestionIndexController",
                    }
                }
            })            

            .state('concept', {
                url: "/concepts/:id",
                resolve: {
                    "page": ["api", "$stateParams", function(api, $stateParams) {
                        return api.conceptPages.get({id: $stateParams.id}).$promise;
                    }]
                },                
                views: {
                    "body": {
                        templateUrl: "/partials/states/concept.html",
                        controller: "ConceptPageController",
                    }
                }
            })

            .state('question', {
                url: "/questions/:id?board",
                resolve: {
                    "page": ["api", "$stateParams", function(api, $stateParams) {
                        return api.questionPages.get({id: $stateParams.id}).$promise;
                    }]
                },                
                views: {
                    "body": {
                        templateUrl: "/partials/states/question.html",
                        controller: "QuestionPageController",
                    }
                }
            })            

            .state('randomContent', {
                url: "/content/:id",
                resolve: {
                    "page": ["api", "$stateParams", function(api, $stateParams) {
                        return api.content.get({id: $stateParams.id}).$promise;
                    }]
                },
                views: {
                    "body": {
                        templateUrl: "/partials/states/generic_page.html",
                        controller: ["$scope", "page", function($scope, page) {
                            $scope.title = "Content object: " + page.contentObject.id;
                            $scope.doc = page.contentObject;
                        }],
                    }
                }
            })
            .state('contentErrors', {
                url: "/admin/content_errors",
                resolve: {
                    "page": ["api", "$stateParams", function(api, $stateParams) {
                        return api.contentProblems.get().$promise;
                    }]
                },
                views: {
                    "body": {
                        templateUrl: "/partials/states/content_error.html",
                        controller: "ContentErrorController",
                    }
                }
            })
            .state('login', {
                url: "/users/login",
                resolve: {
                    "authenticationEndpoint": ["api", "$stateParams", function(api, $stateParams) {
                        return api.authenticationEndpoint;
                    }]
                },
                views: {
                    "body": {
                        templateUrl: "/partials/states/login_page.html",
                        controller: "LoginPageController",
                    }
                }
            })                         
            .state('404', {
                params: ["target"],
                views: {
                    "body": {
                        templateUrl: "/partials/states/404.html",
                        controller: function($scope, $stateParams) {
                            $scope.target = $stateParams.target;
                        }
                    },
                },
            })
	}])

    .run(['$rootScope', '$state', function($rootScope, $state) {
        $rootScope.$on("$stateChangeError", function(event, toState, toParams, fromState, fromParams, error) {
            console.warn("State change error:", error);

            if (error.status == 404)
                $state.go('404', {target: $state.href(toState, toParams)});
        });

    }])


})