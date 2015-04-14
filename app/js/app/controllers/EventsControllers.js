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
        } else {
            e.eventThumbnail.src = 'http://placehold.it/500x276';
            e.eventThumbnail.altText = 'placeholder image.';
        }
    }

    var toTitleCase = function toTitleCase(str) {
        return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    }

    var ListController = ['$scope', 'api', '$timeout', '$stateParams', function($scope, api, $timeout, $stateParams) {

        var startIndex = 0;
        var eventsPerPage = 6;
        var showActiveOnly = $stateParams.show_active_only ? $stateParams.show_active_only : false;
        var showInactiveOnly = $stateParams.show_inactive_only ? $stateParams.show_inactive_only : false;
        var filterEventsByType = null;

        var showByTag = null;

        $scope.filterEventsByStatus = "UPCOMING";
        $scope.filterEventsByType = "all";

        $scope.toTitleCase = toTitleCase;

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
            $timeout(function() {
                // Call this asynchronously, so that loading icon doesn't get immediately clobbered by $stateChangeSuccess.
                $scope.loadMore();
            });
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
                } else {
                    $scope.noMoreResults = false;
                }
            });
        }
    }];

    var DetailController = ['$scope', 'api', '$timeout', '$stateParams', '$state', '$filter', function($scope, api, $timeout, $stateParams, $state, $filter) {
        var loaded = false;
        $timeout(function() {
            // Call this asynchronously, so that loading icon doesn't get immediately clobbered by $stateChangeSuccess.
            $scope.globalFlags.isLoading = !loaded;
        });

        $scope.event = api.events.get({id: $stateParams.id});
        
        $scope.toTitleCase = toTitleCase;

        $scope.jsonLd = {};

        $scope.event.$promise.then(function(e) {
            loaded = true;
            $scope.globalFlags.isLoading = false;
            
            // usage instructions defined at - https://developers.google.com/structured-data/rich-snippets/events
            $scope.jsonLd = {
              "@context" : "http://schema.org",
              "@type" : "EducationEvent",
              "name" : e.title,
              "description" : e.subtitle,
              "startDate" : $filter('date')(e.date, 'yyyy-MM-ddTH:mm'),
              "location" : {
                "@type": "Place",
                "name": e.location.addressLine1,
                "address": {
                    "name": e.location.addressLine1,
                    "streetAddress": e.location.addressLine2,
                    "addressLocality": e.location.town,
                    "postalCode": e.location.postalCode,
                    "addressCountry": "GB"
                }
              },
              "offers" : {
                "price":"0.00",
                "priceCurrency": "GBP",
                "url" : "https://isaacphysics.org/events/" + e.id
              }
            }

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