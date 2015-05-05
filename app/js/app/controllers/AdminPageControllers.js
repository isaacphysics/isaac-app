/**
 * Copyright 2014 Ian Davies
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

	var PageController = ['$scope', 'auth', 'api', '$window', '$rootScope', function($scope, auth, api, $window, $rootScope) {
		$rootScope.pageTitle = "Admin Page";

		$scope.contentVersion = api.contentVersion.get();
		$scope.userSearch = {};
		$scope.userSearch.isLoading = false;
		$scope.userSearch.searchTerms = {role:"", email:"", familyName:""};

		$scope.schoolOtherEntries = api.schools.getSchoolOther();

		$scope.isAdminUser = $rootScope.user.role == 'ADMIN';

		$scope.setVersion = function() {
			$scope.versionChange = "IN_PROGRESS"
			api.contentVersion.set({version: $scope.contentVersion.liveVersion}, {}).$promise.then(function() {
				api.contentVersion.get().$promise.then(function(r) {
					$scope.contentVersion = r;
					$scope.versionChange = "SUCCESS";
				});
			}).catch(function(e) {
				console.error(e);
				$scope.versionChange = "ERROR"
			});
		}
		
		$scope.userSearchSortPredicate = "familyName";

		$scope.hasSearched = false;
		$scope.findUsers = function() {
			if ($scope.userSearch.searchTerms != "") {
				var role = $scope.userSearch.searchTerms.role;
				var schoolOther = $scope.userSearch.searchTerms.schoolOther;

				if ($scope.userSearch.searchTerms.role == "" || $scope.userSearch.searchTerms.role == "NO_ROLE") {
					role = null;
				}
				
				if ($scope.userSearch.searchTerms.schoolOther == "") {
					schoolOther = null;
				}

				$scope.userSearch.isLoading = true;
				api.adminUserSearch.search({'familyName' : $scope.userSearch.searchTerms.familyName, 'email' : $scope.userSearch.searchTerms.email, 'role' : role, 'schoolOther': schoolOther}).$promise.then(function(result){
					$scope.userSearch.results = result;
					$scope.userSearch.isLoading = false;
				});
				
				$scope.userSearch.hasSearched = true;
			}
		}

		$scope.deleteUser = function(userId) {
			var deleteUser = $window.confirm('Are you sure you want to delete?');   

			if (deleteUser) {
					api.adminDeleteUser.delete({'userId' : userId}).$promise.then(function(){
					$window.alert('User deleted');
					$scope.findUsers();
				});
			} else {
				return;
			}
		}
	}]

	var AdminStatsPageController = ['$scope', 'auth', 'api', '$window', '$rootScope', 'gameBoardTitles', '$timeout' , function($scope, auth, api, $window, $rootScope, gameBoardTitles, $timeout) {
			$rootScope.pageTitle = "Statistics Page";

			$scope.contentVersion = api.contentVersion.get();
			$scope.userSearch = {};
			$scope.userSearch.searchTerms = "";

			$scope.isAdminUser = $rootScope.user.role == 'ADMIN';

			$scope.statistics = null;
			
			$scope.locations = [];
			$scope.getLocationData = function() {
				$scope.visibleStatsPanel = "locationMap";
				$scope.globalFlags.isLoading = true;

				api.statisticsEndpoint.getUserLocations().$promise.then(function(result){
					for(var i = 0; i < result.length; i++) {
						result[i].id = i;
					}

					$scope.locations = result;
					$scope.globalFlags.isLoading = false;
				});
			}

			$scope.questionsAnsweredOverTime = null;
			$scope.getEventsGraph = function() {
					$scope.globalFlags.isLoading = true;
					$scope.visibleStatsPanel = "eventsGraph";

					// start and end dates for line graphs
					var dataStartDate = new Date(new Date().setYear(new Date().getFullYear() - 1)) //set it to a year ago
					dataStartDate = dataStartDate.getTime();
					var dataEndDate = new Date().getTime();

				api.statisticsEndpoint.getEventsOverTime({from_date: dataStartDate, to_date:dataEndDate, events:"ANSWER_QUESTION,VIEW_QUESTION", bin_data:true}).$promise.then(function(result){
					$scope.questionsAnsweredOverTime = JSON.parse(angular.toJson(result));
					$scope.globalFlags.isLoading = false;
				});
			}

			$scope.map = { center: { latitude: 53.670680, longitude: -1.582031 }, zoom: 5 };

			$timeout(function() {
				// Call this asynchronously, so that loading icon doesn't get immediately clobbered by $stateChangeSuccess.
				$scope.globalFlags.isLoading = $scope.statistics == null;
			});

			api.statisticsEndpoint.get().$promise.then(function(result){
				$scope.globalFlags.isLoading = false;
				$scope.statistics = result;
			});

			$scope.gameboardListData = [];
			$scope.visibleStatsPanel = null;
			$scope.generateGameBoardTitle = gameBoardTitles.generate;

			$scope.gameboardListSortPredicate = null;

			$scope.getGameboardListData = function() {
				$scope.visibleStatsPanel = "gameboardList";
				$scope.globalFlags.isLoading = true;
				var gameboardListPromise = api.statisticsEndpoint.getGameboardPopularity();

				gameboardListPromise.$promise.then(function(result){
					$scope.gameboardListData = result;
					$scope.globalFlags.isLoading = false;
					$scope.reverse = false;
				});
			}

			$scope.schoolListSortPredicate = "numberActiveLastThirtyDays"
			$scope.getSchoolListData = function() {
				$scope.visibleStatsPanel = "schoolList";
				$scope.globalFlags.isLoading = true;
				var gameboardListPromise = api.statisticsEndpoint.getSchoolPopularity();

				gameboardListPromise.$promise.then(function(result){
					$scope.schoolListData = result;
					$scope.globalFlags.isLoading = false;
					$scope.reverse = true;
				});
			}

			$scope.getSchoolUserListData = function(schoolId, schoolName) {
				$scope.visibleStatsPanel = "schoolUserList";
				$scope.globalFlags.isLoading = true;
				var gameboardListPromise = api.statisticsEndpoint.getSchoolUsers({id: schoolId});
				$scope.schoolSelected = schoolName;
				
				gameboardListPromise.$promise.then(function(result){
					$scope.schoolUserListData = result;
					$scope.globalFlags.isLoading = false;
					$scope.reverse = false;
				});
			}					
		}]

	// TODO: This probably belongs in the events controller but for now as only staff can do it we will keep it here.
	var AdminEventBookingController = ['$scope', 'auth', 'api', '$window', '$rootScope', function($scope, auth, api, $window, $rootScope) {
		$rootScope.pageTitle = "Admin Page";

		$scope.contentVersion = api.contentVersion.get();
		$scope.userSearch = {};
		$scope.userSearch.isLoading = false;
		$scope.userSearch.searchTerms = {role:"", email:"", familyName:""};

		$scope.isAdminUser = $rootScope.user.role == 'ADMIN';
		
		$scope.globalFlags.isLoading = true;

		$scope.hasSearched = false;
		$scope.events = [];

		$scope.bookings = [];
		$scope.userBookings = [];
		$scope.eventIdForBooking = null;


		api.getEventsList(0, -1, false, false, null).$promise.then(function(result) {
                $scope.globalFlags.isLoading = false;
                
				$scope.events = result.results;
        });

		var updateBookingInfo = function(){
    		api.eventBookings.getBookings({eventId: $scope.eventIdForBooking}).$promise.then(function(result){
				$scope.bookings = result;
				$scope.userBookings = [];

				angular.forEach($scope.bookings, function(booking, key){
					$scope.userBookings.push(booking.userBooked._id);
				});
    		})				
		}

        $scope.$watch('eventIdForBooking', function(){
        	if ($scope.eventIdForBooking) {
				updateBookingInfo();
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
			});
		}
		
		$scope.unbookUserFromEvent = function(eventId, userId){
			var deleteBooking = $window.confirm('Are you sure you want to unbook this user?');   

			if (deleteBooking) {
				api.eventBookings.deleteBooking({"eventId": eventId, "userId" : userId}).$promise.then(function(){
					updateBookingInfo();
				});
			}
		}		
	}]

	return {
		PageController: PageController,
		AdminStatsPageController: AdminStatsPageController,
		AdminEventBookingController : AdminEventBookingController,
	};
})