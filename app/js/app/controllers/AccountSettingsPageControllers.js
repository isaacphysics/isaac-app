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

	var PageController = ['$scope', 'auth', 'api', 'userOfInterest', '$stateParams', '$window', '$location', '$rootScope', function($scope, auth, api, userOfInterest, $stateParams, $window, $location, $rootScope) {
		$rootScope.pageTitle = "Account Settings";
		// if the userOfInterest is set then we want to the $scope to use this and not the rootScope user (i.e. we are NOT editing the currently logged in user).
		// this is likely to be an administrator activity and could do with some extra security from the frontend.
		if (userOfInterest) {
			$scope.editingSelf = false;
			$scope.user = userOfInterest;
		} else {
			$scope.editingSelf = true;
		}

		// Create date of birth select options
		$scope.datePicker = {
			days: [],
			months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
			years: []
		};

		// Populate days
		function daysInMonth(month, year) {
			// Credit to: http://stackoverflow.com/questions/1184334/get-number-days-in-a-specified-month-using-javascript
			// Month is 1 based
			return new Date(year, month, 0).getDate();
		}

		var populateDays = function(month, year) {
			$scope.datePicker.days = [];

			// Default to 31
			var days = 31;

			if (month !== undefined && month > -1 && year !== undefined && year > -1) {
				// Month is 0 based, so add 1 to it
				days = daysInMonth(month + 1, year);
			}

			for (var i = 1; i <= days; i++) {
				$scope.datePicker.days.push(i);
			}
		};

		// Perform initial population
		populateDays();

		// Populate years
		var currentYear = new Date().getFullYear();
		for (var i = currentYear; i > 1900; i--) {
			$scope.datePicker.years.push(i);
		}

		$scope.dob = {};

		$scope.user.$promise.then(function() {
			if ($scope.user.dateOfBirth != null) {
				var date = new Date($scope.user.dateOfBirth);
				$scope.dob.day = date.getDate();
				$scope.dob.month = $scope.datePicker.months[date.getMonth()];
				$scope.dob.year = date.getFullYear();
			}
		});

		// Watch for changes to the DOB selection
		$scope.$watchCollection('dob', function() {
			if ($scope.user == null) {
				// User object hasn't been initialised yet
				return;
			}

			// Restrict the number of days depended on the selected month and year
			populateDays($scope.datePicker.months.indexOf($scope.dob.month), $scope.dob.year);

			var dob = new Date($scope.dob.year, $scope.datePicker.months.indexOf($scope.dob.month), $scope.dob.day);
			if (!isNaN(dob.getTime())) {
				$scope.user.dateOfBirth = dob.getTime();
			}
		});

		$scope.socialAccounts = function(){
			// object for linked account, nothing linked by default
			var linked = {"GOOGLE":false, "TWITTER":false, "FACEBOOK":false};

			if ($scope.user != null) {
				// loop through linked accounts
				angular.forEach($scope.user.linkedAccounts, function(account){
					Object.keys(linked).forEach(function(key) {
						// If there is a match update to true
    					if(key === account) linked[key] = true;
					});
					
                });
			}
			return linked;
		}

		$scope.removeLinkedAccount = function(provider) {
			api.removeLinkedAccount(provider).then(function() {
				auth.updateUser();
			});
		}
		$scope.addLinkedAccount = function(provider) {
			auth.linkRedirect(provider);
		}

        // Work out what state we're in. If we have a "next" query param then we need to display skip button.

        $scope.showSkip = !!$stateParams.next;

        $scope.save = function(next) {
        	
        	if ($scope.user.role == "") {
        		$scope.user.role = null; // fix to stop invalid role being sent to the server
        	}

        	if ($scope.account.password.$viewValue) {
        		$scope.account.password2.$setViewValue($scope.account.password2.$viewValue);
        	}
        	if ($scope.account.$valid && (!$scope.user.password || $scope.user.password == $scope.password2)) {
	        	api.account.saveSettings($scope.user).$promise.then(function() {
	        		// we want to cause the internal user object to be updated just in case it has changed.
	        		return auth.updateUser();
	        	}).then(function(){
	        		if (next) {
			        	$location.url(next)
	        		} else {
			        	$scope.updateSuccess = true;
	        		}
	        	}).catch(function(error) {
	        		$scope.updateFail = true;
			        if (error.data != null && error.data.errorMessage != null) {
				        $scope.errorMessage = error.data.errorMessage;
			        } else {
				        $scope.errorMessage = null;
			        }
	        	})
	        } else {
	        	// The form is not valid, so display errors.
	        	for(var i in $scope.account.$error.required) {
	        		$scope.account.$error.required[i].$dirty = true;
        		}
	        }
        }

        $scope.skip = function() {
        	$location.url($stateParams.next || "/");
        }

        $scope.$watchCollection("user", function() {
        	$scope.updateSuccess = false;
        	$scope.updateFail = false;
        })

        $scope.$on("$destroy", function() {
        	auth.updateUser();
        })
		
		// authorisation (token) stuff
		$scope.authenticationToken = {value: null};
        $scope.activeAuthorisations = api.authorisations.get();
        
        $scope.useToken = function() {
        	if ($scope.authenticationToken.value == null) {
        		$scope.showToast($scope.toastTypes.Failure, "No Token Value", "You have to enter a token value!");
        		return;
        	}

        	api.authorisations.useToken({token: $scope.authenticationToken.value}).$promise.then(function(){
        		$scope.activeAuthorisations = api.authorisations.get();
        		$scope.authenticationToken = {value: null};
        	}).catch(function(e){
        		$scope.showToast($scope.toastTypes.Failure, "Token Operation Failed", "With error message (" + e.status + ") " + ((e.data.errorMessage != undefined) ? e.data.errorMessage : "" ));
        	})        		
        }

        $scope.revokeAuthorisation = function(userToRevoke){
        	var revoke = $window.confirm('Are you sure you want to revoke this user\'s access?');   

        	if(revoke) {
	        	api.authorisations.revoke({id: userToRevoke._id}).$promise.then(function(){
	        		$scope.activeAuthorisations = api.authorisations.get();
	        	}).catch(function(e){
        			$scope.showToast($scope.toastTypes.Failure, "Revoke Operation Failed", "With error message (" + e.status + ") "  + ((e.data.errorMessage != undefined) ? e.data.errorMessage : "" )));
	        	})        		
        	} else {
        		return;
        	}
        }
        // end authorisation stuff
	}]

	return {
		PageController: PageController,
	};
})