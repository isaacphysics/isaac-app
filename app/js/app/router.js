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

        /*
         * Function that can be used to ensure that a user belongs to one of a set of roles.
         * If the current user does not belong to a supplied role the promise will be rejected.
         *
         */
        var getRolePromiseInjectableFunction = function(roles) {
            var result = function($rootScope) {
                return getLoggedInPromise($rootScope).then(function(u) {
                    if (roles.indexOf(u.role) > -1) {
                        return Promise.resolve(u);
                    } else {
                        console.warn("This route requires the user to have one of the following roles: " + roles)
                        return Promise.reject("require_role");
                    }
                })
            }
            result["$inject"] = ['$rootScope']
            return result;
        }

        $urlRouterProvider.when("", "/");
        $urlRouterProvider.otherwise(function($injector, $location) {
            var $state = $injector.get("$state");
            $state.go("404", {
                target: $location.url()
            });
        });

        var genericPageState = function(url, id) {
                return {
                    url: url,
                    resolve: {
                        "page": ["api", function(api) {
                            return api.pages.get({
                                id: id
                            }).$promise;
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
            /**
             * @param url is the route to bind to
             * @param state is the template name to load
             * @param controller is the controller to use
             */
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
            .state('physics_skills_14', staticPageState("/physics_skills_14", "book_index", "BooksControllers"))
            .state('questions', staticPageState('/questions', 'questions', 'QuestionsPageControllers'))
            .state('publications', genericPageState("/publications", "publications"))
            .state('prize_draws', genericPageState("/prize_draws", "prize_draws"))
            .state('spc', genericPageState("/spc", "spc"))

        .state('teacher_features', {
            url: "/teacher_features?redirectModal",
            views: {
                "body": {
                    templateUrl: "/partials/states/teacher_features.html",
                    controller: "TeacherFeaturesPageController",
                }
            },
            reloadOnSearch: false,
        })

        .state('equality', {
            url: "/equality?mode&symbols",
            resolve: {
                // BIG RED AND YELLOW WARNING WITH SPARKLES AND A FEW CRACKERS JUST IN CASE:
                // we may want to revert this policy at some point.
                // requireRole: getRolePromiseInjectableFunction(["ADMIN", "CONTENT_EDITOR", "EVENT_MANAGER"]),
            },
            views: {
                "body": {
                    templateUrl: "/partials/states/equation_editor.html",
                    controller: "EqualityPageController"
                },
            },
        })

        .state('contact', {
            url: "/contact?preset&subject",

            views: {
                "body": {
                    templateUrl: "/partials/states/contact.html",
                    controller: "ContactController",
                }
            }
        })

        .state('gameBoards', {
            url: "/gameboards?filter",
            views: {
                "body": {
                    templateUrl: "/partials/states/gameboards.html",
                    controller: "GameBoardsController",
                }
            }
        })

        .state('conceptIndex', {
            url: "/concepts?page",
            resolve: {
                "conceptList": ['api', function(api) {
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

        .state('concept', {
            url: "/concepts/:id",
            resolve: {
                "page": ["api", "$stateParams", function(api, $stateParams) {
                    return api.conceptPages.get({
                        id: $stateParams.id
                    }).$promise;
                }]
            },
            views: {
                "body": {
                    templateUrl: "/partials/states/concept.html",
                    controller: "ConceptPageController",
                }
            }
        })

        .state('regressionTestQuestion', {
            url: "/questions/_regression_test_",
            onEnter: ["$state", "$rootScope", function($state, $rootScope) {
                if (window.location.host == "isaacphysics.org") {
                    console.log("This page exists for internal test purposes and is unavailable.")
                    $state.go('404', {
                        target: "/questions/_regression_test_"
                    });
                    // TODO work out why have to set loading false for both!
                    $rootScope.setLoading(false);
                } else {
                    $state.go('question', {
                        id: "_regression_test_"
                    });
                    $rootScope.setLoading(false);
                }
            }],
        })

        .state('question', {
                url: "/questions/:id?board",
                resolve: {
                    "page": ["api", "$stateParams", function(api, $stateParams) {
                        return api.questionPages.get({
                            id: $stateParams.id
                        }).$promise;
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
                        return api.pages.get({
                            id: $stateParams.id
                        }).$promise;
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
            .state('verifyEmail', {
                url: "/verifyemail?userid&token&email&requested",
                views: {
                    "body": {
                        templateUrl: "/partials/states/verify_email.html",
                        controller: "VerifyEmailPageController",
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
                onEnter: ["$stateParams", "$location", "$rootScope", function($stateParams, $location, $rootScope) {
                    $location.url("/#" + $stateParams.id);
                    $rootScope.setLoading(false);
                    throw "Prevent entering board redirect state."
                }],
            })
            .state('searchResults', {
                url: "/search?query&types&page",
                resolve: {
                    "query": ['$stateParams', function($stateParams) {
                        return $stateParams.query;
                    }],
                    "types": ['$stateParams', function($stateParams) {
                        // If $stateParams.types not empty object...
                        if ($stateParams.types != null && $stateParams.types.length > 0) {
                            // and object is actually a string, with items seperated by commas...
                            if (typeof $stateParams.types == "string" || (typeof $stateParams.types == "object" && $stateParams.types.constructor === String)) {
                                // return the items in the string as an array of strings
                                return $stateParams.types.split(",");
                            } else {
                                // object is an array of strings already
                                return $stateParams.types;
                            }
                        } else {
                            // $stateParams.types is indeed empty. return empty list
                            return [];
                        }
                    }],

                    "pageIndex": ['$stateParams', function($stateParams) {
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
                    var doRedirect = function() {
                        document.location.href = redirectURL;
                    }

                    api.logger.log({
                        type: "USE_SHARE_LINK",
                        shortURL: redirectURL,
                    }).$promise.then(function() {
                        doRedirect();
                    }).catch(function() {
                        doRedirect();
                    })
                }]
            })

        .state('404', {
                params: {
                    "target": null
                },
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
                params: {
                    "target": null
                },
                views: {
                    "body": {
                        templateUrl: "/partials/states/403.html",
                        controller: ["$scope", "$stateParams", function($scope, $stateParams) {
                            $scope.target = $stateParams.target;
                        }],
                    },
                },
            })
            .state('error', {
                views: {
                    "body": {
                        templateUrl: "/partials/states/error.html",
                    },
                },
            })

        .state('accountSettings', {
            url: "/account?next&userId&authToken",
            resolve: {
                "userOfInterest": ["$stateParams", "api", function($stateParams, api) {
                    if ($stateParams.userId) {
                        return api.adminUserSearch.get({
                            "userId": $stateParams.userId
                        })
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
                "userOfInterest": function() {
                    return undefined
                },
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
                requireRole: getRolePromiseInjectableFunction(["ADMIN", "EVENT_MANAGER"]),
            },
            views: {
                "body": {
                    templateUrl: "/partials/states/admin.html",
                    controller: "AdminPageController",
                }
            }
        })

        .state('adminStats', {
                url: "/admin/stats",
                resolve: {
                    requireRole: getRolePromiseInjectableFunction(["ADMIN", "STAFF", "CONTENT_EDITOR", "EVENT_MANAGER"]),
                },
                views: {
                    "body": {
                        templateUrl: "/partials/states/admin_stats.html",
                        controller: ["$scope", "api", function($scope, api) {
                            // general stats
                            $scope.statistics = null;
                            $scope.setLoading(true)
                            api.statisticsEndpoint.get().$promise.then(function(result) {
                                $scope.statistics = result;
                                $scope.setLoading(false)
                            });
                            api.eventBookings.getAllBookings({
                                "count_only": true
                            }).$promise.then(function(result) {
                                $scope.eventBookingsCount = result.count;
                            })
                        }]
                    }
                }
            })
            .state('adminStats.schoolUserSummaryList', {
                url: "/schools",
                templateUrl: '/partials/admin_stats/school_user_summary_list.html',
                resolve: {
                    "dataToShow": ["api", function(api) {
                        return api.statisticsEndpoint.getSchoolPopularity();
                    }]
                },
                controller: "AdminStatsPageController",
            })
            .state('adminStats.schoolUsersDetail', {
                url: "/schools/:schoolId/user_list",
                templateUrl: '/partials/admin_stats/school_user_detail_list.html',
                resolve: {
                    "dataToShow": ["api", "$stateParams", function(api, $stateParams) {
                        return api.statisticsEndpoint.getSchoolUsers({
                            id: $stateParams.schoolId
                        });
                    }]
                },
                controller: "AdminStatsPageController"
            })
            .state('adminStats.popularGameboards', {
                url: "/popular_gameboards",
                templateUrl: '/partials/admin_stats/popular_gameboards.html',
                resolve: {
                    "dataToShow": ["api", function(api) {
                        return api.statisticsEndpoint.getGameboardPopularity();
                    }]
                },
                controller: "AdminStatsPageController",
            })
            .state('adminStats.isaacAnalytics', {
                url: "/isaac_analytics",
                templateUrl: '/partials/admin_stats/analytics.html',
                controller: "AnalyticsPageController",
            })

        .state('adminEvents', {
            url: "/admin/events",
            resolve: {
                requireRole: getRolePromiseInjectableFunction(["ADMIN", "STAFF", "EVENT_MANAGER"]),
            },
            views: {
                "body": {
                    templateUrl: "/partials/states/admin_events.html",
                    controller: "AdminEventBookingController",
                }
            }
        })

        .state('adminUserManager', {
            url: "/admin/usermanager",
            resolve: {
                requireRole: getRolePromiseInjectableFunction(["ADMIN", "EVENT_MANAGER"])
            },
            views: {
                "body": {
                    templateUrl: "/partials/states/admin_user_manager.html",
                    controller: "AdminUserManagerController",
                }
            }
        })

        .state('adminEmailsWithUserIds', {
            url: "/admin/emails/:userIds",
            resolve: {
                requireRole: getRolePromiseInjectableFunction(["ADMIN"]),
            },
            views: {
                "body": {
                    templateUrl: "/partials/states/admin_emails.html",
                    controller: "AdminEmailController",
                }
            }
        })

        .state('adminEmails', {
            url: "/admin/emails/",
            resolve: {
                requireRole: getRolePromiseInjectableFunction(["ADMIN"]),
            },
            views: {
                "body": {
                    templateUrl: "/partials/states/admin_emails.html",
                    controller: "AdminEmailController",
                }
            }
        })

        .state('gameEditor', {
            url: "/game_builder?query&subject&level&sort",
            resolve: {
                requireRole: getRolePromiseInjectableFunction(["ADMIN", "TEACHER", "STAFF", "CONTENT_EDITOR", "EVENT_MANAGER"]),
            },
            views: {
                "body": {
                    templateUrl: "/partials/states/game_board_editor.html",
                    controller: "GameEditorControllers",
                }
            }
        })

        .state('groups', {
            url: "/groups",
            resolve: {
                requireRole: getRolePromiseInjectableFunction(["ADMIN", "TEACHER", "STAFF", "CONTENT_EDITOR", "EVENT_MANAGER"]),
            },
            views: {
                "body": {
                    templateUrl: "/partials/states/group_management.html",
                    controller: "GroupManagementPageController",
                }
            }
        })

        .state('setAssignments', {
            url: "/set_assignments",
            resolve: {
                requireRole: getRolePromiseInjectableFunction(["ADMIN", "TEACHER", "STAFF", "CONTENT_EDITOR", "EVENT_MANAGER"]),
            },
            views: {
                "body": {
                    templateUrl: "/partials/states/assign_boards.html",
                    controller: "SetAssignmentsPageController",
                }
            }
        })

        .state('assignments', {
            url: "/assignments",
            resolve: {
                requireLogin: getLoggedInPromise,
            },
            views: {
                "body": {
                    templateUrl: "/partials/states/my_assignments.html",
                    controller: "MyAssignmentsPageController",
                }
            }
        })

        .state('progress', {
            url: "/progress",
            resolve: {
                requireLogin: getLoggedInPromise,
            },
            views: {
                "body": {
                    templateUrl: "/partials/states/my_progress.html",
                    controller: "MyProgressPageController",
                }
            }
        })

        .state('userProgress', {
            url: "/progress/:userId",
            resolve: {
                requireLogin: getLoggedInPromise,
            },
            views: {
                "body": {
                    templateUrl: "/partials/states/my_progress.html",
                    controller: "MyProgressPageController",
                }
            }
        })

        .state('assignmentProgress', {
            url: "/assignment_progress",
            resolve: {
                requireRole: getRolePromiseInjectableFunction(["ADMIN", "TEACHER", "STAFF", "CONTENT_EDITOR", "EVENT_MANAGER"]),
            },
            views: {
                "body": {
                    templateUrl: "/partials/states/assignment_progress.html",
                    controller: "AssignmentProgressPageController",
                }
            }
        })

        .state('events', {
            url: "/events?event_status&types",
            views: {
                "body": {
                    templateUrl: "/partials/states/events_page.html",
                    controller: "EventsPageController"
                }
            },
            reloadOnSearch: false,
        })

        .state('event', {
            url: "/events/:id",
            views: {
                "body": {
                    templateUrl: "/partials/states/event_detail.html",
                    controller: "EventDetailController"
                }
            }
        })

        .state('book', {
            url: "/book",
            views: {
                "body": {
                    templateUrl: "/partials/states/book_index.html",
                    controller: "BooksControllers",
                }
            }
        })

        .state('bookQuestion', {
            url: "/book/question",
            views: {
                "body": {
                    templateUrl: "/partials/states/book_question.html",
                }
            }
        })

        .state('examUniHelp', {
            url: "/exam_uni_help",
            views: {
                "body": {
                    templateUrl: "/partials/states/exam_uni_help.html",
                }
            }
        })

        .state('addBoard', {
            url: "/add_gameboard/:boardId",
            resolve: {
                requireLogin: getLoggedInPromise,
            },
            onEnter: ['$stateParams', '$state', 'api', '$rootScope', 'requireLogin', function($stateParams, $state, api, $rootScope, requireLogin) {

                api.saveGameBoard($stateParams.boardId).$promise.then(function() {
                    if (requireLogin.role == "TEACHER" || requireLogin.role == "CONTENT_EDITOR" || requireLogin.role == "EVENT_MANAGER" || requireLogin.role == "ADMIN") {
                        $state.go("setAssignments", {}, {
                            location: "replace"
                        });
                    } else {
                        $state.go("boards", {}, {
                            location: "replace"
                        });
                    }
                }).catch(function(e) {
                    console.error("Error saving board.");
                    $rootScope.showToast($rootScope.toastTypes.Failure, "Error saving board", "Sorry, something went wrong.");
                });
            }],
        })
    }])

    .run(['$rootScope', '$state', '$location', function($rootScope, $state, $location) {
        $rootScope.$on("$stateChangeError", function(event, toState, toParams, fromState, fromParams, error) {
            console.warn("State change error:", error);

            // The UI Router doesn't preserve the hash for us, so do it manually.
            var toHash = $location.hash();
            toHash = toHash ? "#" + toHash : "";

            if (error == "require_login")
                $state.go('login', {
                    target: $state.href(toState, toParams) + toHash
                });

            if (error == "require_role")
                $state.go('403', {
                    target: $state.href(toState, toParams) + toHash
                });

            if (error.status == 404)
                $state.go('404', {
                    target: $state.href(toState, toParams) + toHash
                });
        });

    }])
})
