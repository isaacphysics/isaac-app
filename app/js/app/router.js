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
define(["angular", "@uirouter/angularjs"], function(angular, _angularUiRouter) {

    // Declare app level module which depends on filters, and services
    angular.module('isaac.router', [
        'ui.router',
        'isaac.services',
    ])

    .config(['$stateProvider', '$urlRouterProvider', 'subjectProvider', function($sp, $urlRouterProvider, subject) {

        let getLoggedInPromise = function($rootScope) {
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
        let getRolePromiseInjectableFunction = function(roles) {
            let result = function($rootScope) {
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
            let $state = $injector.get("$state");
            $state.go("404", {
                target: $location.url()
            });
        });

        let genericPageState = function(url, id) {
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
        let staticPageState = function(url, state, controller) {
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

        let bookState = function(bookId) {
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
        $sp.state('about', genericPageState("/about", "about_us_index"));
        $sp.state('cyberessentials', genericPageState("/cyberessentials", "cyberessentials"));


        if (subject.id == "physics") {

            // These are the routes that are specific to the physics site
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

            // Redirects for old URLs:
            $sp.state('mission', {
                url: "/mission",
                onEnter: ["$state","$rootScope", function($state, $rootScope) {
                    $state.go('about', {}, {location: "replace"});
                    $rootScope.setLoading(false);
                }],
            });
            $sp.state('teachers', {
                url: "/teachers",
                onEnter: ["$state","$rootScope", function($state, $rootScope) {
                    $state.go('supportTeacher', {}, {location: "replace"});
                    $rootScope.setLoading(false);
                }],
            });


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
        $sp.state('book_physics_skills_19', bookState("physics_skills_19"));
        $sp.state('book_chemistry_16', bookState("chemistry_16"));
        $sp.state('book_phys_book_gcse', bookState("phys_book_gcse"));
        $sp.state('book_quantum_mechanics_primer', bookState("quantum_mechanics_primer"));
        $sp.state('book_pre_uni_maths', bookState("pre_uni_maths"));

        $sp.state('answers', {
            // People try this URL for answers; point them to the FAQ:
            url: "/answers",
            onEnter: ["$state", "$rootScope", function($state, $rootScope) {
                $state.go('support', {'type': 'student', 'idSuffix': 'questions', '#': 'answers'}, {location: "replace"});
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
                    return {"id":"graph_sketcher_test","title":"Sketcher Test","type":"isaacQuestionPage","encoding":"markdown","canonicalSourceFile":"content/beta_pages/graph_sketcher_test.json","children":[{"type":"content","encoding":"markdown","children":[],"value":"We have a graph sketching tool under development, with some sample questions to be attempted below. The input should be sketches, the axes aren't scaled and as such only key features should be labelled using the available symbols. \n\nThe questions currently won't be marked for you, this is still being worked on.\n\nIf you have any feedback or graph sketching problems please do get in touch using the link after the final question.","published":false,"tags":[]},{"id":"graph_sketcher_test|48cfddd0-8e66-4e2a-b462-fc27aeb97cee","type":"isaacGraphSketcherQuestion","encoding":"markdown","children":[],"value":"Sketch $y = 2x + 3$.","published":true,"choices":[{"type":"graphChoice","encoding":"markdown","children":[],"value":"","published":false,"graphData":"{\"canvasWidth\":1377,\"canvasHeight\":737,\"curves\":[{\"pts\":[{\"x\":-0.2051,\"y\":-0.2055},{\"x\":-0.2022,\"y\":-0.2},{\"x\":-0.1992,\"y\":-0.1945},{\"x\":-0.1962,\"y\":-0.1891},{\"x\":-0.1933,\"y\":-0.1836},{\"x\":-0.1903,\"y\":-0.1781},{\"x\":-0.1874,\"y\":-0.1726},{\"x\":-0.1844,\"y\":-0.1671},{\"x\":-0.1815,\"y\":-0.1617},{\"x\":-0.1785,\"y\":-0.1562},{\"x\":-0.1755,\"y\":-0.1507},{\"x\":-0.1726,\"y\":-0.1452},{\"x\":-0.1696,\"y\":-0.1397},{\"x\":-0.1667,\"y\":-0.1343},{\"x\":-0.1637,\"y\":-0.1288},{\"x\":-0.1608,\"y\":-0.1233},{\"x\":-0.1578,\"y\":-0.1178},{\"x\":-0.1549,\"y\":-0.1123},{\"x\":-0.1519,\"y\":-0.1068},{\"x\":-0.1489,\"y\":-0.1014},{\"x\":-0.146,\"y\":-0.0959},{\"x\":-0.143,\"y\":-0.0904},{\"x\":-0.1401,\"y\":-0.0849},{\"x\":-0.1371,\"y\":-0.0794},{\"x\":-0.1342,\"y\":-0.074},{\"x\":-0.1312,\"y\":-0.0685},{\"x\":-0.1283,\"y\":-0.063},{\"x\":-0.1253,\"y\":-0.0575},{\"x\":-0.1223,\"y\":-0.052},{\"x\":-0.1194,\"y\":-0.0465},{\"x\":-0.1164,\"y\":-0.0411},{\"x\":-0.1135,\"y\":-0.0356},{\"x\":-0.1105,\"y\":-0.0301},{\"x\":-0.1076,\"y\":-0.0246},{\"x\":-0.1046,\"y\":-0.0191},{\"x\":-0.1017,\"y\":-0.0137},{\"x\":-0.0987,\"y\":-0.0082},{\"x\":-0.0957,\"y\":-0.0027},{\"x\":-0.0928,\"y\":0.0027},{\"x\":-0.0898,\"y\":0.0082},{\"x\":-0.0869,\"y\":0.0137},{\"x\":-0.0839,\"y\":0.0191},{\"x\":-0.081,\"y\":0.0246},{\"x\":-0.078,\"y\":0.0301},{\"x\":-0.0751,\"y\":0.0356},{\"x\":-0.0721,\"y\":0.0411},{\"x\":-0.0691,\"y\":0.0465},{\"x\":-0.0662,\"y\":0.052},{\"x\":-0.0632,\"y\":0.0575},{\"x\":-0.0603,\"y\":0.063},{\"x\":-0.0573,\"y\":0.0685},{\"x\":-0.0544,\"y\":0.074},{\"x\":-0.0514,\"y\":0.0794},{\"x\":-0.0485,\"y\":0.0849},{\"x\":-0.0455,\"y\":0.0904},{\"x\":-0.0425,\"y\":0.0959},{\"x\":-0.0396,\"y\":0.1014},{\"x\":-0.0366,\"y\":0.1068},{\"x\":-0.0337,\"y\":0.1123},{\"x\":-0.0307,\"y\":0.1178},{\"x\":-0.0278,\"y\":0.1233},{\"x\":-0.0248,\"y\":0.1288},{\"x\":-0.0219,\"y\":0.1343},{\"x\":-0.0189,\"y\":0.1397},{\"x\":-0.0159,\"y\":0.1452},{\"x\":-0.013,\"y\":0.1507},{\"x\":-0.01,\"y\":0.1562},{\"x\":-0.0071,\"y\":0.1617},{\"x\":-0.0041,\"y\":0.1671},{\"x\":-0.0012,\"y\":0.1726},{\"x\":0.0017,\"y\":0.1781},{\"x\":0.0046,\"y\":0.1836},{\"x\":0.0076,\"y\":0.1891},{\"x\":0.0106,\"y\":0.1945},{\"x\":0.0135,\"y\":0.2},{\"x\":0.0165,\"y\":0.2055},{\"x\":0.0194,\"y\":0.211},{\"x\":0.0224,\"y\":0.2165},{\"x\":0.0253,\"y\":0.222},{\"x\":0.0283,\"y\":0.2274},{\"x\":0.0312,\"y\":0.2329},{\"x\":0.0342,\"y\":0.2384},{\"x\":0.0372,\"y\":0.2439},{\"x\":0.0401,\"y\":0.2494},{\"x\":0.0431,\"y\":0.2548},{\"x\":0.046,\"y\":0.2603},{\"x\":0.049,\"y\":0.2658},{\"x\":0.0519,\"y\":0.2713},{\"x\":0.0549,\"y\":0.2768},{\"x\":0.0579,\"y\":0.2823},{\"x\":0.0608,\"y\":0.2877},{\"x\":0.0638,\"y\":0.2932},{\"x\":0.0667,\"y\":0.2987},{\"x\":0.0697,\"y\":0.3042},{\"x\":0.0726,\"y\":0.3097},{\"x\":0.0756,\"y\":0.3151},{\"x\":0.0785,\"y\":0.3206},{\"x\":0.0815,\"y\":0.3261},{\"x\":0.0845,\"y\":0.3316},{\"x\":0.0874,\"y\":0.3371},{\"x\":0.0904,\"y\":0.3426}],\"minX\":-0.2051,\"maxX\":0.0904,\"minY\":0.3426,\"maxY\":-0.2055,\"interX\":[{\"x\":-0.0943,\"y\":0}],\"interY\":[{\"x\":0,\"y\":0.1749}],\"maxima\":[],\"minima\":[],\"colorIdx\":0}],\"freeSymbols\":[{\"text\":\"A\",\"x\":-0.4891,\"y\":0.4796},{\"text\":\"B\",\"x\":-0.4673,\"y\":0.4796},{\"text\":\"C\",\"x\":-0.4455,\"y\":0.4796},{\"text\":\"D\",\"x\":-0.4237,\"y\":0.4796},{\"text\":\"E\",\"x\":-0.4019,\"y\":0.4796}]}"}]},{"id":"graph_sketcher_test|5b032e4c-e432-455f-925f-8efb8b33c18e","type":"isaacGraphSketcherQuestion","encoding":"markdown","children":[],"value":"Sketch $y = x^2 - 2x + 3$.","published":true,"choices":[{"type":"graphChoice","encoding":"markdown","children":[],"value":"","published":false,"graphData":"{\"canvasWidth\":1377,\"canvasHeight\":737,\"curves\":[{\"pts\":[{\"x\":-0.0468,\"y\":0.3914},{\"x\":-0.0459,\"y\":0.3832},{\"x\":-0.0447,\"y\":0.3745},{\"x\":-0.0433,\"y\":0.3657},{\"x\":-0.0419,\"y\":0.3569},{\"x\":-0.0403,\"y\":0.3482},{\"x\":-0.0387,\"y\":0.3398},{\"x\":-0.037,\"y\":0.3315},{\"x\":-0.0352,\"y\":0.3233},{\"x\":-0.0334,\"y\":0.3153},{\"x\":-0.0316,\"y\":0.3073},{\"x\":-0.0297,\"y\":0.2994},{\"x\":-0.0278,\"y\":0.2915},{\"x\":-0.0258,\"y\":0.2837},{\"x\":-0.0239,\"y\":0.2758},{\"x\":-0.0219,\"y\":0.2679},{\"x\":-0.0199,\"y\":0.2601},{\"x\":-0.0179,\"y\":0.2523},{\"x\":-0.0159,\"y\":0.2445},{\"x\":-0.0139,\"y\":0.2368},{\"x\":-0.0118,\"y\":0.2292},{\"x\":-0.0097,\"y\":0.2217},{\"x\":-0.0076,\"y\":0.2142},{\"x\":-0.0055,\"y\":0.2068},{\"x\":-0.0033,\"y\":0.1995},{\"x\":-0.001,\"y\":0.1922},{\"x\":0.0011,\"y\":0.185},{\"x\":0.0034,\"y\":0.1779},{\"x\":0.0058,\"y\":0.1709},{\"x\":0.0082,\"y\":0.164},{\"x\":0.0106,\"y\":0.1572},{\"x\":0.0131,\"y\":0.1506},{\"x\":0.0157,\"y\":0.1441},{\"x\":0.0183,\"y\":0.1379},{\"x\":0.021,\"y\":0.1318},{\"x\":0.0238,\"y\":0.126},{\"x\":0.0267,\"y\":0.1205},{\"x\":0.0296,\"y\":0.1154},{\"x\":0.0326,\"y\":0.1105},{\"x\":0.0357,\"y\":0.106},{\"x\":0.0389,\"y\":0.1019},{\"x\":0.0422,\"y\":0.0983},{\"x\":0.0455,\"y\":0.095},{\"x\":0.0489,\"y\":0.0922},{\"x\":0.0523,\"y\":0.0899},{\"x\":0.0557,\"y\":0.088},{\"x\":0.0592,\"y\":0.0867},{\"x\":0.0627,\"y\":0.0858},{\"x\":0.0662,\"y\":0.0854},{\"x\":0.0697,\"y\":0.0855},{\"x\":0.0731,\"y\":0.0861},{\"x\":0.0765,\"y\":0.0873},{\"x\":0.0799,\"y\":0.0889},{\"x\":0.0831,\"y\":0.091},{\"x\":0.0863,\"y\":0.0936},{\"x\":0.0894,\"y\":0.0966},{\"x\":0.0923,\"y\":0.1001},{\"x\":0.0952,\"y\":0.1041},{\"x\":0.098,\"y\":0.1084},{\"x\":0.1006,\"y\":0.1132},{\"x\":0.1031,\"y\":0.1183},{\"x\":0.1055,\"y\":0.1237},{\"x\":0.1078,\"y\":0.1295},{\"x\":0.11,\"y\":0.1355},{\"x\":0.112,\"y\":0.1419},{\"x\":0.114,\"y\":0.1484},{\"x\":0.1159,\"y\":0.1552},{\"x\":0.1177,\"y\":0.1621},{\"x\":0.1194,\"y\":0.1692},{\"x\":0.121,\"y\":0.1764},{\"x\":0.1226,\"y\":0.1837},{\"x\":0.1241,\"y\":0.1911},{\"x\":0.1255,\"y\":0.1985},{\"x\":0.1269,\"y\":0.206},{\"x\":0.1282,\"y\":0.2135},{\"x\":0.1295,\"y\":0.221},{\"x\":0.1308,\"y\":0.2285},{\"x\":0.132,\"y\":0.2359},{\"x\":0.1331,\"y\":0.2434},{\"x\":0.1342,\"y\":0.2508},{\"x\":0.1352,\"y\":0.2582},{\"x\":0.1362,\"y\":0.2655},{\"x\":0.1371,\"y\":0.2729},{\"x\":0.1379,\"y\":0.2803},{\"x\":0.1387,\"y\":0.2876},{\"x\":0.1395,\"y\":0.295},{\"x\":0.1401,\"y\":0.3024},{\"x\":0.1408,\"y\":0.3098},{\"x\":0.1414,\"y\":0.3172},{\"x\":0.142,\"y\":0.3246},{\"x\":0.1425,\"y\":0.3321},{\"x\":0.1431,\"y\":0.3395},{\"x\":0.1437,\"y\":0.3469},{\"x\":0.1443,\"y\":0.3543},{\"x\":0.1449,\"y\":0.3616},{\"x\":0.1456,\"y\":0.3688},{\"x\":0.1462,\"y\":0.376},{\"x\":0.1468,\"y\":0.3831},{\"x\":0.1473,\"y\":0.3901},{\"x\":0.1476,\"y\":0.397},{\"x\":0.1477,\"y\":0.4036}],\"minX\":-0.0468,\"maxX\":0.1477,\"minY\":0.4036,\"maxY\":0.0854,\"interX\":[],\"interY\":[{\"x\":0,\"y\":0.1887}],\"maxima\":[],\"minima\":[{\"x\":0.0662,\"y\":0.0854}],\"colorIdx\":0}],\"freeSymbols\":[{\"text\":\"A\",\"x\":-0.4891,\"y\":0.4796},{\"text\":\"B\",\"x\":-0.4673,\"y\":0.4796},{\"text\":\"C\",\"x\":-0.4455,\"y\":0.4796},{\"text\":\"D\",\"x\":-0.4237,\"y\":0.4796},{\"text\":\"E\",\"x\":-0.4019,\"y\":0.4796}]}"}]},{"id":"graph_sketcher_test|96ee3e16-6fa0-46b5-b9d9-f02d0ba4f077","type":"isaacGraphSketcherQuestion","title":"","encoding":"markdown","children":[],"value":"Sketch $y = (x-1)(x-3)(x-4)$.","published":true,"choices":[{"type":"graphChoice","encoding":"markdown","children":[],"value":"","published":false,"graphData":"{\"canvasWidth\":1377,\"canvasHeight\":737,\"curves\":[{\"pts\":[{\"x\":-0.0374,\"y\":-0.3466},{\"x\":-0.0366,\"y\":-0.3339},{\"x\":-0.0356,\"y\":-0.3217},{\"x\":-0.0345,\"y\":-0.31},{\"x\":-0.0333,\"y\":-0.2986},{\"x\":-0.032,\"y\":-0.2873},{\"x\":-0.0305,\"y\":-0.2761},{\"x\":-0.0289,\"y\":-0.2648},{\"x\":-0.0272,\"y\":-0.2535},{\"x\":-0.0254,\"y\":-0.242},{\"x\":-0.0235,\"y\":-0.2304},{\"x\":-0.0215,\"y\":-0.2187},{\"x\":-0.0195,\"y\":-0.2067},{\"x\":-0.0174,\"y\":-0.1946},{\"x\":-0.0152,\"y\":-0.1823},{\"x\":-0.013,\"y\":-0.1698},{\"x\":-0.0108,\"y\":-0.1574},{\"x\":-0.0085,\"y\":-0.1449},{\"x\":-0.0062,\"y\":-0.1324},{\"x\":-0.0038,\"y\":-0.1199},{\"x\":-0.0014,\"y\":-0.1075},{\"x\":0.001,\"y\":-0.0952},{\"x\":0.0035,\"y\":-0.083},{\"x\":0.006,\"y\":-0.0709},{\"x\":0.0085,\"y\":-0.059},{\"x\":0.0112,\"y\":-0.0473},{\"x\":0.0139,\"y\":-0.0357},{\"x\":0.0166,\"y\":-0.0243},{\"x\":0.0195,\"y\":-0.0131},{\"x\":0.0225,\"y\":-0.0022},{\"x\":0.0256,\"y\":0.0084},{\"x\":0.0288,\"y\":0.0188},{\"x\":0.0321,\"y\":0.0289},{\"x\":0.0355,\"y\":0.0387},{\"x\":0.0391,\"y\":0.048},{\"x\":0.0428,\"y\":0.0569},{\"x\":0.0466,\"y\":0.0651},{\"x\":0.0506,\"y\":0.0727},{\"x\":0.0547,\"y\":0.0795},{\"x\":0.0589,\"y\":0.0854},{\"x\":0.0633,\"y\":0.0902},{\"x\":0.0677,\"y\":0.094},{\"x\":0.0723,\"y\":0.0965},{\"x\":0.0769,\"y\":0.0977},{\"x\":0.0816,\"y\":0.0976},{\"x\":0.0864,\"y\":0.0962},{\"x\":0.0911,\"y\":0.0936},{\"x\":0.0958,\"y\":0.0897},{\"x\":0.1005,\"y\":0.0846},{\"x\":0.1051,\"y\":0.0786},{\"x\":0.1098,\"y\":0.0716},{\"x\":0.1143,\"y\":0.0639},{\"x\":0.1188,\"y\":0.0556},{\"x\":0.1234,\"y\":0.0469},{\"x\":0.1278,\"y\":0.0379},{\"x\":0.1324,\"y\":0.0289},{\"x\":0.1369,\"y\":0.0199},{\"x\":0.1415,\"y\":0.0112},{\"x\":0.1462,\"y\":0.0029},{\"x\":0.1509,\"y\":-0.0047},{\"x\":0.1558,\"y\":-0.0118},{\"x\":0.1608,\"y\":-0.018},{\"x\":0.1659,\"y\":-0.0234},{\"x\":0.1711,\"y\":-0.0279},{\"x\":0.1764,\"y\":-0.0313},{\"x\":0.1817,\"y\":-0.0337},{\"x\":0.1871,\"y\":-0.0349},{\"x\":0.1924,\"y\":-0.035},{\"x\":0.1976,\"y\":-0.0339},{\"x\":0.2027,\"y\":-0.0316},{\"x\":0.2077,\"y\":-0.0282},{\"x\":0.2124,\"y\":-0.0235},{\"x\":0.2169,\"y\":-0.0178},{\"x\":0.2211,\"y\":-0.011},{\"x\":0.225,\"y\":-0.0031},{\"x\":0.2286,\"y\":0.0055},{\"x\":0.2318,\"y\":0.0151},{\"x\":0.2348,\"y\":0.0255},{\"x\":0.2375,\"y\":0.0365},{\"x\":0.2399,\"y\":0.0482},{\"x\":0.2421,\"y\":0.0603},{\"x\":0.244,\"y\":0.0729},{\"x\":0.2458,\"y\":0.0858},{\"x\":0.2475,\"y\":0.099},{\"x\":0.249,\"y\":0.1124},{\"x\":0.2504,\"y\":0.126},{\"x\":0.2517,\"y\":0.1395},{\"x\":0.2529,\"y\":0.153},{\"x\":0.2541,\"y\":0.1665},{\"x\":0.2552,\"y\":0.1797},{\"x\":0.2564,\"y\":0.1928},{\"x\":0.2575,\"y\":0.2056},{\"x\":0.2587,\"y\":0.2183},{\"x\":0.2598,\"y\":0.2307},{\"x\":0.2611,\"y\":0.243},{\"x\":0.2623,\"y\":0.2551},{\"x\":0.2635,\"y\":0.2669},{\"x\":0.2647,\"y\":0.2784},{\"x\":0.2658,\"y\":0.2894},{\"x\":0.2668,\"y\":0.3},{\"x\":0.2676,\"y\":0.31}],\"minX\":-0.0374,\"maxX\":0.2676,\"minY\":0.31,\"maxY\":-0.3466,\"interX\":[{\"x\":0.0231,\"y\":0},{\"x\":0.148,\"y\":0},{\"x\":0.2263,\"y\":0}],\"interY\":[{\"x\":0,\"y\":-0.1004}],\"maxima\":[{\"x\":0.0769,\"y\":0.0977}],\"minima\":[{\"x\":0.1924,\"y\":-0.035}],\"colorIdx\":0}],\"freeSymbols\":[{\"text\":\"A\",\"x\":-0.4891,\"y\":0.4796},{\"text\":\"B\",\"x\":-0.4673,\"y\":0.4796},{\"text\":\"C\",\"x\":-0.4455,\"y\":0.4796},{\"text\":\"D\",\"x\":-0.4237,\"y\":0.4796},{\"text\":\"E\",\"x\":-0.4019,\"y\":0.4796}]}"}]},{"id":"graph_sketcher_test|f5e5d9ea-8bc9-4adc-8073-a599b0eb3d58","type":"isaacGraphSketcherQuestion","encoding":"markdown","children":[],"value":"Sketch $ y = 1/x $.","published":true,"choices":[{"type":"graphChoice","encoding":"markdown","children":[],"value":"","published":false,"graphData":"{\"canvasWidth\":1377,\"canvasHeight\":737,\"curves\":[{\"pts\":[{\"x\":-0.2233,\"y\":-0.0264},{\"x\":-0.2203,\"y\":-0.026},{\"x\":-0.2171,\"y\":-0.0257},{\"x\":-0.2138,\"y\":-0.0255},{\"x\":-0.2105,\"y\":-0.0255},{\"x\":-0.2072,\"y\":-0.0255},{\"x\":-0.2038,\"y\":-0.0257},{\"x\":-0.2004,\"y\":-0.026},{\"x\":-0.197,\"y\":-0.0264},{\"x\":-0.1935,\"y\":-0.0269},{\"x\":-0.19,\"y\":-0.0275},{\"x\":-0.1865,\"y\":-0.0282},{\"x\":-0.183,\"y\":-0.029},{\"x\":-0.1794,\"y\":-0.0299},{\"x\":-0.1758,\"y\":-0.031},{\"x\":-0.1722,\"y\":-0.0322},{\"x\":-0.1687,\"y\":-0.0334},{\"x\":-0.1651,\"y\":-0.0348},{\"x\":-0.1615,\"y\":-0.0363},{\"x\":-0.158,\"y\":-0.0379},{\"x\":-0.1545,\"y\":-0.0396},{\"x\":-0.151,\"y\":-0.0414},{\"x\":-0.1476,\"y\":-0.0433},{\"x\":-0.1442,\"y\":-0.0454},{\"x\":-0.1408,\"y\":-0.0475},{\"x\":-0.1375,\"y\":-0.0498},{\"x\":-0.1342,\"y\":-0.0521},{\"x\":-0.1309,\"y\":-0.0546},{\"x\":-0.1277,\"y\":-0.0571},{\"x\":-0.1245,\"y\":-0.0597},{\"x\":-0.1213,\"y\":-0.0625},{\"x\":-0.1181,\"y\":-0.0653},{\"x\":-0.115,\"y\":-0.0683},{\"x\":-0.1119,\"y\":-0.0713},{\"x\":-0.1088,\"y\":-0.0745},{\"x\":-0.1057,\"y\":-0.0777},{\"x\":-0.1026,\"y\":-0.0811},{\"x\":-0.0996,\"y\":-0.0845},{\"x\":-0.0965,\"y\":-0.0881},{\"x\":-0.0935,\"y\":-0.0917},{\"x\":-0.0905,\"y\":-0.0955},{\"x\":-0.0876,\"y\":-0.0994},{\"x\":-0.0847,\"y\":-0.1034},{\"x\":-0.0818,\"y\":-0.1075},{\"x\":-0.0789,\"y\":-0.1117},{\"x\":-0.0761,\"y\":-0.116},{\"x\":-0.0733,\"y\":-0.1204},{\"x\":-0.0706,\"y\":-0.1249},{\"x\":-0.0679,\"y\":-0.1295},{\"x\":-0.0653,\"y\":-0.1342},{\"x\":-0.0627,\"y\":-0.139},{\"x\":-0.0602,\"y\":-0.1439},{\"x\":-0.0578,\"y\":-0.1488},{\"x\":-0.0555,\"y\":-0.1538},{\"x\":-0.0532,\"y\":-0.1589},{\"x\":-0.0511,\"y\":-0.1641},{\"x\":-0.049,\"y\":-0.1693},{\"x\":-0.047,\"y\":-0.1747},{\"x\":-0.0452,\"y\":-0.1801},{\"x\":-0.0434,\"y\":-0.1856},{\"x\":-0.0417,\"y\":-0.1912},{\"x\":-0.0402,\"y\":-0.1969},{\"x\":-0.0387,\"y\":-0.2027},{\"x\":-0.0374,\"y\":-0.2086},{\"x\":-0.0361,\"y\":-0.2145},{\"x\":-0.0349,\"y\":-0.2205},{\"x\":-0.0339,\"y\":-0.2266},{\"x\":-0.0329,\"y\":-0.2327},{\"x\":-0.032,\"y\":-0.2389},{\"x\":-0.0311,\"y\":-0.2451},{\"x\":-0.0304,\"y\":-0.2513},{\"x\":-0.0297,\"y\":-0.2576},{\"x\":-0.029,\"y\":-0.2639},{\"x\":-0.0284,\"y\":-0.2703},{\"x\":-0.0279,\"y\":-0.2766},{\"x\":-0.0274,\"y\":-0.2829},{\"x\":-0.0269,\"y\":-0.2893},{\"x\":-0.0264,\"y\":-0.2957},{\"x\":-0.026,\"y\":-0.3021},{\"x\":-0.0257,\"y\":-0.3085},{\"x\":-0.0253,\"y\":-0.3149},{\"x\":-0.025,\"y\":-0.3214},{\"x\":-0.0247,\"y\":-0.3278},{\"x\":-0.0244,\"y\":-0.3343},{\"x\":-0.0241,\"y\":-0.3407},{\"x\":-0.0239,\"y\":-0.3472},{\"x\":-0.0237,\"y\":-0.3536},{\"x\":-0.0235,\"y\":-0.36},{\"x\":-0.0234,\"y\":-0.3663},{\"x\":-0.0232,\"y\":-0.3726},{\"x\":-0.0231,\"y\":-0.3787},{\"x\":-0.023,\"y\":-0.3847},{\"x\":-0.0229,\"y\":-0.3905},{\"x\":-0.0229,\"y\":-0.3962},{\"x\":-0.0229,\"y\":-0.4016},{\"x\":-0.0228,\"y\":-0.4067},{\"x\":-0.0228,\"y\":-0.4115},{\"x\":-0.0228,\"y\":-0.4157},{\"x\":-0.0228,\"y\":-0.4192},{\"x\":-0.0228,\"y\":-0.4217},{\"x\":-0.0228,\"y\":-0.4226}],\"minX\":-0.2233,\"maxX\":-0.0228,\"minY\":-0.0255,\"maxY\":-0.4226,\"interX\":[],\"interY\":[],\"maxima\":[],\"minima\":[],\"colorIdx\":0},{\"pts\":[{\"x\":0.0112,\"y\":0.3276},{\"x\":0.0115,\"y\":0.3219},{\"x\":0.0119,\"y\":0.3158},{\"x\":0.0123,\"y\":0.3096},{\"x\":0.0128,\"y\":0.3033},{\"x\":0.0134,\"y\":0.2969},{\"x\":0.014,\"y\":0.2905},{\"x\":0.0146,\"y\":0.2842},{\"x\":0.0153,\"y\":0.2779},{\"x\":0.016,\"y\":0.2716},{\"x\":0.0168,\"y\":0.2654},{\"x\":0.0176,\"y\":0.2593},{\"x\":0.0185,\"y\":0.2532},{\"x\":0.0193,\"y\":0.2472},{\"x\":0.0202,\"y\":0.2412},{\"x\":0.0212,\"y\":0.2352},{\"x\":0.0221,\"y\":0.2293},{\"x\":0.0231,\"y\":0.2234},{\"x\":0.0241,\"y\":0.2175},{\"x\":0.0251,\"y\":0.2116},{\"x\":0.0262,\"y\":0.2057},{\"x\":0.0272,\"y\":0.1998},{\"x\":0.0283,\"y\":0.194},{\"x\":0.0295,\"y\":0.1882},{\"x\":0.0307,\"y\":0.1824},{\"x\":0.0319,\"y\":0.1767},{\"x\":0.0332,\"y\":0.171},{\"x\":0.0345,\"y\":0.1654},{\"x\":0.0359,\"y\":0.1598},{\"x\":0.0374,\"y\":0.1544},{\"x\":0.039,\"y\":0.149},{\"x\":0.0406,\"y\":0.1437},{\"x\":0.0423,\"y\":0.1385},{\"x\":0.0442,\"y\":0.1334},{\"x\":0.0461,\"y\":0.1284},{\"x\":0.048,\"y\":0.1236},{\"x\":0.0501,\"y\":0.1188},{\"x\":0.0523,\"y\":0.1141},{\"x\":0.0545,\"y\":0.1096},{\"x\":0.0568,\"y\":0.1051},{\"x\":0.0593,\"y\":0.1008},{\"x\":0.0617,\"y\":0.0965},{\"x\":0.0643,\"y\":0.0924},{\"x\":0.0669,\"y\":0.0883},{\"x\":0.0696,\"y\":0.0844},{\"x\":0.0724,\"y\":0.0806},{\"x\":0.0752,\"y\":0.0769},{\"x\":0.078,\"y\":0.0732},{\"x\":0.081,\"y\":0.0697},{\"x\":0.0839,\"y\":0.0663},{\"x\":0.087,\"y\":0.0631},{\"x\":0.09,\"y\":0.0599},{\"x\":0.0932,\"y\":0.0568},{\"x\":0.0963,\"y\":0.0539},{\"x\":0.0995,\"y\":0.0511},{\"x\":0.1028,\"y\":0.0484},{\"x\":0.106,\"y\":0.0458},{\"x\":0.1093,\"y\":0.0433},{\"x\":0.1127,\"y\":0.0409},{\"x\":0.116,\"y\":0.0386},{\"x\":0.1194,\"y\":0.0365},{\"x\":0.1228,\"y\":0.0344},{\"x\":0.1263,\"y\":0.0325},{\"x\":0.1297,\"y\":0.0307},{\"x\":0.1331,\"y\":0.029},{\"x\":0.1365,\"y\":0.0274},{\"x\":0.14,\"y\":0.0259},{\"x\":0.1434,\"y\":0.0245},{\"x\":0.1468,\"y\":0.0232},{\"x\":0.1503,\"y\":0.0221},{\"x\":0.1537,\"y\":0.0211},{\"x\":0.1571,\"y\":0.0201},{\"x\":0.1604,\"y\":0.0193},{\"x\":0.1638,\"y\":0.0186},{\"x\":0.1672,\"y\":0.018},{\"x\":0.1705,\"y\":0.0175},{\"x\":0.1738,\"y\":0.0171},{\"x\":0.1771,\"y\":0.0167},{\"x\":0.1804,\"y\":0.0164},{\"x\":0.1836,\"y\":0.0162},{\"x\":0.1869,\"y\":0.0161},{\"x\":0.1901,\"y\":0.016},{\"x\":0.1933,\"y\":0.0159},{\"x\":0.1964,\"y\":0.0159},{\"x\":0.1996,\"y\":0.0159},{\"x\":0.2027,\"y\":0.0159},{\"x\":0.2058,\"y\":0.016},{\"x\":0.209,\"y\":0.0161},{\"x\":0.2121,\"y\":0.0162},{\"x\":0.2152,\"y\":0.0163},{\"x\":0.2183,\"y\":0.0164},{\"x\":0.2213,\"y\":0.0165},{\"x\":0.2244,\"y\":0.0166},{\"x\":0.2274,\"y\":0.0167},{\"x\":0.2303,\"y\":0.0168},{\"x\":0.2332,\"y\":0.0168},{\"x\":0.2359,\"y\":0.0169},{\"x\":0.2385,\"y\":0.0169},{\"x\":0.2408,\"y\":0.0169},{\"x\":0.2428,\"y\":0.0169},{\"x\":0.2443,\"y\":0.0169}],\"minX\":0.0112,\"maxX\":0.2443,\"minY\":0.3276,\"maxY\":0.0159,\"interX\":[],\"interY\":[],\"maxima\":[],\"minima\":[],\"colorIdx\":0}],\"freeSymbols\":[{\"text\":\"A\",\"x\":-0.4891,\"y\":0.4796},{\"text\":\"B\",\"x\":-0.4673,\"y\":0.4796},{\"text\":\"C\",\"x\":-0.4455,\"y\":0.4796},{\"text\":\"D\",\"x\":-0.4237,\"y\":0.4796},{\"text\":\"E\",\"x\":-0.4019,\"y\":0.4796}]}"}]},{"id":"graph_sketcher_test|afaaf16b-2415-4662-98bf-306c55cc72d0","type":"isaacGraphSketcherQuestion","encoding":"markdown","children":[],"value":"Sketch $y = e^x$. Label the intercept with label A.","published":true,"choices":[{"type":"graphChoice","encoding":"markdown","children":[],"value":"","published":false,"graphData":"{\"canvasWidth\":1377,\"canvasHeight\":737,\"curves\":[{\"pts\":[{\"x\":0.1071,\"y\":0.4226},{\"x\":0.107,\"y\":0.413},{\"x\":0.1068,\"y\":0.4038},{\"x\":0.1065,\"y\":0.3947},{\"x\":0.1061,\"y\":0.3857},{\"x\":0.1057,\"y\":0.3769},{\"x\":0.1051,\"y\":0.368},{\"x\":0.1043,\"y\":0.3593},{\"x\":0.1035,\"y\":0.3505},{\"x\":0.1026,\"y\":0.3418},{\"x\":0.1016,\"y\":0.3332},{\"x\":0.1006,\"y\":0.3245},{\"x\":0.0995,\"y\":0.3159},{\"x\":0.0983,\"y\":0.3074},{\"x\":0.0971,\"y\":0.2988},{\"x\":0.0958,\"y\":0.2903},{\"x\":0.0944,\"y\":0.2817},{\"x\":0.0929,\"y\":0.2732},{\"x\":0.0914,\"y\":0.2647},{\"x\":0.0898,\"y\":0.2563},{\"x\":0.0881,\"y\":0.2479},{\"x\":0.0863,\"y\":0.2395},{\"x\":0.0845,\"y\":0.2313},{\"x\":0.0825,\"y\":0.2231},{\"x\":0.0804,\"y\":0.2151},{\"x\":0.0782,\"y\":0.2072},{\"x\":0.0758,\"y\":0.1995},{\"x\":0.0733,\"y\":0.1919},{\"x\":0.0707,\"y\":0.1845},{\"x\":0.068,\"y\":0.1774},{\"x\":0.0651,\"y\":0.1704},{\"x\":0.062,\"y\":0.1637},{\"x\":0.0589,\"y\":0.1572},{\"x\":0.0556,\"y\":0.151},{\"x\":0.0522,\"y\":0.145},{\"x\":0.0487,\"y\":0.1392},{\"x\":0.0451,\"y\":0.1337},{\"x\":0.0413,\"y\":0.1284},{\"x\":0.0375,\"y\":0.1233},{\"x\":0.0337,\"y\":0.1184},{\"x\":0.0297,\"y\":0.1136},{\"x\":0.0258,\"y\":0.1091},{\"x\":0.0217,\"y\":0.1048},{\"x\":0.0176,\"y\":0.1006},{\"x\":0.0135,\"y\":0.0966},{\"x\":0.0093,\"y\":0.0927},{\"x\":0.0051,\"y\":0.089},{\"x\":0.0009,\"y\":0.0854},{\"x\":-0.0033,\"y\":0.082},{\"x\":-0.0075,\"y\":0.0787},{\"x\":-0.0118,\"y\":0.0755},{\"x\":-0.0162,\"y\":0.0725},{\"x\":-0.0206,\"y\":0.0696},{\"x\":-0.0249,\"y\":0.0668},{\"x\":-0.0294,\"y\":0.0641},{\"x\":-0.0338,\"y\":0.0616},{\"x\":-0.0382,\"y\":0.0592},{\"x\":-0.0427,\"y\":0.0569},{\"x\":-0.0472,\"y\":0.0547},{\"x\":-0.0517,\"y\":0.0527},{\"x\":-0.0562,\"y\":0.0507},{\"x\":-0.0607,\"y\":0.0489},{\"x\":-0.0653,\"y\":0.0472},{\"x\":-0.0698,\"y\":0.0456},{\"x\":-0.0743,\"y\":0.0442},{\"x\":-0.0789,\"y\":0.0428},{\"x\":-0.0834,\"y\":0.0415},{\"x\":-0.088,\"y\":0.0404},{\"x\":-0.0925,\"y\":0.0393},{\"x\":-0.097,\"y\":0.0383},{\"x\":-0.1016,\"y\":0.0374},{\"x\":-0.1061,\"y\":0.0365},{\"x\":-0.1106,\"y\":0.0357},{\"x\":-0.1151,\"y\":0.035},{\"x\":-0.1196,\"y\":0.0343},{\"x\":-0.124,\"y\":0.0336},{\"x\":-0.1285,\"y\":0.033},{\"x\":-0.133,\"y\":0.0325},{\"x\":-0.1374,\"y\":0.032},{\"x\":-0.1419,\"y\":0.0316},{\"x\":-0.1463,\"y\":0.0312},{\"x\":-0.1508,\"y\":0.0309},{\"x\":-0.1553,\"y\":0.0306},{\"x\":-0.1598,\"y\":0.0304},{\"x\":-0.1643,\"y\":0.0303},{\"x\":-0.1688,\"y\":0.0302},{\"x\":-0.1734,\"y\":0.0301},{\"x\":-0.178,\"y\":0.0301},{\"x\":-0.1826,\"y\":0.0301},{\"x\":-0.1872,\"y\":0.0302},{\"x\":-0.1919,\"y\":0.0302},{\"x\":-0.1965,\"y\":0.0301},{\"x\":-0.2012,\"y\":0.03},{\"x\":-0.2058,\"y\":0.0298},{\"x\":-0.2103,\"y\":0.0295},{\"x\":-0.2148,\"y\":0.029},{\"x\":-0.2193,\"y\":0.0284},{\"x\":-0.2237,\"y\":0.0277},{\"x\":-0.228,\"y\":0.0268},{\"x\":-0.2322,\"y\":0.0259},{\"x\":-0.2363,\"y\":0.0251}],\"minX\":-0.2363,\"maxX\":0.1071,\"minY\":0.4226,\"maxY\":0.0251,\"interX\":[],\"interY\":[{\"x\":0,\"y\":0.0846,\"symbol\":{\"text\":\"A\",\"x\":0,\"y\":0.0846}}],\"maxima\":[],\"minima\":[],\"colorIdx\":0}],\"freeSymbols\":[{\"text\":\"B\",\"x\":-0.4673,\"y\":0.4796},{\"text\":\"C\",\"x\":-0.4455,\"y\":0.4796},{\"text\":\"D\",\"x\":-0.4237,\"y\":0.4796},{\"text\":\"E\",\"x\":-0.4019,\"y\":0.4796}]}"}]},{"type":"content","encoding":"markdown","children":[],"value":"<div>\n  <h3 style=\"text-align: center\">If you would like to give any feedback, please <a ui-sref=\"contact({subject: 'Graph Sketcher'})\">contact us</a>.</h3>\n</div>\n","published":false,"tags":[]}],"published":true,"tags":["physics"],"level":0};
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
                "page": ["api", "$stateParams", function(api, _$stateParams) {
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
            onEnter: ["$state", function(_$state) {
                document.location.href = "/";
            }]
        });

        $sp.state('shareLink', {
            url: "/s/:shortCode",
            onEnter: ["$state", "$stateParams", "api", "$http", function($state, $stateParams, api, $http) {
                let redirectURL = "https://goo.gl/" + $stateParams.shortCode;

                api.logger.log({
                    type: "USE_SHARE_LINK",
                    shortCode: $stateParams.shortCode
                }).$promise.then(function () {
                    return $http.get("https://www.googleapis.com/urlshortener/v1/url", {params: {shortUrl: redirectURL, key: 'AIzaSyBcVr1HZ_JUR92xfQZSnODvvlSpNHYbi4Y'}});
                }).then(function(response) {
                    if (response.data.status == "OK") {
                        let longUrl = response.data.longUrl;
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
            url: "/auth_error",
            params: {
                errorMessage: null,
                statusText: null,
            },
            views: {
                "body": {
                    templateUrl: "/partials/states/auth_error.html",
                    controller: "AuthErrorPageController",
                }
            }
        });

        $sp.state('teacherMentoringGcse', {
            url: "/teachermentoring_gcse",
            resolve: {
                requireRole: getRolePromiseInjectableFunction(["ADMIN", "EVENT_MANAGER", "CONTENT_EDITOR", "TEACHER"]),
                "page": ["api", function(api) {return api.pageFragments.get({id: 'teacher_mentoring_gcse_page_frag'}).$promise;}]
            },
            views: {
                "body": {
                    templateUrl: "/partials/states/generic_page.html",
                    controller: "GenericPageController"
                },
            },
        });
        $sp.state('teacherMentoringAlevel', {
            url: "/teachermentoring_alevel",
            resolve: {
                requireRole: getRolePromiseInjectableFunction(["ADMIN", "EVENT_MANAGER", "CONTENT_EDITOR", "TEACHER"]),
                "page": ["api", function(api) {return api.pageFragments.get({id: 'teacher_mentoring_alevel_page_frag'}).$promise;}]
            },
            views: {
                "body": {
                    templateUrl: "/partials/states/generic_page.html",
                    controller: "GenericPageController"
                },
            },
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
                        controller: "AdminStatsSummaryController",
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
            url: "/set_assignments?books",
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
                }).catch(function(_e) {
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
            let toHash = $location.hash();
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
