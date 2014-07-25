define([], function() {

	return ['api', '$window', function(api, $window) {

		this.loginRedirect = function(provider) {
			$window.location.href = api.authenticationEndpoint + '/' + provider +"/authenticate?redirect=http://" + $window.location.host;
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
});