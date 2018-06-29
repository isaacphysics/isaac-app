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

    let augmentEvent = function(e, api) {
        if (e.endDate != null) {  // Non-breaking change; if endDate not specified, behaviour as before
            e.multiDay = new Date(e.date).toDateString() != new Date(e.endDate).toDateString();
            e.expired = Date.now() > e.endDate;
            e.inProgress =  (e.date <= Date.now()) && (Date.now() <= e.endDate);
        } else {
            e.expired = Date.now() > e.date;
            e.inProgress =  false;
            e.multiDay = false;
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

    let toTitleCase = function toTitleCase(str) {
        return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    }

    let ListController = ['$scope', 'api', '$timeout', '$stateParams', '$location', function($scope, api, $timeout, $stateParams, $location) {

        let startIndex = 0;
        let eventsPerPage = 6;
        let showActiveOnly = true;
        let showInactiveOnly = false;
        let filterEventsByType = null;
        let showBookedOnly = false;

        let showByTag = null; // show only events with set tag

        $scope.filterEventsByType = "all";
        $scope.moreResults = false;
        $scope.toTitleCase = toTitleCase;

        if($stateParams.event_status == "all") {
            $scope.filterEventsByStatus = "all";
        } else {
            $scope.filterEventsByStatus = "upcoming";
        }

        if ($stateParams.show_booked_only == "true") {
            $scope.filterEventsByStatus = "showBookedOnly"
        }

        if ($stateParams.types) {
            $scope.filterEventsByType = $stateParams.types
        }

        $scope.$watch('filterEventsByStatus + filterEventsByType', function(newValue, oldValue){
            if ($scope.filterEventsByStatus == "showBookedOnly") {
                showActiveOnly = false;
                showInactiveOnly = false;
                showBookedOnly = true;
                $location.search('event_status', null);
                $location.search('show_booked_only', 'true');   
            } else if ($scope.filterEventsByStatus == "upcoming") {
                showActiveOnly = true;
                showInactiveOnly = false;
                showBookedOnly = false;
                $location.search('event_status', null); // This is currently the default; don't need to set it.
                $location.search('show_booked_only', null);
            } else {
                showActiveOnly = false;
                showInactiveOnly = false;
                showBookedOnly = false;
                $location.search('event_status', 'all');
                $location.search('show_booked_only', null); 
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
                $scope.loadMap();
            });
        });

        $scope.events = [];
        $scope.eventPopup = {};

        $scope.map = {
            center: {latitude: 54.5, longitude: -2},//{ latitude: 53.670680, longitude: -1.582031 },
            zoom: 5,
            window: {
                marker:{},
                show: false,
                closeClick: function() {this.show = false;},
                options: {}
            },
            options: {
                minZoom: 5,
                maxZoom: 15,
                streetViewControl: false,
            }
        };
        $scope.locations = [];
        $scope.typeEvents = {
                click: function(cluster, clusterModel) {
                    $scope.map.window.model = cluster.model;
                    $scope.eventPopup = cluster.model;
                    $scope.map.window.show = true;
                },
        };

        $scope.loadMap = function() {
            api.eventMapData.get({"limit":-1, "startIndex": 0, "showActiveOnly": showActiveOnly, "tags": filterEventsByType}).$promise.then(function(result) {
                $scope.locations = result.results;
            });
        }


        $scope.loadMore = function() {
            $scope.setLoading(true);
            api.getEventsList(startIndex, eventsPerPage, showActiveOnly, showInactiveOnly, filterEventsByType, showBookedOnly).$promise.then(function(result) {
                $scope.setLoading(false);
                
                for(let i in result.results) {
                    let e = result.results[i];
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

    let DetailController = ['$scope', 'api', '$timeout', '$stateParams', '$state', '$filter', '$window', '$q', function($scope, api, $timeout, $stateParams, $state, $filter, $window, $q) {
        $scope.setLoading(true);

        $scope.toTitleCase = toTitleCase;

        $scope.jsonLd = {};

        $scope.bookingFormOpen = false;

        $scope.additionalInformation = {}

        $scope.isStaffUser = ($scope.user._id && ($scope.user.role == 'ADMIN' || $scope.user.role == 'EVENT_MANAGER' || $scope.user.role == 'CONTENT_EDITOR' || $scope.user.role == 'STAFF'));

        $scope.school = {"schoolOther" : $scope.user.schoolOther, "schoolId": $scope.user.schoolId};

        $scope.verifyEmailRequestSent = false;

        $scope.targetUser = $scope.user;

        // validate pre-requisites for event booking
        let validUserProfile = function() {

            if (($scope.school.schoolOther == null || $scope.school.schoolOther == "") && $scope.school.schoolId == null) {
                $scope.showToast($scope.toastTypes.Failure, "School Information Required", "You must enter a school in order to book on to this event.");
                return false;
            }

            // validation for users / forms that indicate the booker is not a teacher
            if ($scope.user.role == 'STUDENT' && !($scope.additionalInformation.yearGroup == 'TEACHER' || $scope.additionalInformation.yearGroup == 'OTHER')) {
                if (!$scope.additionalInformation.yearGroup) {
                    $scope.showToast($scope.toastTypes.Failure, "Year Group Required", "You must enter a year group to proceed.");
                    return false;   
                }
                
                if (!event.virtual) {
                    if (!$scope.additionalInformation.emergencyName || !$scope.additionalInformation.emergencyNumber){
                        $scope.showToast($scope.toastTypes.Failure, "Emergency Contact Details Required", "You must enter a emergency contact details in order to book on to this event.");
                        return false;   
                    }                        
                }
            }
            
            // validation for users that are teachers
            if ($scope.user.role != 'STUDENT') {
                if (!$scope.additionalInformation.jobTitle) {
                    $scope.showToast($scope.toastTypes.Failure, "Job Title Required", "You must enter a job title to proceed.");
                    return false;   
                } 
            }

            return true;
        }

        let updateUserProfile = function() {
            let promise = null;

            if($scope.school.schoolId != $scope.user.schoolId || $scope.school.schoolOther != $scope.user.schoolOther) {
                
                // populate changes to user model
                $scope.user.schoolId = $scope.school.schoolId;            
                $scope.user.schoolOther = $scope.school.schoolOther;            

                // TODO: this is a nasty hack, but unfortunately the existing endpoint expects this random wrapped object now.
                let userSettings = {
                    registeredUser : $scope.user,
                    emailPreferences : {}
                }

                promise = api.account.saveSettings(userSettings).$promise
                                
            } else {
                // just return a resolved promise.
                promise = $q.when([]);
            }

            return promise; 
        }

        $scope.requestBooking = function(){
            if (!validUserProfile()) {
                return;
            }

            updateUserProfile().then(function(){
                    api.eventBookings.requestBooking({"eventId": $stateParams.id}, $scope.additionalInformation).$promise.then(function(){
                    getEventDetails();
                    $scope.showToast($scope.toastTypes.Success, "Event Booking Confirmed", "You have been successfully booked on to this event.");
                }).catch(function(e){
                    console.log("error:" + e)
                    $scope.showToast($scope.toastTypes.Failure, "Event Booking Failed", e.data.errorMessage != undefined ? e.data.errorMessage : "");
                }); 
            })
        }

        $scope.addToWaitingList = function(){
            if (!validUserProfile()) {
                return;
            }
            
            updateUserProfile().then(function(){
                api.eventBookings.addToWaitingList({"eventId": $stateParams.id}, $scope.additionalInformation).$promise.then(function(){
                    getEventDetails();
                    $scope.showToast($scope.toastTypes.Success, "Waiting List Booking Confirmed", "You have been successfully added to the waiting list for this event.");
                }).catch(function(e){
                    console.log("error:" + e)
                    $scope.showToast($scope.toastTypes.Failure, "Event Booking Failed", e.data.errorMessage != undefined ? e.data.errorMessage : "");
                });
            })

        }

        $scope.cancelEventBooking = function(){
            let cancel = $window.confirm('Are you sure you want to cancel your booking on this event. You may not be able to re-book, especially if there is a waiting list.');   
            if(cancel) {
                api.eventBookings.cancelMyBooking({"eventId": $stateParams.id}).$promise.then(function(){
                    getEventDetails();
                    $scope.showToast($scope.toastTypes.Success, "Your booking has been cancelled", "Your booking has successfully been cancelled.");
                }).catch(function(e){
                    console.log("error:" + e)
                    $scope.showToast($scope.toastTypes.Failure, "Event Booking Cancellation Failed", e.data.errorMessage != undefined ? e.data.errorMessage : "");
                });                
            }
        }

        $scope.googleCalendarTemplate =  function() {
            // https://calendar.google.com/calendar/event?action=TEMPLATE&text=[event_name]&dates=[start_date as YYYYMMDDTHHMMSS or YYYYMMDD]/[end_date as YYYYMMDDTHHMMSS or YYYYMMDD]&details=[extra_info]&location=[full_address_here]
            let eventDetails = $scope.jsonLd;
            let startDate = eventDetails.startDate.replace(/(\d{4})-(\d{2})-(\d{2})T(\d{1,2}):(\d{2})/, '$1$2$3T$4$500');
            let address = 'location' in eventDetails ? [eventDetails.location.name, eventDetails.location.address.streetAddress, eventDetails.location.address.addressLocality, eventDetails.location.address.postalCode] : [];

            let calendarTemplateUrl = [
                "https://calendar.google.com/calendar/event?action=TEMPLATE",
                "text=" + encodeURI(eventDetails.name),
                "dates=" + encodeURI(startDate) + '/' + encodeURI(startDate),
                "details=" + encodeURI(eventDetails.description),
                "location=" + encodeURI(address.join(', '))
            ];

            window.open(calendarTemplateUrl.join('&'),'_blank');
        }

        let getEventDetails = function() {
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

                if (e.location && e.location.address) {
                    $scope.jsonLd["location"] = {
                        "@type": "Place",
                        "name": e.location.address.addressLine1,
                        "address": {
                            "name": e.location.address.addressLine1,
                            "streetAddress": e.location.address.addressLine2,
                            "addressLocality": e.location.address.town,
                            "postalCode": e.location.address.postalCode,
                            "addressCountry": "GB"
                        }
                    }
                }
                
                if (e.bookingDeadline) {
                    $scope.bookingDeadlinePast = new Date(e.bookingDeadline) < new Date();    
                } else {
                    // if no booking deadline set use end date.
                    $scope.bookingDeadlinePast = new Date(e.date) < new Date();
                }

                // default year group drop down for teachers.
                if ($scope.user.role == 'TEACHER') {
                    $scope.additionalInformation.yearGroup = 'TEACHER'
                }

                if (e.tags.indexOf('teacher') != -1 && ($scope.user.role == 'STUDENT')) {
                    $scope.compatibleRole = false;
                } else {
                    $scope.compatibleRole = true;
                }

                augmentEvent(e, api);
                $scope.event = e;
            }).catch(function() {
                $scope.setLoading(false);
                $state.go('404', {target: $state.href("event", $stateParams)});
            });            
        }  
        
        getEventDetails();

    }];

    return {
        ListController: ListController,
        DetailController: DetailController,
    };
})