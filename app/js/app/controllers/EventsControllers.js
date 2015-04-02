/**
 * Copyright 2015 Ian Davies
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
define([], function() {

    var ListController = ['$scope', 'api', '$timeout', function($scope, api, $timeout) {

        $timeout(function() {
            // Call this asynchronously, so that loading icon doesn't get immediately clobbered by $stateChangeSuccess.
            $scope.loadMore();
        });

        var startIndex = 0;
        var eventsPerPage = 6;
        $scope.events = [];


        $scope.loadMore = function() {
            $scope.globalFlags.isLoading = true;
            api.getEventsList(startIndex, eventsPerPage).$promise.then(function(result) {
                $scope.globalFlags.isLoading = false;
                
                for(var i in result.results) {
                    var e = result.results[i];
                    e.expired = Date.now() > e.date;

                    e.teacher = e.tags.indexOf("teacher") > -1;
                    e.student = e.tags.indexOf("student") > -1;
                    e.virtual = e.tags.indexOf("virtual") > -1;

                    $scope.events.push(e);
                }

                startIndex += result.results.length;

                if (startIndex >= result.totalResults) {
                    $scope.noMoreResults = true;
                }
            });
        }
    }];

    var DetailController = ['$scope', 'auth', 'api', 'tags', '$stateParams', '$timeout', function($scope, auth, api, tags, $stateParams, $timeout) {

        $timeout(function() {
            // Call this asynchronously, so that loading icon doesn't get immediately clobbered by $stateChangeSuccess.
            $scope.globalFlags.isLoading = true;
        });

    }];

    return {
        ListController: ListController,
        DetailController: DetailController,
    };
})