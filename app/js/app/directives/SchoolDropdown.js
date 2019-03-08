/**
 * Copyright 2014 Ian Davies
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
define(["/partials/school_dropdown.html"], function(templateUrl) {

    return ["api", "$timeout", function(api, $timeout) {

        return {
            scope: {
                selectedSchoolUrn: "=",
            },

            templateUrl: templateUrl,

            restrict: "A",

            link: function(scope, _element, _attrs) {
                scope.searchText = "";
                scope.selection = {};
                // Load the initially selected school, if there is one.

                scope.$watch("selectedSchoolUrn", function(newUrn, _oldUrn) {
                    if (newUrn) {
                        api.schools.query({urn: newUrn}).$promise.then(function(s) {
                            if (s.length >= 1) {
                                scope.selection.school = s[0];
                            } else {
                                scope.selectedSchoolUrn = null;
                            }
                        });
                    }
                });
                     
            

                // When the search text changes to something longer than 2 chars, search school.
                // timer for the search box to minimise number of requests sent to api
                let timer = null;
                let searchSchools = function() {
                    scope.searchResults = api.schools.query({query: scope.searchText});
                }
                scope.$watch("searchText", function(newText) {
                    if (timer) {
                        $timeout.cancel(timer);
                        timer = null;
                    }

                    if (newText.length % 5 == 3) {
                        // Search every 5th character
                        searchSchools();
                    } else if (newText.length > 2) {
                        // Else only search after they stop typing.
                        timer = $timeout(function() {searchSchools()}, 500);
                    } else {
                        // We don't have enough text. Clear search results.
                        scope.searchResults = [];
                    }
                })

                scope.$watch("selection.school", function(newSchool, oldSchool) {
                    if (newSchool === oldSchool)
                        return; // Init

                    if (newSchool) {
                        scope.selectedSchoolUrn = newSchool.urn;
                        scope.searchText = '';
                    } else {
                        scope.selectedSchoolUrn = null;
                    }
                })
            },
        };
    }]
});