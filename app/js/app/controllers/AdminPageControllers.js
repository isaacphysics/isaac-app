/**
 * Copyright 2014 Ian Davies & Stephen Cummins
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

import angular from "angular";

export const PageController = ['$scope', 'auth', 'api', '$window', '$rootScope', '$interval', function($scope, _auth, api, _$window, $rootScope, _$interval) {
    $rootScope.pageTitle = "Admin Page";

    $scope.contentVersion = api.contentVersion.get();

    $scope.segueVersion = api.segueInfo.segueVersion();

    $scope.tagsUrl = api.getTagsUrl();
    $scope.unitsUrl = api.getUnitsUrl();
    $scope.swaggerUrl = api.getSwaggerUrl();

    $scope.isStaffUser = $rootScope.user.role == 'ADMIN' || $rootScope.user.role == 'EVENT_MANAGER';
    $scope.isAdminUser = $rootScope.user.role == 'ADMIN';
    
    $scope.setVersion = function() {
        $scope.versionChange = "IN_PROGRESS"
        api.contentVersion.set({version: $scope.contentVersion.liveVersion}, {}).$promise.then(function() {
            api.contentVersion.get().$promise.then(function(r) {
                $scope.contentVersion = r;
                $scope.versionChange = "SUCCESS";
                api.logger.log({
                    type : "CHANGE_CONTENT_VERSION",
                    contentVersion : $scope.contentVersion.liveVersion
                });
            });
        }).catch(function(e) {
            console.error(e);
            $scope.versionChange = "ERROR"
        });
    }
}];

export const AdminStatsSummaryController = ["$scope", "api", function($scope, api) {
    $scope.state = 'adminStats';

    $scope.asPercentage = function(value, total) {
        return value !== undefined ? Math.round(100 * value / total) : 0;
    };
    let addTotalToMapOfCounts = function(counts) {
        counts['TOTAL'] = Object.values(counts).reduce((a, b) => a + b, 0);
    };

    // general stats
    $scope.statistics = null;
    $scope.setLoading(true)
    api.statisticsEndpoint.get().$promise.then(function(result) {
        $scope.statistics = result;

        // Add total value to each of the active user ranges
        for (let timeRange in result.activeUsersOverPrevious) {
            addTotalToMapOfCounts(result.activeUsersOverPrevious[timeRange]);
        }
        // Add total value to each of the answered user ranges
        for (let timeRange in result.answeringUsersOverPrevious) {
            addTotalToMapOfCounts(result.answeringUsersOverPrevious[timeRange]);
        }
        addTotalToMapOfCounts(result.userGenders);
        addTotalToMapOfCounts(result.userSchoolInfo)

        $scope.setLoading(false)
    });
    api.eventBookings.getAllBookings({
        "count_only": true
    }).$promise.then(function(result) {
        $scope.eventBookingsCount = result.count;
    })
}];

export const AdminStatsPageController = ['$scope', 'auth', 'api', '$window', '$rootScope', 'gameBoardTitles', '$timeout', 'dataToShow', function($scope, auth, api, $window, $rootScope, gameBoardTitles, $timeout, dataToShow) {
    $rootScope.pageTitle = "Statistics Page";

    $scope.contentVersion = api.contentVersion.get();
    $scope.userSearch = {};
    $scope.userSearch.searchTerms = "";

    $scope.isAdminUser = $rootScope.user.role == 'ADMIN';

    $scope.dataToShow = null;

    $scope.reverse = false;
    $scope.setLoading(true)
    dataToShow.$promise.then(function(result){
        $scope.dataToShow = JSON.parse(angular.toJson(result));
        $scope.setLoading(false);
    })
}];

export const AnalyticsPageController = ['$scope', 'api',  '$rootScope', function($scope, api, $rootScope) {
    $rootScope.pageTitle = "Analytics Page";

    $scope.isAdminUser = $rootScope.user.role == 'ADMIN';

    $scope.reverse = false;
    $scope.setLoading(1); // making 1 async calls below.

    $scope.map = { center: { latitude: 53.670680, longitude: -1.582031 }, zoom: 5 };
    $scope.locations = []

    $scope.locationDates = {
        defaultStart: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        defaultEnd: new Date()
    };
    $scope.customLocationDates = false;
    
    $scope.getLocationData = function(){
        $scope.customLocationDates = false; // hide the input boxes
        $scope.setLoading(true);
        // If start and end dates from inputs are correctly formatted; use them, else use defaults:
        let startDate = new Date($scope.locationDates.start ? $scope.locationDates.start : $scope.locationDates.defaultStart).getTime();
        let endDate = new Date($scope.locationDates.end ? $scope.locationDates.end : $scope.locationDates.defaultEnd).getTime();

        api.statisticsEndpoint.getUserLocations({from_date:startDate, to_date:endDate}).$promise.then(function(result){
            for(let i = 0; i < result.length; i++) {
                result[i].id = i;
            }

            $scope.locations = result;
            $scope.setLoading(false);
        });             
    }

    $scope.customiseLocationDates = function(){
        // Show the extra input boxes
        $scope.locationDates.start = $scope.locationDates.defaultStart;
        $scope.locationDates.end = $scope.locationDates.defaultEnd;
        $scope.customLocationDates = true;
    }
        
    // start and end dates for line graphs
    let dataStartDate = new Date(new Date().setYear(new Date().getFullYear() - 1)); //set it to a year ago
    dataStartDate = dataStartDate.getTime();
    let dataEndDate = new Date().getTime();
    $scope.editingGraph = true;
    $scope.eventsSelected = {}
    $scope.questionsAnsweredOverTime = null;
    $scope.eventsAvailable = {};

    api.statisticsEndpoint.getLogEventTypes().$promise.then(function(result){
        $scope.eventsAvailable = JSON.parse(angular.toJson(result));
        $scope.setLoading(false);
    });
    
    $scope.updateGraph = function() {
        let eventsForGraph = [];
        for (let eventType in $scope.eventsSelected) {
            if ($scope.eventsSelected[eventType]) {
                eventsForGraph.push(eventType);
            }
        }
        
        if (eventsForGraph.length < 1) {
            return;
        }

        $scope.setLoading(true);
        $scope.editingGraph = false;
        api.statisticsEndpoint.getEventsOverTime({from_date: dataStartDate, to_date:dataEndDate, events:eventsForGraph.join(), bin_data:true}).$promise.then(function(result){
            if (result){
                $scope.questionsAnsweredOverTime = JSON.parse(angular.toJson(result));  
            }
            
            $scope.setLoading(false);
        });
    }

    $scope.getDownloadEventsOverTimeLink = function() {
        let eventsForGraph = [];
        for (let eventType in $scope.eventsSelected) {
            if ($scope.eventsSelected[eventType]) {
                eventsForGraph.push(eventType);
            }
        }

        if (eventsForGraph.length < 1) {
            return;
        }

        let url = api.makeDownloadEventsOverTimeLink(dataStartDate, dataEndDate, eventsForGraph, true);
        return url;
    }
}];

// TODO: This probably belongs in the events controller but for now as only staff can do it we will keep it here.
export const AdminEventBookingController = ['$scope', 'auth', 'api', '$window', '$rootScope','$location', '$anchorScroll', function($scope, auth, api, $window, $rootScope, $location, $anchorScroll) {
    $rootScope.pageTitle = "Admin Page";

    $scope.contentVersion = api.contentVersion.get();
    $scope.userSearch = {};
    $scope.userSearch.isLoading = false;
    $scope.userSearch.searchTerms = {role:"", email:"", familyName:""};

    $scope.isAdminUser = $rootScope.user.role == 'ADMIN' || $rootScope.user.role == 'EVENT_MANAGER';

    $scope.hasSearched = false;
    $scope.events = [];

    $scope.bookings = [];
    $scope.userBookings = [];
    $scope.eventIdForBooking = null;
    $scope.eventSelected = null;

    $scope.userIdToSchoolMapping = {}

    $scope.filterEventsByStatus = "FUTURE";
    $scope.overviewPanelVisible = true;
    $scope.attended = true;
    $scope.absent = false;

    $scope.filter = {}

    let updateEventOverviewList = function(queryParams){
        $rootScope.setLoading(true);
        api.eventOverview.get(queryParams).$promise.then(function(result) {
            $rootScope.setLoading(false);
            $scope.events = result.results;
        });         
    }

    $scope.$watch('filterEventsByStatus', function(newValue, _oldValue) {
        if (newValue) {
            let queryParams = {limit: -1, startIndex: 0}
            if (newValue !== 'ALL') {
                queryParams['filter'] = newValue;
            }
            updateEventOverviewList(queryParams);
        }
    });

    $scope.updateBookingInfo = function(eventId) {
        $scope.eventIdForBooking = eventId;
    }

    let updateBookingInfo = function(){
        api.eventBookings.getBookings({eventId: $scope.eventIdForBooking}).$promise.then(function(result){
            $scope.bookings = result;
            $scope.userBookings = [];

            angular.forEach($scope.bookings, function(booking, _key){
                $scope.userBookings.push(booking.userBooked.id);
            });

            if ($scope.userBookings.length > 0) {
                $scope.userIdToSchoolMapping = api.user.getUserIdSchoolLookup({"user_ids" : $scope.userBookings.join()})
            }
        })
    }

    $scope.goToTag = function(tagToGoTo) {
            $location.hash(tagToGoTo);
            $anchorScroll();
    };

    $scope.$watch('eventIdForBooking', function(){
        if ($scope.eventIdForBooking) {
            updateBookingInfo();
            api.events.get({id:$scope.eventIdForBooking}).$promise.then(function(value){
                $scope.eventSelected = value;
                $scope.goToTag('event-booking-details');
            });
        }           
    })

    $scope.findUsers = function() {
        // This function is only used for event booking user searches:
        if ($scope.userSearch.searchTerms != "") {
            let role = $scope.userSearch.searchTerms.role;

            if ($scope.userSearch.searchTerms.role == "" || $scope.userSearch.searchTerms.role == "NO_ROLE") {
                role = null;
            }

            $scope.userSearch.isLoading = true;
            api.adminUserSearch.search({'familyName' : $scope.userSearch.searchTerms.familyName, 'email' : $scope.userSearch.searchTerms.email, 'role' : role}).$promise.then(function(result){
                $scope.userSearch.results = result;
                $scope.userSearch.isLoading = false;
            });

            $scope.userSearch.hasSearched = true;
        }
    }

    $scope.targetUser = null;
    $scope.additionalInformation = {}
    $scope.sortPredicate = 'date';
    $scope.reverse = true;

    $scope.chooseUserForEvent = function(user) {
        $scope.targetUser = user;
        $scope.modals.eventBookingModal.show()
    }

    $scope.bookUserOnEvent = function(eventId, userId, additionalInformation) {
        if ($scope.additionalInformation.authorisation == undefined || ($scope.additionalInformation.authorisation == 'OTHER' && $scope.additionalInformation.authorisationOther == undefined)) {
            $scope.showToast($scope.toastTypes.Failure, "Event Booking Failed", "You must provide an authorisation reason to complete this request.");              
            return;
        }

        api.eventBookings.makeBooking({"eventId": eventId, "userId" : userId}, additionalInformation).$promise.then(function(booking){
            updateBookingInfo();
            $scope.modals.eventBookingModal.hide()
            $scope.showToast($scope.toastTypes.Success, booking.bookingStatus + " Booking Created", "The user now has a " + booking.bookingStatus + " booking");
        })
        .catch(function(e){
                console.log("error:", e)
                $scope.showToast($scope.toastTypes.Failure, "Event Booking Failed", e.data.errorMessage != undefined ? e.data.errorMessage : "");
        });
    }

    $scope.addToWaitingList = function(eventId, userId) {
        api.eventBookings.addToWaitingList({"eventId": eventId, "userId" : userId}).$promise.then(function(){
            updateBookingInfo();
        })          
        .catch(function(e){
                console.log("error:", e)
                $scope.showToast($scope.toastTypes.Failure, "Event Booking Failed", e.data.errorMessage != undefined ? e.data.errorMessage : "");
        });
    }

    $scope.promoteBooking = function(eventId, userId) {
        let promote = $window.confirm('Are you sure you want to convert this to a confirmed booking?');   

        if (promote) {
            api.eventBookings.promoteFromWaitList({"eventId": eventId, "userId" : userId}).$promise.then(function(){
                updateBookingInfo();
            })
            .catch(function(e){
                console.log("error:", e)
                $scope.showToast($scope.toastTypes.Failure, "Event Booking Failed", e.data.errorMessage != undefined ? e.data.errorMessage : "");
            });             
        }
    }
    
    $scope.unbookUserFromEvent = function(eventId, userId) {
        let deleteBooking = $window.confirm('Are you sure you want to delete this booking permanently?');   

        if (deleteBooking) {
            api.eventBookings.deleteBooking({"eventId": eventId, "userId" : userId}).$promise.then(function(){
                updateBookingInfo();
            })
            .catch(function(e){
                console.log("error:", e)
                $scope.showToast($scope.toastTypes.Failure, "Event Booking Failed", e.data.errorMessage != undefined ? e.data.errorMessage : "");
            });
        }
    }

    $scope.cancelEventBooking = function(eventId, userId) {
        let cancelBooking = $window.confirm('Are you sure you want to cancel this booking?');   
        if (cancelBooking) {
            api.eventBookings.cancelBooking({"eventId": eventId, "userId" : userId}).$promise.then(function(){
                updateBookingInfo();
            })
            .catch(function(e){
                console.log("error:", e)
                $scope.showToast($scope.toastTypes.Failure, "Event Booking Failed", e.data.errorMessage != undefined ? e.data.errorMessage : "");
            });
        }
    }

    $scope.resendConfirmationEmail = function(eventId, userId) {
        let resendEmail = $window.confirm('Are you sure you want to resend the confirmation email for this booking?');   
        if (resendEmail) {
            api.eventBookings.resendConfirmation({"eventId": eventId, "userId" : userId}).$promise.then(function(){
                $scope.showToast($scope.toastTypes.Success, "Event Email Sent", "Email send to user " + userId);
            })
            .catch(function(e){
                console.log("error:" + e)
                $scope.showToast($scope.toastTypes.Failure, "Event Email Failed", e.data.errorMessage != undefined ? e.data.errorMessage : "");
            });
        }
    }

    $scope.recordEventAttendance = function(eventId, userId, attended) {
        api.eventBookings.recordEventAttendance({eventId: eventId, userId: userId, attended: attended}).$promise.then(function(){
            updateBookingInfo();
        })
        .catch(function(e){
            console.log("error:", e)
            $scope.showToast($scope.toastTypes.Failure, "Failed to Record Attendance", e.data.errorMessage != undefined ? e.data.errorMessage : "");
        });
    }

    $scope.canTakeEventAttendance = function(eventDate) {
        let endOfToday = new Date().setHours(23,59,59,999);
        return eventDate <= endOfToday;
    }

    $scope.attendanceSymbol = function(bookingStatus) {
        let symbolMap = {
            ATTENDED: '✔️',
            ABSENT: '❌'
        }
        return symbolMap.hasOwnProperty(bookingStatus) ? symbolMap[bookingStatus] : "";
    }
}];
