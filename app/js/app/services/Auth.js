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

	var service = ['api', '$window', '$location', '$state', '$rootScope', '$timeout', '$cookies', function(api, $window, $location, $state, $rootScope, $timeout, $cookies) {

		this.loginRedirect = function(provider, target) {
			
			$cookies.afterAuth = target || "";

			api.authentication.getAuthRedirect({provider: provider}).$promise.then(function(data) {
				console.log("Redirect data:", data);

				$window.location.href = data.redirectUrl;
			}).catch(function(e) {
            	$state.go("authError", {errorMessage: e.data.errorMessage, statusText: e.data.responseCodeType});
			})
		}

		this.providerCallback = function(provider, params) {
            var next = $cookies.afterAuth;
            next = next || "/";
            next = next.replace("#!", "");

            delete $cookies.afterAuth;

            params.provider = provider;

            api.authentication.getAuthResult(params).$promise.then(function(u) {
                console.debug("Logged in user:", u);
                console.debug("Redirecting to", next);

                $rootScope.user = u;

                if (u.firstLogin) {
                	$state.go("accountSettings", {next: next}, {location: "replace"});
                } else {
	                $location.replace();
	                $location.url(next);
                }

            }).catch(function(e) {

            	$state.go("authError", {errorMessage: e.data.errorMessage, statusText: e.data.responseCodeType}, {location: "replace"});
            });

		}

		this.linkRedirect = function(provider) {
			$cookies.afterAuth = "/account";

			api.authentication.getLinkRedirect({provider: provider}).$promise.then(function(data) {
				console.log("Redirect data:", data);

				$window.location.href = data.redirectUrl;
			})

		}

		this.logout = function() {
			var p = api.authentication.logout({}).$promise;

			p.then(function() {
				$rootScope.user = null;
			}).catch(function(e) {
				console.error("Failed to log out:", e)
			})
			return p;
		}

		this.updateUser = function() {

			$rootScope.user = api.currentUser.get();

			$rootScope.user.$promise.then(function() {
				$timeout(function() {
					$rootScope.$apply();
				});
			})

			return $rootScope.user.$promise;
		}

		this.login = function(userPrototype) {
			// expects the user object to contain an email and password property.
			return new Promise(function(resolve, reject){
				api.authentication.login(userPrototype).$promise.then(function(u){
					$rootScope.user = u;
					resolve();
				}).catch(function(u){
					$rootScope.user = null;
					reject();
				});
			});
		}
	}];

	// this should not be used in the router resolver property as it will only return once.
	// TODO should this be deprecated?
	var promiseLoggedIn = ['auth', '$rootScope', function(auth, $rootScope) {
		return $rootScope.user.$promise.catch(function(r) {
			if (r.status == 401)
				return Promise.reject("require_login");
			return Promise.reject("Something went wrong:", r);
		});
	}];

	return {
		service: service,
		promiseLoggedIn: promiseLoggedIn,
	}
});