define([], function() {

	var service = ['api', '$window', function(api, $window) {

		this.loginRedirect = function(provider, target) {
			
			$window.location.href = api.authenticationEndpoint + '/' + provider +"/authenticate?redirect=http://" + $window.location.host + (target || "");
		}

		this.logout = function() {
			this.user = null;
			return api.logout();
		}

		this.getUser = function(forceRefresh) {

			if (!this.user || forceRefresh)
				this.user = api.currentUser.get();

			return this.user;
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