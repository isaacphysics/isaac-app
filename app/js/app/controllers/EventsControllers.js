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

    var augmentEvent = function(e, api) {
        e.expired = Date.now() > e.date;

        e.teacher = e.tags.indexOf("teacher") > -1;
        e.student = e.tags.indexOf("student") > -1;
        e.virtual =  e.tags.indexOf("virtual") > -1;

        e.field = e.tags.indexOf("physics") > -1 ? "physics" : (e.tags.indexOf("maths") > -1 ? "maths" : undefined);

        // we have to fix the event image url.
        if(e.eventThumbnail) {
            e.eventThumbnail.src = api.getImageUrl(e.eventThumbnail.src);
        }
    }

    var ListController = ['$scope', 'api', '$timeout', '$stateParams', function($scope, api, $timeout, $stateParams) {

        $timeout(function() {
            // Call this asynchronously, so that loading icon doesn't get immediately clobbered by $stateChangeSuccess.
            $scope.loadMore();
        });

        var startIndex = 0;
        var eventsPerPage = 6;
        var showActiveOnly = $stateParams.show_active_only ? $stateParams.show_active_only : false;
        var showInactiveOnly = $stateParams.show_inactive_only ? $stateParams.show_inactive_only : false;
        var filterEventsByType = null;

        var showByTag = null;

        $scope.filterEventsByStatus = "UPCOMING";
        $scope.filterEventsByType = "all";

        $scope.$watch('filterEventsByStatus + filterEventsByType', function(newValue, oldValue){
            if ($scope.filterEventsByStatus == "UPCOMING") {
                showActiveOnly = true;
                showInactiveOnly = false;
            } else {
                showActiveOnly = false;
                showInactiveOnly = false;
            }

            if ($scope.filterEventsByType == "all") {
                filterEventsByType = null;
            } else {
                filterEventsByType = $scope.filterEventsByType
            }

            startIndex = 0;
            $scope.events = [];
            $scope.loadMore()
        });

        $scope.events = [];
        $scope.loadMore = function() {
            $scope.globalFlags.isLoading = true;
            api.getEventsList(startIndex, eventsPerPage, showActiveOnly, showInactiveOnly, filterEventsByType).$promise.then(function(result) {
                $scope.globalFlags.isLoading = false;
                
                for(var i in result.results) {
                    var e = result.results[i];
                    augmentEvent(e, api);
                    $scope.events.push(e);
                }

                startIndex += result.results.length;

                if (startIndex >= result.totalResults) {
                    $scope.noMoreResults = true;
                }
            });
        }
    }];

    var DetailController = ['$scope', 'api', '$timeout', '$stateParams', '$state', function($scope, api, $timeout, $stateParams, $state) {
        var loaded = false;
        $timeout(function() {
            // Call this asynchronously, so that loading icon doesn't get immediately clobbered by $stateChangeSuccess.
            $scope.globalFlags.isLoading = !loaded;
        });

        $scope.event = api.events.get({id: $stateParams.id});

        $scope.event.$promise.then(function(e) {
            loaded = true;
            $scope.globalFlags.isLoading = false;

            augmentEvent(e, api);
        }).catch(function() {
            $scope.globalFlags.isLoading = false;
            $state.go('404', {target: $state.href("event", $stateParams)});
        });
    }];

    return {
        ListController: ListController,
        DetailController: DetailController,
    };
})