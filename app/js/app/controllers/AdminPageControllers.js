/**
 * Copyright 2014 Ian Davies & Stephen Cummins
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at
 * 		http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
define([], function() {

	var PageController = ['$scope', 'auth', 'api', '$window', '$rootScope', '$interval', function($scope, auth, api, $window, $rootScope, $interval) {
		$rootScope.pageTitle = "Admin Page";

		$scope.contentVersion = api.contentVersion.get();

		$scope.indexQueue = null;
		$scope.segueVersion = api.segueInfo.segueVersion();
		$scope.cachedVersions = api.segueInfo.cachedVersion();
		var updateIndexerQueue = function(){
			api.contentVersion.currentIndexQueue().$promise.then(function(result){
				$scope.indexQueue = result;		
			});
		}
		
		updateIndexerQueue();

		var indexQueueInterval = $interval(updateIndexerQueue, 30000)
		$scope.clearIndexQueue = function(){
			api.contentVersion.emptyIndexQueue().$promise.then(function(result){
				$scope.indexQueue = result;
			});
		}

		$scope.$on("$destroy", function() {
	        if (indexQueueInterval) {
	            $interval.cancel(indexQueueInterval);
	        }
	    });

		$scope.schoolOtherEntries = api.schools.getSchoolOther();
		$scope.tagsUrl = api.getTagsUrl();
		$scope.unitsUrl = api.getUnitsUrl();

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
		

	}]

	var AdminStatsPageController = ['$scope', 'auth', 'api', '$window', '$rootScope', 'gameBoardTitles', '$timeout', 'dataToShow', function($scope, auth, api, $window, $rootScope, gameBoardTitles, $timeout, dataToShow) {
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
		}]

	var AnalyticsPageController = ['$scope', 'api',  '$rootScope', function($scope, api, $rootScope) {
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
				var startDate = new Date($scope.locationDates.start ? $scope.locationDates.start : $scope.locationDates.defaultStart).getTime();
				var endDate = new Date($scope.locationDates.end ? $scope.locationDates.end : $scope.locationDates.defaultEnd).getTime();

				api.statisticsEndpoint.getUserLocations({from_date:startDate, to_date:endDate}).$promise.then(function(result){
					for(var i = 0; i < result.length; i++) {
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
			var dataStartDate = new Date(new Date().setYear(new Date().getFullYear() - 1)); //set it to a year ago
			dataStartDate = dataStartDate.getTime();
			var dataEndDate = new Date().getTime();
			$scope.editingGraph = true;
			$scope.eventsSelected = {}
			$scope.questionsAnsweredOverTime = null;
			$scope.eventsAvailable = {};

			api.statisticsEndpoint.getLogEventTypes().$promise.then(function(result){
				$scope.eventsAvailable = JSON.parse(angular.toJson(result));
				$scope.setLoading(false);
			});
			
			$scope.updateGraph = function() {
				var eventsForGraph = [];
				for (var eventType in $scope.eventsSelected) {
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
		}]		

	// TODO: This probably belongs in the events controller but for now as only staff can do it we will keep it here.
	var AdminEventBookingController = ['$scope', 'auth', 'api', '$window', '$rootScope','$location', '$anchorScroll', function($scope, auth, api, $window, $rootScope, $location, $anchorScroll) {
		$rootScope.pageTitle = "Admin Page";

		$scope.contentVersion = api.contentVersion.get();
		$scope.userSearch = {};
		$scope.userSearch.isLoading = false;
		$scope.userSearch.searchTerms = {role:"", email:"", familyName:""};

		$scope.isAdminUser = $rootScope.user.role == 'ADMIN' || $rootScope.user.role == 'EVENT_MANAGER';
		
		$scope.setLoading(true);

		$scope.hasSearched = false;
		$scope.events = [];

		$scope.bookings = [];
		$scope.userBookings = [];
		$scope.eventIdForBooking = null;
		$scope.eventSelected = null;

		$scope.userIdToSchoolMapping = {}

		$scope.showActiveOnly = true;
		$scope.filterEventsByStatus = "active";

		var updateEventOverviewList = function(){
			api.eventOverview.get({"limit":-1, "startIndex": 0, "showActiveOnly":$scope.showActiveOnly}).$promise.then(function(result) {
	                $scope.setLoading(false);
	                
					$scope.events = result.results;
	        });			
		}

		$scope.$watch('filterEventsByStatus', function(newValue, oldValue){
			if (newValue == "all") {
				$scope.showActiveOnly = false;	
			} else {
				$scope.showActiveOnly = true;	
			}
			
			updateEventOverviewList();
		});

		$scope.updateBookingInfo = function(eventId) {
			$scope.eventIdForBooking = eventId;
		}

		var updateBookingInfo = function(){
    		api.eventBookings.getBookings({eventId: $scope.eventIdForBooking}).$promise.then(function(result){
				$scope.bookings = result;
				$scope.userBookings = [];

				angular.forEach($scope.bookings, function(booking, key){
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
			if ($scope.userSearch.searchTerms != "") {
				var role = $scope.userSearch.searchTerms.role;

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

		$scope.bookUserOnEvent = function(eventId, userId){

			api.eventBookings.makeBooking({"eventId": eventId, "userId" : userId}).$promise.then(function(){
				updateBookingInfo();
			})
			.catch(function(e){
                    console.log("error:" + e)
                    $scope.showToast($scope.toastTypes.Failure, "Event Booking Failed", "With error message: (" + e.status + ") "+ e.status + ") "+ e.data.errorMessage != undefined ? e.data.errorMessage : "");
            });
		}

		$scope.addToWaitingList = function(eventId, userId){
			api.eventBookings.addToWaitingList({"eventId": eventId, "userId" : userId}).$promise.then(function(){
				updateBookingInfo();
			})			
			.catch(function(e){
                    console.log("error:" + e)
                    $scope.showToast($scope.toastTypes.Failure, "Event Booking Failed", "With error message: (" + e.status + ") "+ e.status + ") "+ e.data.errorMessage != undefined ? e.data.errorMessage : "");
            });
		}

		$scope.promoteFromWaitList = function(eventId, userId){
			var promote = $window.confirm('Are you sure you want to promote this user from the waiting list?');   

			if (promote) {
				api.eventBookings.promoteFromWaitList({"eventId": eventId, "userId" : userId}).$promise.then(function(){
					updateBookingInfo();
				})
				.catch(function(e){
                    console.log("error:" + e)
                    $scope.showToast($scope.toastTypes.Failure, "Event Booking Failed", "With error message: (" + e.status + ") "+ e.status + ") "+ e.data.errorMessage != undefined ? e.data.errorMessage : "");
            	});				
			}
		}
		
		$scope.unbookUserFromEvent = function(eventId, userId){
			var deleteBooking = $window.confirm('Are you sure you want to delete this booking permanently?');   

			if (deleteBooking) {
				api.eventBookings.deleteBooking({"eventId": eventId, "userId" : userId}).$promise.then(function(){
					updateBookingInfo();
				})
				.catch(function(e){
                    console.log("error:" + e)
                    $scope.showToast($scope.toastTypes.Failure, "Event Booking Failed", "With error message: (" + e.status + ") "+ e.status + ") "+ e.data.errorMessage != undefined ? e.data.errorMessage : "");
            	});
			}
		}

		$scope.cancelEventBooking = function(eventId, userId){
			var cancelBooking = $window.confirm('Are you sure you want to cancel this booking?');   
			if (cancelBooking) {
				api.eventBookings.cancelBooking({"eventId": eventId, "userId" : userId}).$promise.then(function(){
					updateBookingInfo();
				})
				.catch(function(e){
                    console.log("error:" + e)
                    $scope.showToast($scope.toastTypes.Failure, "Event Booking Failed", "With error message: (" + e.status + ") "+ e.status + ") "+ e.data.errorMessage != undefined ? e.data.errorMessage : "");
            	});
			}
		}
	}]

	return {
		PageController: PageController,
		AdminStatsPageController: AdminStatsPageController,
		AnalyticsPageController : AnalyticsPageController,		
		AdminEventBookingController : AdminEventBookingController,
	};
})