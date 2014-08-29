define([], function() {

    return ["$http", "$location", "api", function($http, $location, api) {
		return {

			restrict: "A",

            template: '<div class="ru_share" ng-click="getShareLink()"></div>',

			link: function(scope, element, attrs) {
				scope.showShareUrl = false;
				scope.shareUrl = null;

				if(attrs.sharelink) {
					var data = {"longUrl": 'http://'+window.location.host+'/'+attrs.sharelink};
				}
				else {
					var data = {"longUrl": window.location.href};
				}
				$http.post('https://www.googleapis.com/urlshortener/v1/url', data, {withCredentials: false}).then(function(response) {
					scope.shareUrl = response.data.id.replace("http://goo.gl/", "http://isaacphysics.org/s/");
				}).catch(function() {
					// Fail silently
				});

                scope.getShareLink = function() {
	                scope.showShareUrl = !scope.showShareUrl;
	                if (scope.showShareUrl) {
	                	api.logger.log({
		                	type: "SHOW_SHARE_URL",
		                	shortURL : scope.shareUrl,
		                });
	                }
                };
			}
		};
	}]
});