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

export const PageController = ['$scope', 'auth', '$state', '$location', '$window', '$rootScope', function($scope, auth, $state, $location, $window, $rootScope) {
	$rootScope.pageTitle = "Login";
	// Hide search on Login page
	$scope.globalFlags.noSearch = true;
	
	// Make sure the internal user object is up-to-date
	auth.updateUser().then(function(_user){			
		// We will only do this bit if the user is already logged in.
		let target = $location.search().target;
		if (target) {
			$window.location.href = target;
		} else {
			$state.go('home');
		}
	});
}];
