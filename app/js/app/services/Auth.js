define([], function() {

	var service = ['api', '$window', '$cookies', '$location', '$state', '$rootScope', function(api, $window, $cookies, $location, $state, $rootScope) {

		this.loginRedirect = function(provider, target) {
			
			$cookies.afterAuth = target || "";

			api.authentication.getAuthRedirect({provider: provider}).$promise.then(function(data) {
				console.log("Redirect data:", data);

				$window.location.href = data.redirectUrl;
			})
		}

		this.providerCallback = function(provider, params) {

            var next = $cookies.afterAuth || "/";
            next = next.replace("#!", "");

            delete $cookies.afterAuth;

            params.provider = provider;

            api.authentication.getAuthResult(params).$promise.then(function(u) {
                console.debug("Logged in user:", u);
                console.debug("Redirecting to", next);
                $rootScope.user = u;

                $location.replace();
                $location.url(next);
            }).catch(function(e) {
            	$state.go("authError", {errorMessage: e.data.errorMessage, statusText: e.data.responseCodeType});
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
			$rootScope.user = null;
			return api.authentication.logout().$promise;
		}

		this.getUser = function(forceRefresh) {

			if (!$rootScope.user || forceRefresh)
				$rootScope.user = api.currentUser.get();

			return $rootScope.user;
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

	var resolver = ['auth', function(auth) {
		return auth.getUser().$promise.catch(function(r) {
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