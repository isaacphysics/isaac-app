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
        'isaac.services',
    ])

    .config(['$stateProvider', '$urlRouterProvider', 'subjectProvider', function($sp, $urlRouterProvider, subject) {

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

        var bookState = function(bookId) {
            return {
                url: "/books/" + bookId,
                resolve: {
                    introTextId: [function() { return bookId + "_intro"}],
                },
                views: {
                    "body": {
                        templateUrl: "/partials/states/books/" + bookId + ".html",
                        controller: "BooksController",
                    },
                },
            }
        }

        $sp.state('support', {
            url: "/support/:type/:idSuffix",
            resolve: {
                categories: [function() {
                    return {
                        teacher: {
                            general: { idSuffix: "general", title: "General Questions", icon: "faq" }, 
                            assignments: { idSuffix: "assignments", title: "Assigning Work", icon: "faq" },
                            progress: { idSuffix: "progress", title: "Viewing Student Progress", icon: "faq" },
                            suggestions: { idSuffix: "suggestions", title: "Teaching Suggestions", icon: "teacher-hat" },
                            direct: { idSuffix: "direct", title: "One-to-One Support", icon: "teacher-hat" },
                        },
                        student: {
                            general: { idSuffix: "general", title: "General Questions", icon: "faq" },
                            homework: { idSuffix: "homework", title: "Finding Homework", icon: "faq" },
                            questions: { idSuffix: "questions", title: "Answering Questions", icon: "faq" },
                        },
                    };
                }],
                activeCategory: ["categories", "$stateParams", function(categories, $stateParams) {
                    return categories[$stateParams.type] && categories[$stateParams.type][$stateParams.idSuffix] || Promise.reject({status: 404});
                }],
            },
            views: {
                "body": {
                    templateUrl: "/partials/states/support.html",
                    controller: "SupportPageController",
                },
            },
        });
        // Add redirects for the URL subsections:
        $sp.state('supportRoot', {
            url: "/support",
            onEnter: ["$state","$rootScope", function($state, $rootScope) {
                $state.go("support", {type:'student', idSuffix: 'general'});
                $rootScope.setLoading(false);
            }],
        });
        $sp.state('supportStudent', {
            url: "/support/student",
            onEnter: ["$state","$rootScope", function($state, $rootScope) {
                $state.go("support", {type:'student', idSuffix: 'general'});
                $rootScope.setLoading(false);
            }],
        });
        $sp.state('supportTeacher', {
            url: "/support/teacher",
            onEnter: ["$state","$rootScope", function($state, $rootScope) {
                $state.go("support", {type:'teacher', idSuffix: 'general'});
                $rootScope.setLoading(false);
            }],
        });

        // These routes apply to all of the sites
        $sp.state('home', staticPageState("/", "home", "HomePageController"));
        $sp.state('cookies', genericPageState("/cookies", "cookie_policy"));
        $sp.state('privacy', genericPageState("/privacy", "privacy_policy"));
        $sp.state('terms', genericPageState("/terms", "terms_of_use"));
        $sp.state('publications', genericPageState("/publications", "publications"));
        $sp.state('faq', genericPageState("/faq", "faq"));


        if (subject.id == "physics") {

            // These are the routes that are specific to the physics site

            $sp.state('about', genericPageState("/about", "about_us_index"));
            $sp.state('teachers', genericPageState("/teachers", "mission_teachers"));
            $sp.state('mission', genericPageState("/mission", "mission"));
            $sp.state('mission_teachers', genericPageState("/mission_teachers", "mission_teachers"));
            $sp.state('mission_students', genericPageState("/mission_students", "mission_students"));
            $sp.state('glossary', genericPageState("/glossary", "glossary"));
            $sp.state('apply_uni', genericPageState("/apply_uni", "apply_uni"));
            $sp.state('solving_problems', genericPageState("/solving_problems", "solving_problems"));
            $sp.state('extraordinary_problems', genericPageState("/extraordinary_problems", "extraordinary_problems_index"));
            $sp.state('challenge_problems', genericPageState("/challenge_problems", "challenge_problems_index"));
            $sp.state('bios', genericPageState("/bios", "bios"));
            $sp.state('why_physics', genericPageState("/why_physics", "why_physics"));
            $sp.state('fast_track_14', genericPageState("/fast_track_14", "fast_track_14_index"));
            $sp.state('prize_draws', genericPageState("/prize_draws", "prize_draws"));
            $sp.state('spc', genericPageState("/spc", "spc"));
            $sp.state('chemistry', genericPageState("/chemistry", "chemistry_landing_page"));

            $sp.state('bookQuestion', staticPageState("/book/question", "book_question"));
            $sp.state('examUniHelp', staticPageState("/exam_uni_help", "exam_uni_help"));
            $sp.state('gcse', staticPageState("/gcse", "gcse"));
            $sp.state('alevel', staticPageState("/alevel", "alevel"));


            // The events page shouldn't be accessible from the other sites to avoid confusion!
            $sp.state('events', {
                url: "/events?event_status&types&show_booked_only",
                views: {
                    "body": {
                        templateUrl: "/partials/states/events_page.html",
                        controller: "EventsPageController"
                    }
                },
                reloadOnSearch: false,
            });

            $sp.state('qmp', {
                url: "/qmp",
                onEnter: ["$state","$rootScope", function($state, $rootScope) {
                    $state.go('book_quantum_mechanics_primer', {}, {
                        location: "replace"
                    });
                    $rootScope.setLoading(false);
                }],
            });
            $sp.state('gcsebook', {
                url: "/gcsebook",
                onEnter: ["$state","$rootScope", function($state, $rootScope) {
                    $state.go('book_phys_book_gcse', {}, {
                        location: "replace"
                    });
                    $rootScope.setLoading(false);
                }],
            });
            // Old book page URLs still need to work:
            $sp.state('physics_skills_14', {
                url: "/physics_skills_14",
                onEnter: ["$state","$rootScope", function($state, $rootScope) {
                    $state.go('book_physics_skills_14', {}, {
                        location: "replace"
                    });
                    $rootScope.setLoading(false);
                }],
            });
            $sp.state('book', {
                url: "/book",
                onEnter: ["$state","$rootScope", function($state, $rootScope) {
                    $state.go('book_physics_skills_14', {}, {
                        location: "replace"
                    });
                    $rootScope.setLoading(false);
                }],
            });
        }


        if (subject.id == "chemistry") {

            // Create chemistry generic pages and register them here.

            $sp.state('book16', {
                url: "/book16",
                onEnter: ["$state","$rootScope", function($state, $rootScope) {
                    $state.go('book_chemistry_16', {}, {
                        location: "replace"
                    });
                    $rootScope.setLoading(false);
                }],
            });
        }

        if (subject.id == "biology") {

            // Create biology generic pages and register them here
        }
        
        $sp.state('questions', staticPageState('/questions', 'questions', 'QuestionsPageControllers'));


        // To create a book page:
        // * Create /partials/states/books/<BOOK_ID>.html (copy an existing one and modify)
        // * Create intro text content with ID <BOOK_ID>_intro
        // * Add a bookState below
        // * Update /book (below) if you wish
        $sp.state('book_physics_skills_14', bookState("physics_skills_14"));
        $sp.state('book_chemistry_16', bookState("chemistry_16"));
        $sp.state('book_phys_book_gcse', bookState("phys_book_gcse"));
        $sp.state('book_quantum_mechanics_primer', bookState("quantum_mechanics_primer"));
        $sp.state('book_pre_uni_maths', bookState("pre_uni_maths"));

        $sp.state('answers', {
            // People try this URL for answers; point them to the FAQ:
            url: "/answers",
            onEnter: ["$state", "$rootScope", function($state, $rootScope) {
                $state.go('faq', {'#': 'answers'}, {location: "replace"});
                $rootScope.setLoading(false);
            }],
        });

        $sp.state('teacher_features', {
            url: "/teacher_features?redirectModal",
            views: {
                "body": {
                    templateUrl: "/partials/states/teacher_features.html",
                    controller: "TeacherFeaturesPageController",
                }
            },
            reloadOnSearch: false,
        });

        $sp.state('equality', {
            url: "/equality?mode&symbols&testing",
            views: {
                "body": {
                    templateUrl: "/partials/states/equation_editor.html",
                    controller: "EqualityPageController"
                },
            },
        });

        // Temporarily disable until we have refactored
        // $sp.state('sketcher', {
        //     url: "/sketcher",
        //     views: {
        //         "body": {
        //             templateUrl: "/partials/states/graph_sketcher.html",
        //             controller: "SketcherPageController"
        //         },
        //     },
        // })

        $sp.state('contact', {
            url: "/contact?preset&subject",

            views: {
                "body": {
                    templateUrl: "/partials/states/contact.html",
                    controller: "ContactController",
                }
            }
        });

        $sp.state('gameBoards', {
            url: "/gameboards?filter",
            views: {
                "body": {
                    templateUrl: "/partials/states/gameboards.html",
                    controller: "GameBoardsController",
                }
            }
        });

        $sp.state('conceptIndex', {
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
        });

        $sp.state('concept', {
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
        });

        $sp.state('regressionTestQuestion', {
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
        });

        $sp.state('question', {
            url: "/questions/:id?board&questionHistory",
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
        });

        $sp.state('pages', {
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
                    controller: "GenericPageController"
                }
            }
        });

        $sp.state('contentErrors', {
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
        });

        $sp.state('login', {
            url: "/login?target",
            views: {
                "body": {
                    templateUrl: "/partials/states/login_page.html",
                    controller: "LoginPageController",
                }
            }
        });

        $sp.state('resetPassword', {
            url: "/resetpassword/*token",
            views: {
                "body": {
                    templateUrl: "/partials/states/reset_password.html",
                    controller: "ResetPasswordPageController",
                }
            }
        });

        $sp.state('verifyEmail', {
            url: "/verifyemail?userid&token&requested",
            views: {
                "body": {
                    templateUrl: "/partials/states/verify_email.html",
                    controller: "VerifyEmailPageController",
                }
            }
        });

        $sp.state('boards', {
            url: "/boards?view",
            resolve: {
                requireLogin: getLoggedInPromise
            },
            views: {
                "body": {
                    templateUrl: "/partials/states/my_boards.html",
                    controller: "MyBoardsPageController",
                }
            }
        });

        $sp.state('board', {
            url: "/board/:id",
            onEnter: ["$stateParams", "$location", "$rootScope", function($stateParams, $location, $rootScope) {
                $location.url("/#" + $stateParams.id);
                $rootScope.setLoading(false);
                throw "Prevent entering board redirect state."
            }],
        });

        $sp.state('searchResults', {
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
        });

        $sp.state('logout', {
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
        });

        $sp.state('shareLink', {
            url: "/s/:shortCode",
            onEnter: ["$state", "$stateParams", "api", "$http", function($state, $stateParams, api, $http) {
                var redirectURL = "https://goo.gl/" + $stateParams.shortCode;

                api.logger.log({
                    type: "USE_SHARE_LINK",
                    shortCode: $stateParams.shortCode
                }).$promise.then(function () {
                    return $http.get("https://www.googleapis.com/urlshortener/v1/url", {params: {shortUrl: redirectURL, key: 'AIzaSyBcVr1HZ_JUR92xfQZSnODvvlSpNHYbi4Y'}});
                }).then(function(response) {
                    if (response.data.status == "OK") {
                        var longUrl = response.data.longUrl;
                        if (longUrl.indexOf(window.location.origin) == 0) {
                            document.location.href = longUrl;
                        } else {
                            $state.go("externalLink", {link: longUrl}, {location: false});
                        }
                    } else {
                        // Not 'OK' means malware or deleted.
                        $state.go("404", {target: "/s/" + $stateParams.shortCode});
                    }
                }).catch(function() {
                    // Google are deprecating this API, try sending the user directly to the Google URL:
                    document.location.href = redirectURL;
                });
            }]
        });

        $sp.state('externalLink', {
            url: "/redirect",
            params: {
                "link": null
            },
            views: {
                "body": {
                    templateUrl: "/partials/states/external_link.html",
                    controller: ["$scope", "$stateParams", function($scope, $stateParams) {
                        $scope.link = $stateParams.link;
                    }],
                },
            },
        });

        $sp.state('404', {
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
        });

        $sp.state('403', {
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
        });

        $sp.state('error', {
            views: {
                "body": {
                    templateUrl: "/partials/states/error.html",
                },
            },
        });

        $sp.state('accountSettings', {
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
        });

        $sp.state('register', {
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
        });

        $sp.state('authCallback', {
            url: "/auth/:provider/callback",
            onEnter: ["$stateParams", "$location", "auth", function($stateParams, $location, auth) {
                console.debug("Auth callback from", $stateParams.provider, "with params:", $location.search());

                auth.providerCallback($stateParams.provider, $location.search());
            }]
        });

        $sp.state('authError', {
            url: "/auth_error?errorMessage&statusText",
            views: {
                "body": {
                    templateUrl: "/partials/states/auth_error.html",
                    controller: "AuthErrorPageController",
                }
            }
        });

        $sp.state('admin', {
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
        });

        $sp.state('adminStats', {
                url: "/admin/stats",
                resolve: {
                    requireRole: getRolePromiseInjectableFunction(["ADMIN", "STAFF", "CONTENT_EDITOR", "EVENT_MANAGER"]),
                },
                views: {
                    "body": {
                        templateUrl: "/partials/states/admin_stats.html",
                        controller: ["$scope", "api", function($scope, api) {

                            $scope.state = 'adminStats';

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
            });

            $sp.state('adminStats.schoolUserSummaryList', {
                url: "/schools",
                templateUrl: '/partials/admin_stats/school_user_summary_list.html',
                resolve: {
                    "dataToShow": ["api", function(api) {
                        return api.statisticsEndpoint.getSchoolPopularity();
                    }]
                },
                controller: "AdminStatsPageController",
            });

            $sp.state('adminStatsNew.schoolUserSummaryList', {
                url: "/schools",
                templateUrl: '/partials/admin_stats/school_user_summary_list_new.html',
                resolve: {
                    "dataToShow": ["api", function(api) {
                        return api.statisticsEndpoint.getNewSchoolPopularity();
                    }]
                },
                controller: "AdminStatsPageController",
            });

            $sp.state('adminStats.schoolUsersDetail', {
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
            });

            $sp.state('adminStatsNew.schoolUsersDetail', {
                url: "/schools/:schoolId/user_list",
                templateUrl: '/partials/admin_stats/school_user_detail_list.html',
                resolve: {
                    "dataToShow": ["api", "$stateParams", function(api, $stateParams) {
                        return api.statisticsEndpoint.getNewSchoolUsers({
                            id: $stateParams.schoolId
                        });
                    }]
                },
                controller: "AdminStatsPageController"
            });

            $sp.state('adminStats.popularGameboards', {
                url: "/popular_gameboards",
                templateUrl: '/partials/admin_stats/popular_gameboards.html',
                resolve: {
                    "dataToShow": ["api", function(api) {
                        return api.statisticsEndpoint.getGameboardPopularity();
                    }]
                },
                controller: "AdminStatsPageController",
            });

            $sp.state('adminStatsNew.popularGameboards', {
                url: "/popular_gameboards",
                templateUrl: '/partials/admin_stats/popular_gameboards.html',
                resolve: {
                    "dataToShow": ["api", function(api) {
                        return api.statisticsEndpoint.getGameboardPopularity();
                    }]
                },
                controller: "AdminStatsPageController",
            });

            $sp.state('adminStats.isaacAnalytics', {
                url: "/isaac_analytics",
                templateUrl: '/partials/admin_stats/analytics.html',
                controller: "AnalyticsPageController",
            });

            $sp.state('adminStatsNew.isaacAnalytics', {
                url: "/isaac_analytics",
                templateUrl: '/partials/admin_stats/analytics.html',
                controller: "AnalyticsPageController",
            });


        $sp.state('adminEvents', {
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
        });

        $sp.state('adminUserManager', {
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
        });

        $sp.state('adminEmailsWithUserIds', {
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
        });

        $sp.state('adminEmails', {
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
        });

        $sp.state('gameEditor', {
            url: "/game_builder?query&subject&level&sort&base",
            resolve: {
                requireRole: getRolePromiseInjectableFunction(["ADMIN", "TEACHER", "STAFF", "CONTENT_EDITOR", "EVENT_MANAGER"]),
            },
            views: {
                "body": {
                    templateUrl: "/partials/states/game_board_editor.html",
                    controller: "GameEditorControllers",
                }
            }
        });

        $sp.state('groups', {
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
        });

        $sp.state('setAssignments', {
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
        });

        $sp.state('assignments', {
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
        });

        $sp.state('progress', {
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
        });

        $sp.state('userProgress', {
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
        });

        $sp.state('assignmentProgress', {
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
        });

        $sp.state('event', {
            url: "/events/:id",
            views: {
                "body": {
                    templateUrl: "/partials/states/event_detail.html",
                    controller: "EventDetailController"
                }
            }
        });

        $sp.state('addBoard', {
            url: "/add_gameboard/:boardId",
            resolve: {
                requireLogin: getLoggedInPromise,
            },
            onEnter: ['$stateParams', '$state', 'api', '$rootScope', 'requireLogin', function($stateParams, $state, api, $rootScope, requireLogin) {

                api.saveGameBoard($stateParams.boardId).$promise.then(function() {
                    if (requireLogin.role == "TEACHER" || requireLogin.role == "CONTENT_EDITOR" || requireLogin.role == "EVENT_MANAGER" || requireLogin.role == "ADMIN") {
                        $state.go("setAssignments", {'#': $stateParams.boardId}, {
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
        });

        $sp.state('assignmentRedirect', {
            url: "/assignment/:boardId",
            resolve: {
                requireLogin: getLoggedInPromise,
            },
            onEnter: ['$stateParams', '$state', '$rootScope', function($stateParams, $state, $rootScope) {
                $state.go('gameBoards', {'#': $stateParams.boardId}, {location: "replace"});
                $rootScope.setLoading(false);
            }],
        });
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
