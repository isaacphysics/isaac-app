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

	var PageController = ['$scope', 'auth', 'api', function($scope, auth, api) {
		$scope.contentVersion = api.contentVersion.get();

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
			$scope.userSearch.results = api.adminUserSearch.search({ 'email' : $scope.userSearch.searchTerms});
			$scope.userSearch.hasSearched=true;
		}
	}]

	return {
		PageController: PageController,
	};
})