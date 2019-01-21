/**
 * Copyright 2014 Stephen Cummins
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
define(["../services/SearchResults.js"], function(SearchResults) {
    let defaultSearchOptions = {query: "", typesToInclude: [], includeConcepts: true, includeQuestions: true};
    let actualResponse = [];

    let doSearch = function(api, query, typesToInclude, $location) {
        if (query) {
            actualResponse = SearchResults.shortcuts(query);
            var response = api.searchEndpoint.search({searchTerms: query, types: typesToInclude});
            $location.search({query: query, types: typesToInclude.join(",")});
            return response;        
        }
    }

    let changeTypeState = function(modelName, typeName, _api, _query, typesToInclude, _$location) {
        let index = typesToInclude.indexOf(typeName);
        if(modelName && index == -1){
            typesToInclude.push(typeName);
        } else if(!modelName && index != -1){
            typesToInclude.splice(index, 1);
        }
    }

    let PageController = ['$scope', '$state', '$timeout', '$location', '$rootScope', 'api', 'query', 'types', 'pageIndex', function($scope, $state, $timeout, $location, $rootScope, api, query, types, _pageIndex) {
        let conceptPage = "isaacConceptPage";
        let questionPage = "isaacQuestionPage";
        $scope.isStaffUser = ($scope.user._id && ($scope.user.role == 'ADMIN' || $scope.user.role == 'EVENT_MANAGER' || $scope.user.role == 'CONTENT_EDITOR' || $scope.user.role == 'STAFF'));

        let filterResult = function(r) {
            let keepElement = (r.id != "_regression_test_" && (!r.tags || r.tags.indexOf("nofilter") < 0 && !r.supersededBy));
            return keepElement || $scope.isStaffUser;
        }

        $rootScope.globalFlags.siteSearchOpen = false;
        $rootScope.pageTitle = "Search Results";
        // initialise scope
        $scope.models = defaultSearchOptions;
        $scope.models.query = query;
        $scope.models.typesToInclude = types;
        
        // Initialise model booleans with input from router (type)
        if ($scope.models.typesToInclude.length > 0){
            $scope.models.includeConcepts = ($scope.models.typesToInclude.indexOf(conceptPage) != -1 ? true : false);
            $scope.models.includeQuestions =  ($scope.models.typesToInclude.indexOf(questionPage) != -1 ? true : false);
        } else {
            if ($scope.models.includeConcepts) {
                $scope.models.typesToInclude.push(conceptPage);
            }
            if ($scope.models.includeQuestions) {
                $scope.models.typesToInclude.push(questionPage);
            }
        }

        let timer = null;
        $scope.$watch('models.query', function() { 
            if (timer) {
                $timeout.cancel(timer);
                timer = null;
            }

            timer = $timeout(function() {
                $scope.response = doSearch(api, $scope.models.query, $scope.models.typesToInclude, $location, $scope);
            }, 800);
        });

        $scope.$watch('models.includeConcepts', function(newVal, oldVal) {
            if (newVal === oldVal) return;
            changeTypeState($scope.models.includeConcepts, conceptPage, api, $scope.models.query, $scope.models.typesToInclude, $location);
            $scope.response = doSearch(api, $scope.models.query, $scope.models.typesToInclude, $location, $scope);
        });

        $scope.$watch('models.includeQuestions', function(newVal, oldVal) {
            if (newVal === oldVal) return;
            changeTypeState($scope.models.includeQuestions, questionPage, api, $scope.models.query, $scope.models.typesToInclude, $location);
            $scope.response = doSearch(api, $scope.models.query, $scope.models.typesToInclude, $location, $scope);
        });

        $scope.$watch('response.results', function(results) {
            if ($scope.response && results) {
                if (!(actualResponse === undefined || actualResponse.length == 0)) {
                    var new_res = actualResponse; 
                    var con_arr = new_res.concat(results);
                    results = con_arr;
                    actualResponse = [];
                }
                $scope.response.filteredResults = results ? results.filter(filterResult) : [];
            }   
        });
        
        // this converts a summary object type to a known state.
        $scope.mapTypeToState = function(summaryObject) {
            if (summaryObject.type === conceptPage) {
                return "concept";
            } else if (summaryObject.type === questionPage) {
                return "question";
            }
        }    
    }]

    let GlobalSearchController = ['$scope', '$state', '$timeout', '$location', '$rootScope', 'api', function($scope, $state, $timeout, $location, $rootScope, api) {
        let conceptPage = "isaacConceptPage";
        let questionPage = "isaacQuestionPage";

        // initialise scope
        $scope.models = defaultSearchOptions;

        $scope.$watch('models.includeConcepts', function(newVal, oldVal) {
            if (newVal === oldVal) return;
            $scope.response = changeTypeState($scope.models.includeConcepts, conceptPage, api, $scope.models.query, $scope.models.typesToInclude, $location);
        });

        $scope.$watch('models.includeQuestions', function(newVal, oldVal) {
            if (newVal === oldVal) return;
            $scope.response = changeTypeState($scope.models.includeQuestions, questionPage, api, $scope.models.query, $scope.models.typesToInclude, $location);
        });

        $scope.triggerSearch = function() {
            $rootScope.globalFlags.siteSearchOpen = false;
            if(!$state.includes('searchResults')) {
                $state.go('searchResults', {query: $scope.models.query, types: $scope.models.typesToInclude});
            }
        }

        $scope.hideMobileSearchForm = function() {
            // Hide mobile search form if shown
            // TODO: Find a better place for this, or just angularize the entire mobile search form
            if ($("#mobile-search-form").hasClass('ru-drop-show')) {
                $("#mobile-search-form").ruDropDownToggle();
            }
        }
    }];

    return {
        PageController: PageController,
        GlobalSearchController: GlobalSearchController,
    };
})