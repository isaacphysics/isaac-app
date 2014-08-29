define(["angular-ui-router"], function() {

	// Declare app level module which depends on filters, and services
	angular.module('isaac.router', [
        'ui.router',
	])

	.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

        $urlRouterProvider.when("", "/");
        $urlRouterProvider.otherwise(function($injector, $location) {
            return "/not_found?target=" + $location.url();
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
            .state('glossary', genericPageState("/glossary", "glossary"))
            .state('cookies', genericPageState("/cookies", "cookie_policy"))
            .state('apply_uni', genericPageState("/apply_uni", "apply_uni"))
            .state('extraordinary_problems', genericPageState("/extraordinary_problems", "extraordinary_problems_index"))
	        .state('challenge_problems', genericPageState("/challenge_problems", "challenge_problems_index"))
            .state('bios', genericPageState("/bios", "bios"))
            .state('why_physics', genericPageState("/why_physics", "why_physics"))
	        .state('privacy', genericPageState("/privacy", "privacy_policy"))
            //.state('login', staticPageState("/users/login", "login_page"))

	        .state('contact', {
		        url: "/contact",
		        views: {
			        "body": {
				        templateUrl: "/partials/states/contact.html",
				        controller: "ContactController",
			        }
		        }
	        })

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
/*
            .state('randomContent', {
                url: "/content/:id",
                resolve: {
                    "page": ["api", "$stateParams", function(api, $stateParams) {
                        return api.pages.get({id: $stateParams.id}).$promise;
                    }]
                },
                views: {
                    "body": {
                        templateUrl: "/partials/states/generic_page.html",
                        controller: ["$scope", "page", function($scope, page) {
                            $scope.title = "Content object: " + page.id;
                            $scope.doc = page;
                        }],
                    }
                }
            })*/
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
                url: "/login?target",
                views: {
                    "body": {
                        templateUrl: "/partials/states/login_page.html",
                        controller: "LoginPageController",
                    }
                }
            })
	        .state('resetPassword', {
		        url: "/resetpassword/:token",
		        views: {
			        "body": {
				        templateUrl: "/partials/states/reset_password.html",
				        controller: "ResetPasswordPageController",
			        }
		        }
	        })
            .state('boards', {
                url: "/boards",
                resolve: {
                    requireLogin: "authResolver",
                },
                views: {
                    "body": {
                        templateUrl: "/partials/states/my_boards.html",
                        controller: "MyBoardsPageController",
                    }
                }
            })
            .state('board', {
                url: "/board/:id",
                onEnter: ["$stateParams", "$location", function($stateParams, $location) {
                    $location.url("/#" + $stateParams.id);
                    throw "Prevent entering board redirect state."
                }],
            })
            .state('searchResults', {
                url: "/search?query&types&page",
                resolve: {                    
                    "query" :['$stateParams', function($stateParams){
                        return $stateParams.query;
                    }],
                    
                    "types" :['$stateParams', function($stateParams){
                        if ($stateParams.types != null && $stateParams.types.length > 0) {
                            return $stateParams.types.split(",");    
                        } else {
                            return [];
                        }
                    }],
                    
                    "pageIndex" :['$stateParams', function($stateParams){
                        return parseInt($stateParams.page || "1") - 1;
                    }]
                },
                views: {
                    "body": {
                        templateUrl: "/partials/states/search_results.html",
                        controller: "SearchController",
                    }
                },
                reloadOnSearch: false,
            })
            .state('logout', {
                url: "/logout",
                resolve: {
                    done: ["auth", function(auth) {
                        window.foo = auth.logout();
                        return window.foo;
                    }],
                },
                onEnter: ["$state", function($state) {
                    document.location.href = "/";
                }]
            })
            .state('shareLink', {
                url: "/s/:shortCode",
                onEnter: ["$stateParams", "api", function($stateParams, api) {
                    var redirectURL = "http://goo.gl/" + $stateParams.shortCode;
                    var doRedirect = function(){
                        document.location.href = redirectURL;  
                    }

                    api.logger.log({
                        type : "USE_SHARE_LINK",
                        shortURL : redirectURL,
                    }).$promise.then(function(){
                        doRedirect();
                    }).catch(function(){
                        doRedirect();
                    })
                }]
            })

            .state('404', {
                url: "/not_found?target",
                views: {
                    "body": {
                        templateUrl: "/partials/states/404.html",
                        controller: function($scope, $stateParams) {
                            $scope.target = $stateParams.target;
                        }
                    },
                },
            })

	        .state('accountSettings', {
		        url: "/account?next",
		        views: {
			        "body": {
				        templateUrl: "/partials/states/account_settings.html",
				        controller: "AccountSettingsPageController",
			        }
		        }
	        })

	        .state('register', {
		        url: "/register",
		        views: {
			        "body": {
				        templateUrl: "/partials/states/register.html",
				        controller: "AccountSettingsPageController",
			        }
		        }
	        })

            .state('authCallback', {
                url: "/auth/:provider/callback",
                onEnter: ["$stateParams", "$location", "auth", function($stateParams, $location, auth) {
                    console.debug("Auth callback from", $stateParams.provider, "with params:", $location.search());

                    auth.providerCallback($stateParams.provider, $location.search());
                }]
            })

            .state('authError', {
                url: "/auth_error?errorMessage&statusText",
                views: {
                    "body": {
                        templateUrl: "/partials/states/auth_error.html",
                        controller: "AuthErrorPageController",
                    }
                }
            })
	}])

    .run(['$rootScope', '$state', function($rootScope, $state) {
        $rootScope.$on("$stateChangeError", function(event, toState, toParams, fromState, fromParams, error) {
            console.warn("State change error:", error);

            if (error == "require_login")
                $state.go('login', {target: $state.href(toState, toParams)});

            if (error.status == 404)
                $state.go('404', {target: $state.href(toState, toParams)});
        });

    }])


})