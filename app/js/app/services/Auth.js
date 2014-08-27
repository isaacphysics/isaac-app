define([], function() {

	var service = ['api', '$window', '$location', '$state', '$rootScope', '$timeout', '$cookieStore', function(api, $window, $location, $state, $rootScope, $timeout, $cookieStore) {

		this.loginRedirect = function(provider, target) {
			
			$cookieStore.put("afterAuth", target || "");

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

            $cookieStore.remove("afterAuth");

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
			
			$cookieStore.put("afterAuth", "/account");

			api.authentication.getLinkRedirect({provider: provider}).$promise.then(function(data) {
				console.log("Redirect data:", data);

				$window.location.href = data.redirectUrl;
			})

		}

		this.logout = function() {
			$rootScope.user = null;
			return api.authentication.logout().$promise;
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

		this.login = function(email, password) {
			return new Promise(function(resolve, reject){
				api.login(email, password).$promise.then(function(u){
					$rootScope.user = u;
					resolve();
				}).catch(function(u){
					$rootScope.user = null;
					reject();
				});
			});
		}

		this.register = function(email, password) {

		}

	}];

	var resolver = ['auth', '$rootScope', function(auth, $rootScope) {
		return $rootScope.user.$promise.catch(function(r) {
			if (r.status == 401)
				return Promise.reject("require_login");
			return Promise.reject("Something went wrong:", r);
		});
	}];

	return {
		service: service,
		resolver: resolver,
	}
});