/**
 * Copyright 2014 Ian Davies
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

    var PageController = ['$scope', 'auth', 'api', 'userOfInterest', 'subject', 'persistence', '$stateParams', '$window', '$location', '$rootScope', function($scope, auth, api, userOfInterest, subject, persistence, $stateParams, $window, $location, $rootScope) {
        /*
        *  This controller manages the User Account Settings page, but it also
        *  manages user Registration. Any changes to one will affect the other,
        *  so ensure both are checked after modifying this code.
        */
        $scope.activeTab = 0;

        $scope.emailPreferences = {"NEWS_AND_UPDATES": true, "ASSIGNMENTS": true, "EVENTS": true};
        $scope.subjectInterests = {};
        $scope.betaFeatures = {};
        $scope.passwordChangeState = {
            passwordCurrent : ""
        };

        // It appears ng-model can no longer cope matching a string value to a number?
        if ($scope.user.defaultLevel) {
            $scope.user.defaultLevel = String($scope.user.defaultLevel);
        }

        // the hash will be used as an anchor
        if ($location.hash){
            switch($location.hash()){
                case "passwordreset":
                    $scope.activeTab = 1;
                    break;
                case "teacherconnections":
                    $scope.activeTab = 2;
                    break;
                case "emailpreferences":
                    $scope.activeTab = 3;
                    break;
                case "betafeatures":
                    $scope.activeTab = 4;
                    break;
            }
        }

        $rootScope.pageTitle = "Account Settings";

        $scope.myUserRole = $rootScope.user.role;

        // if the userOfInterest is set then we want the $scope to use this and not the rootScope user (i.e. we are NOT editing the currently logged in user).
        // this is likely to be an administrator activity and could do with some extra security from the frontend.
        if (userOfInterest && $scope.user != undefined && $scope.user._id != $stateParams.userId) {
            $scope.editingSelf = false;
            $scope.user = userOfInterest;
        } else {
            $scope.editingSelf = true;
        }

        if ($scope.editingSelf) {
            api.user.getUserPreferences().$promise.then(function(result){
                // Only update values if response contains key:
                if (result.EMAIL_PREFERENCE) {
                    // Loop over provided preferences and update existing object (which contains the
                    // default values in case no preference is already provided for an email type).
                    // Note the function(value, key) order!
                    angular.forEach(result.EMAIL_PREFERENCE, function(value, key) {
                        $scope.emailPreferences[key] = value;
                    });
                }
                $scope.subjectInterests = result.SUBJECT_INTEREST || $scope.subjectInterests;
                $scope.betaFeatures = result.BETA_FEATURE || $scope.betaFeatures;
            });
        }

        $scope.activateTab = function(i) {
            $scope.activeTab = i;
        }

        // so we can check if they have changed their email address
        var emailBeforeEditing = $scope.user.email;

        var possibleMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Create date of birth select options
        $scope.datePicker = {
            days: [],
            months: possibleMonths,
            years: []
        };

        // Populate days
        function daysInMonth(month, year) {
            // Credit to: http://stackoverflow.com/questions/1184334/get-number-days-in-a-specified-month-using-javascript
            // Month is 1 based
            return new Date(year, month, 0).getDate();
        }

        var populateDays = function(month, year) {
            var today = new Date();

            $scope.datePicker.days = [];

            // Default to 31
            var days = 31;

            if (month !== undefined && month > -1 && year !== undefined && year > -1) {
                // Month is 0 based, so add 1 to it
                days = daysInMonth(month + 1, year);
            }

            // If the current month and year are selected, make sure days are limited to the past
            if (today.getMonth() === month && today.getFullYear() === year){
                days = today.getDate();
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

            var today = new Date();
            // Restrict the months depending on the year
            if ($scope.dob.year === today.getFullYear()){
                $scope.datePicker.months = possibleMonths.slice(0,today.getMonth() + 1);
            }
            else{
                $scope.datePicker.months = possibleMonths;
            }

            var thirteen_years_ago = Date.UTC(today.getFullYear() - 13, today.getMonth(), today.getDate());

            var dob_unix = Date.UTC($scope.dob.year, $scope.datePicker.months.indexOf($scope.dob.month), $scope.dob.day);
            if (!isNaN(dob_unix) && $scope.datePicker.months.indexOf($scope.dob.month) > -1) {
                $scope.user.dateOfBirth = dob_unix;
                $scope.confirmed_over_thirteen = dob_unix <= thirteen_years_ago;
            } else {
                $scope.confirmed_over_thirteen = false;
                $scope.user.dateOfBirth = null;
            }
        });

        $scope.socialAccounts = function(){
            // object for linked account, nothing linked by default
            var linked = {"GOOGLE":false, "TWITTER":false, "FACEBOOK":false};

            // loop through linked accounts
            angular.forEach($scope.user.linkedAccounts, function(account){
                Object.keys(linked).forEach(function(key) {
                    // If there is a match update to true
                    if (key === account) linked[key] = true;
                });
                
            });
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

        $scope.atLeastOne = function(object) {
            var oneOrMoreTrue = false;
            // Avoid all the horrible angular properties:
            angular.forEach(JSON.parse(JSON.stringify(object)), function(key) {
                if (key === true) {
                    oneOrMoreTrue = true;
                }
            });
            return oneOrMoreTrue;
        }

        // Work out what state we're in. If we have a "next" query param then we need to display skip button.

        $scope.showSkip = !!$stateParams.next;
        $scope.save = function(next) {

            // Some users apparently confuse the Save and Teacher Connect button; help make it clear that Connect must be clicked before Save:
            if ($scope.authenticationToken.value != null && $scope.authenticationToken.value != "") {
                var confirm = $window.confirm("You have entered a teacher connection code but haven't yet clicked 'Connect'. Do you want to use the code before saving? You will need to click 'Save' again after using the code.");
                if (confirm) {
                    $scope.activeTab = 2;
                    return;
                }
            }

            var afterAuth = persistence.load('afterAuth');
            if (afterAuth) {
                next = afterAuth;
                persistence.save('afterAuth', "");
            }
            $scope.errorMessage = null;  // clear any old error message

            if ($scope.user.role == "") {
                $scope.user.role = null; // fix to stop invalid role being sent to the server
            }

            if ($scope.account.password.$viewValue) {
                $scope.account.password2.$setViewValue($scope.account.password2.$viewValue);
            }

            // if not a new user; confirm any email change, else undo it (but don't if invalid because it will just fail below anyway)
            if ($scope.user._id != null && $scope.user.email != emailBeforeEditing && $scope.editingSelf && $scope.account.email.$valid){
                var promptResponse = $window.confirm("You have edited your email address. Your current address will continue to work until you verify your new address by following the verification link sent to it via email. Continue?");
                if (promptResponse){
                    
                }
                else{
                    $scope.user.email = emailBeforeEditing;
                    return;
                }
            }

            // Ensure all valid: email valid, not changing password or are changing password and confirmed passwords (and current password / admin user checked)
            var formValid = $scope.account.$valid && $scope.account.email.$valid;
            var passwordsValidated = (!$scope.password1 || ($scope.password1.length >= 6 && ($scope.password1 == $scope.password2) && (!!$scope.passwordChangeState.passwordCurrent || !$scope.editingSelf)));
            var confirmedThirteen = $scope.confirmed_over_thirteen || (!$scope.user.dateOfBirth && $scope.user._id); // If there is a user ID, they have already registered and confirmed their age!
            if (formValid && passwordsValidated && confirmedThirteen) {
                //TODO the user object can probably just be augmented with emailPreferences, instead of sending both as seperate objects
                var userSettings = {
                    registeredUser : $scope.user,
                    userPreferences : {
                        EMAIL_PREFERENCE : $scope.emailPreferences,
                        SUBJECT_INTEREST : $scope.subjectInterests,
                        BETA_FEATURE: $scope.betaFeatures
                    }
                }

                // add the current password if it's confirmed, and put new password in user object
                if (!!$scope.passwordChangeState && !!$scope.passwordChangeState.passwordCurrent){
                    userSettings.registeredUser.password = $scope.password1;
                    userSettings.passwordCurrent = $scope.passwordChangeState.passwordCurrent;
                // or if a new password set and editing someone else, just put new password in user object (security checks done in api)
                } else if (!!$scope.password1 && !$scope.editingSelf) {
                    userSettings.registeredUser.password = $scope.password1;
                }

                api.account.saveSettings(userSettings).$promise.then(function() {
                    if ($location.path() == "/register") {
                        // The user object will be overridden below by updateUser, but want to temporarily preserve that this is the first login!
                        persistence.session.save('firstLogin', true);
                    }
                    // Update the user object in case it has changed:
                    return auth.updateUser();
                }).then(function(){
                    if (next) {
                        $scope.cancelOnDestroyEvent(); // Don't need this handler to fire if we've saved and are redirecting!
                        $location.url(next)
                    } else {
                        $scope.updateSuccess = true;
                    }
                }).catch(function(e) {
                    $scope.updateFail = true;
                    if (e.data != null && e.data.errorMessage != null) {
                        $scope.errorMessage = e.data.errorMessage;
                    } else {
                        $scope.errorMessage = null;
                    }
                })
            } else {
                // The form is not valid, so display errors.
                for(var i in $scope.account.$error.required) {
                    $scope.account.$error.required[i].$dirty = true;
                }

                // show front end error messages now (really useful on mobile when can't see fields, appear under Save button)
                $scope.updateFail = true;
                // no current password, but new password set (if not admin)
                if (!$scope.passwordChangeState.passwordCurrent && !!$scope.password1 && $scope.editingSelf) {
                    $scope.errorMessage = "Current password not confirmed.";
                // current password given/admin user, but new password not confirmed
                } else if (($scope.password1 && $scope.password1 != $scope.password2) || ($scope.user.password && $scope.user.password != $scope.password2)) {
                    $scope.errorMessage = "Passwords do not match.";
                // password not long enough:
                } else if ($scope.password1 && $scope.password1.length < 6) {
                    $scope.errorMessage = "Passwords must be at least 6 characters in length.";
                // first name or last name missing
                } else if (($scope.account.firstname.$invalid && $scope.account.firstname.$dirty) || ($scope.account.secondname.$invalid && $scope.account.secondname.$dirty)) {
                    $scope.errorMessage = "Name field missing or invalid.";
                // bad email address given
                } else if ($scope.account.email.$invalid && $scope.account.email.$dirty) {
                    $scope.errorMessage = "Email address missing or invalid.";
                } else if ($scope.user.dateOfBirth && !$scope.confirmed_over_thirteen) {
                    if ($scope.user._id) {
                        // They already have an account, but are apparently too young. Ask them to get in touch!
                        $scope.errorMessage = "You should be at least 13 years old to have an Isaac account. Please contact us!";
                    } else {
                        $scope.errorMessage = "You must be at least 13 years old to have an Isaac account!";
                    }
                } else if (!$scope.user._id && !$scope.confirmed_over_thirteen) {
                    $scope.errorMessage = "You must confirm you are at least 13 years old to have an Isaac account.";
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

        $scope.cancelOnDestroyEvent = $scope.$on("$destroy", function() { // This returns an unsubscribe function to cancel the handler.
            auth.updateUser();
        })

        // authorisation (token) stuff
        $scope.authenticationToken = {value: null};
        $scope.activeAuthorisations = api.authorisations.get();
        $scope.activeStudentAuthorisations = api.authorisations.getOthers();
        
        $scope.useToken = function() {
            if ($scope.authenticationToken.value == null || $scope.authenticationToken.value == "") {
                $scope.showToast($scope.toastTypes.Failure, "No Token Provided", "You have to enter a token!");
                return;
            }
            
            // Some users paste the URL in the token box, so remove the token from the end if they do.
            // Tokens so far are also always uppercase; this is hardcoded in the API, so safe to assume here:
            $scope.authenticationToken.value = $scope.authenticationToken.value.split("?authToken=").pop();
            $scope.authenticationToken.value = $scope.authenticationToken.value.toUpperCase().replace(/ /g,'');

            api.authorisations.getTokenOwner({token: $scope.authenticationToken.value}).$promise.then(function(result) {
                $scope.usersToGrantAccess = result;
                var userIdsAlreadyAuthorised = $scope.activeAuthorisations.map(function(a) {return a.id}) || [];
                $scope.anyUsersAuthorisedAlready = false;

                angular.forEach($scope.usersToGrantAccess, function(value, key) {
                    value.givenName = value.givenName ? value.givenName.charAt(0) + ". " : "";
                    value.authorisedAlready = userIdsAlreadyAuthorised.indexOf(value.id) > -1;
                    $scope.anyUsersAuthorisedAlready = $scope.anyUsersAuthorisedAlready || value.authorisedAlready;
                });
                $scope.modals.tokenVerification.show();
            }).catch(function(e) {
                console.error(e);
                if (e.status == 429) {
                    $scope.showToast($scope.toastTypes.Failure, "Too Many Attempts", "You have entered too many tokens. Please check your code with your teacher and try again later!");
                } else {
                    $scope.showToast($scope.toastTypes.Failure, "Teacher Connection Failed", "The code may be invalid or the group may no longer exist. Codes are usually uppercase and 6-8 characters in length.");
                }
            });
        }

        $scope.applyToken = function() {
            api.authorisations.useToken({token: $scope.authenticationToken.value}).$promise.then(function(){
                $scope.activeAuthorisations = api.authorisations.get();
                $scope.authenticationToken = {value: null};
                $scope.showToast($scope.toastTypes.Success, "Granted Access", "You have granted access to your data.");
                // user.firstLogin is set correctly using SSO, but not with Segue: check session storage too:
                if ($scope.user.firstLogin || persistence.session.load('firstLogin')) {
                    // If we've just signed up and used a group code immediately, change back to the main settings page:
                    $scope.activeTab = 0;
                }
                $scope.modals.tokenVerification.hide();
            }).catch(function(e) {
                console.error(e);
                $scope.showToast($scope.toastTypes.Failure, "Teacher Connection Failed", "The code may be invalid or the group may no longer exist. Codes are usually uppercase and 6-8 characters in length.");
            });
        }

        // if an auth token has been provided assume we want to add it.
        if ($stateParams.authToken && $scope.editingSelf) {
            $scope.authenticationToken = {value: $stateParams.authToken}
            $scope.activeTab = 2;
            $scope.useToken();
        } else if ($stateParams.authToken && !$scope.editingSelf) {
            $scope.showToast($scope.toastTypes.Failure, "Access Denied", "You are not allowed to grant permissions (using a token) on behalf of another user.");
        }

        $scope.revokeAuthorisation = function(userToRevoke){
            var revoke = $window.confirm('Are you sure you want to revoke this user\'s access?');   

            if (revoke) {
                api.authorisations.revoke({id: userToRevoke.id}).$promise.then(function(){
                    $scope.activeAuthorisations = api.authorisations.get();
                    $scope.showToast($scope.toastTypes.Success, "Access Revoked", "You have revoked access to your data.");
                }).catch(function(e){
                    $scope.showToast($scope.toastTypes.Failure, "Revoke Operation Failed", "With error message (" + e.status + ") " + e.data.errorMessage != undefined ? e.data.errorMessage : "");
                })              
            } else {
                return;
            }
        }

        $scope.releaseAuthorisation = function(userToRevoke){
            var revoke = $window.confirm('Are you sure you want to revoke this user\'s access?');   

            if (revoke) {
                api.authorisations.release({id: userToRevoke.id}).$promise.then(function(){
                    $scope.activeStudentAuthorisations = api.authorisations.getOthers();
                    $scope.showToast($scope.toastTypes.Success, "Access Revoked", "You have revoked access to your data.");
                }).catch(function(e){
                    $scope.showToast($scope.toastTypes.Failure, "Revoke Operation Failed", "With error message (" + e.status + ") " + e.data.errorMessage != undefined ? e.data.errorMessage : "");
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