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
define(["angular-ui-router"], function() {

	// Declare app level module which depends on filters, and services
	angular.module('isaac.router', [
        'ui.router',
	])

	.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

        var getLoggedInPromise = function($rootScope) {
                    return $rootScope.user.$promise.catch(function(r) {
                        if (r.status == 401)
                            return Promise.reject("require_login");
                        return Promise.reject("Something went wrong:", r);
                    });
        }

        getLoggedInPromise['$inject'] = ["$rootScope"];

        var getRolePromiseInjectableFunction = function(role) {
            var result = function($rootScope) {
                return getLoggedInPromise($rootScope).then(function(u){
                    if (u.role == role) {
                        return Promise.resolve(u);
                    } else {
                        return Promise.reject("require_role");
                    }                             
                })
            }
            result["$inject"] = ['$rootScope']
            return result;
        }

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
            .state('teachers', genericPageState("/teachers", "mission_teachers"))
            .state('mission', genericPageState("/mission", "mission"))
            .state('mission_teachers', genericPageState("/mission_teachers", "mission_teachers"))
            .state('mission_students', genericPageState("/mission_students", "mission_students"))
            .state('events', genericPageState("/events", "events_index"))
            .state('glossary', genericPageState("/glossary", "glossary"))
            .state('cookies', genericPageState("/cookies", "cookie_policy"))
            .state('apply_uni', genericPageState("/apply_uni", "apply_uni"))
            .state('solving_problems', genericPageState("/solving_problems", "solving_problems"))
            .state('extraordinary_problems', genericPageState("/extraordinary_problems", "extraordinary_problems_index"))
	        .state('challenge_problems', genericPageState("/challenge_problems", "challenge_problems_index"))
            .state('bios', genericPageState("/bios", "bios"))
            .state('why_physics', genericPageState("/why_physics", "why_physics"))
	        .state('privacy', genericPageState("/privacy", "privacy_policy"))
            .state('fast_track_14', genericPageState("/fast_track_14", "fast_track_14_index"))
            .state('physics_skills_14', genericPageState("/physics_skills_14", "physics_skills_14_index"))

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
            .state('pages', {
                url: "/pages/:id",
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
                        }]
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
                url: "/login?target",
                views: {
                    "body": {
                        templateUrl: "/partials/states/login_page.html",
                        controller: "LoginPageController",
                    }
                }
            })
	        .state('resetPassword', {
		        url: "/resetpassword/*token",
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
                    requireLogin: getLoggedInPromise
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
                        controller: ["$scope", "$stateParams", function($scope, $stateParams) {
                            $scope.target = $stateParams.target;
                        }],
                    },
                },

            })
            .state('403', {
                url: "/unauthorised?target",
                views: {
                    "body": {
                        templateUrl: "/partials/states/403.html",
                        controller: ["$scope", "$stateParams", function($scope, $stateParams) {
                            $scope.target = $stateParams.target;
                        }],
                    },
                },
            })

	        .state('accountSettings', {
		        url: "/account?next&userId",
                resolve: {
                    "userOfInterest" : ["$stateParams", "api", function($stateParams, api) {
                        if ($stateParams.userId) {
                            return api.adminUserSearch.get({"userId" : $stateParams.userId})    
                        } else {
                            return null;
                        }
                    }],
                    requireLogin: getLoggedInPromise,
                },                
		        views: {
			        "body": {
				        templateUrl: "/partials/states/account_settings.html",
				        controller: "AccountSettingsPageController",
			        }
		        }
	        })

	        .state('register', {
		        url: "/register",
                resolve: {
                    "userOfInterest" : function(){return undefined},
                },
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

            .state('admin', {
                url: "/admin",
                resolve: {
                    requireRole: getRolePromiseInjectableFunction("ADMIN"),
                },
                views: {
                    "body": {
                        templateUrl: "/partials/states/admin.html",
                        controller: "AdminPageController",
                    }
                }
            })

             .state('gameEditor', {
                url: "/gameEditor",
                resolve: {
                    "list" : ['api', function(api){
                        return api.questionsEndpoint.query({"levels" : "1", "limit" : "10", "tags" : "physics"}).$promise;
                    }]
                },
                views: {
                    "body": {
                        templateUrl: "/partials/states/game_board_editor.html",
                        controller: "GameEditorControllers",
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

            if (error.status == 403)
                $state.go('403', {target: $state.href(toState, toParams)});
        });

    }])
})