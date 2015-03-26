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
		$scope.userSearch.searchTerms = "";

		$scope.isAdminUser = $rootScope.user.role == 'ADMIN';

		$scope.statistics = api.statisticsEndpoint.get();
		
		$scope.statsLoading = true;
		$scope.statistics.$promise.then(function(){
			$scope.statsLoading = false;
		});

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
		
		$scope.hasSearched = false;
		$scope.findUsers = function() {
			if ($scope.userSearch.searchTerms != "") {
				var role = $scope.userSearch.searchTerms.role;

				if ($scope.userSearch.searchTerms.role == "" || $scope.userSearch.searchTerms.role == "NO_ROLE") {
					role = null;
				}
				$scope.userSearch.results = api.adminUserSearch.search({'familyName' : $scope.userSearch.searchTerms.familyName, 'email' : $scope.userSearch.searchTerms.email, 'role' : role});
				$scope.userSearch.hasSearched=true;
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

	var AdminStatsPageController = ['$scope', 'auth', 'api', '$window', '$rootScope', 'gameBoardTitles', function($scope, auth, api, $window, $rootScope, gameBoardTitles) {
			$rootScope.pageTitle = "Statistics Page";

			$scope.contentVersion = api.contentVersion.get();
			$scope.userSearch = {};
			$scope.userSearch.searchTerms = "";

			$scope.isAdminUser = $rootScope.user.role == 'ADMIN';

			//$scope.statistics = api.statisticsEndpoint.get();
			$scope.gameboardListData = [];
			$scope.visibleStatsPanel = null;

			$scope.statsLoading = false;

			$scope.generateGameBoardTitle = gameBoardTitles.generate;

			$scope.getGameboardListData = function() {
				$scope.visibleStatsPanel = "gameboardList";
				$scope.statsLoading = true;
				var gameboardListPromise = api.statisticsEndpoint.getGameboardPopularity();

				gameboardListPromise.$promise.then(function(result){
					$scope.gameboardListData = result;
					$scope.statsLoading = false;
				});
			}

			$scope.getSchoolListData = function() {
				$scope.visibleStatsPanel = "schoolList";
				$scope.statsLoading = true;
				var gameboardListPromise = api.statisticsEndpoint.getSchoolPopularity();

				gameboardListPromise.$promise.then(function(result){
					$scope.schoolListData = result;
					$scope.statsLoading = false;
				});
			}

			$scope.getSchoolUserListData = function(schoolId, schoolName) {
				$scope.visibleStatsPanel = "schoolUserList";
				$scope.statsLoading = true;
				var gameboardListPromise = api.statisticsEndpoint.getSchoolUsers({id: schoolId});
				$scope.schoolSelected = schoolName;
				
				gameboardListPromise.$promise.then(function(result){
					$scope.schoolUserListData = result;
					$scope.statsLoading = false;
				});
			}					
		}]

	return {
		PageController: PageController,
		AdminStatsPageController: AdminStatsPageController,
	};
})