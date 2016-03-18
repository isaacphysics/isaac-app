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
        if (e.endDate != null) {  // Non-breaking change; if endDate not specified, behaviour as before
            e.all_day = e.endDate - e.date >= 24*3600*1000;  // If start and end times 24 hours apart; assume an all day event
            e.expired = Date.now() > e.endDate;
            e.inProgress =  (e.date <= Date.now()) && (Date.now() <= e.endDate);
        } else {
            e.expired = Date.now() > e.date;
            e.inProgress =  false;
            e.all_day = false;
        }

        e.teacher = e.tags.indexOf("teacher") > -1;
        e.student = e.tags.indexOf("student") > -1;
        e.virtual =  e.tags.indexOf("virtual") > -1;

        e.field = e.tags.indexOf("physics") > -1 ? "physics" : (e.tags.indexOf("maths") > -1 ? "maths" : undefined);

        // we have to fix the event image url.
        if(e.eventThumbnail && e.eventThumbnail.src) {
            e.eventThumbnail.src = api.getImageUrl(e.eventThumbnail.src);
        } else {
            if (e.eventThumbnail == null) {
                e.eventThumbnail = {};
            }

            e.eventThumbnail.src = 'http://placehold.it/500x276';
            e.eventThumbnail.altText = 'placeholder image.';
        }
    }

    var toTitleCase = function toTitleCase(str) {
        return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    }

    var ListController = ['$scope', 'api', '$timeout', '$stateParams', '$location', function($scope, api, $timeout, $stateParams, $location) {

        var startIndex = 0;
        var eventsPerPage = 6;
        var showActiveOnly = true;
        var showInactiveOnly = false;
        var filterEventsByType = null;

        var showByTag = null; // show only events with set tag


        $scope.filterEventsByType = "all";
        $scope.moreResults = false;
        $scope.toTitleCase = toTitleCase;

        if($stateParams.event_status == "all") {
            $scope.filterEventsByStatus = "all";
        } else {
            $scope.filterEventsByStatus = "upcoming";
        }

        if ($stateParams.types) {
            $scope.filterEventsByType = $stateParams.types
        }

        $scope.$watch('filterEventsByStatus + filterEventsByType', function(newValue, oldValue){
            if ($scope.filterEventsByStatus == "upcoming") {
                showActiveOnly = true;
                showInactiveOnly = false;
                $location.search('event_status', null); // This is currently the default; don't need to set it.
            } else {
                showActiveOnly = false;
                showInactiveOnly = false;
                $location.search('event_status', 'all');
            }

            if ($scope.filterEventsByType == "all") {
                filterEventsByType = null;
                $location.search('types', null); // This is currently the default; don't need to set it.
            } else {
                filterEventsByType = $scope.filterEventsByType
                $location.search('types', filterEventsByType);
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
            $scope.setLoading(true);
            api.getEventsList(startIndex, eventsPerPage, showActiveOnly, showInactiveOnly, filterEventsByType).$promise.then(function(result) {
                $scope.setLoading(false);
                
                for(var i in result.results) {
                    var e = result.results[i];
                    augmentEvent(e, api);
                    $scope.events.push(e);
                }

                startIndex += result.results.length;

                if (startIndex >= result.totalResults) {
                    $scope.moreResults = false;
                } else {
                    $scope.moreResults = true;
                }
            });
        }
    }];

    var DetailController = ['$scope', 'api', '$timeout', '$stateParams', '$state', '$filter', function($scope, api, $timeout, $stateParams, $state, $filter) {
        $scope.setLoading(true);

        $scope.toTitleCase = toTitleCase;

        $scope.jsonLd = {};

        api.events.get({id: $stateParams.id}).$promise.then(function(e) {
            $scope.setLoading(false);
            
            // usage instructions defined at - https://developers.google.com/structured-data/rich-snippets/events
            $scope.jsonLd = {
              "@context" : "http://schema.org",
              "@type" : "EducationEvent",
              "name" : e.title,
              "description" : e.subtitle,
              "startDate" : $filter('date')(e.date, 'yyyy-MM-ddTH:mm'),
              "offers" : {
                "price":"0.00",
                "priceCurrency": "GBP",
                "url" : "https://isaacphysics.org/events/" + e.id
              }
            }

            if (e.location) {
                $scope.jsonLd["location"] = {
                    "@type": "Place",
                    "name": e.location.addressLine1,
                    "address": {
                        "name": e.location.addressLine1,
                        "streetAddress": e.location.addressLine2,
                        "addressLocality": e.location.town,
                        "postalCode": e.location.postalCode,
                        "addressCountry": "GB"
                    }
                }
            }

            augmentEvent(e, api);

            $scope.event = e;
        }).catch(function() {
            $scope.setLoading(false);
            $state.go('404', {target: $state.href("event", $stateParams)});
        });        
    }];

    return {
        ListController: ListController,
        DetailController: DetailController,
    };
})