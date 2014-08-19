define([], function() {

    return ["$http", "$location", function($http, $location) {
		return {

			restrict: "A",

            template: '<div class="ru_share" ng-click="getShareLink()"></div>',

			link: function(scope, element, attrs) {
				scope.showShareUrl = false;
				scope.shareUrl = null;

				// TODO: This part of bug #156
				//if(attrs.sharelink) {
				//	var data = {"longUrl": 'http://'+window.location.host+'/'+attrs.sharelink};
				//}
				//else {
					var data = {"longUrl": window.location.href};
				//}
				$http.post('https://www.googleapis.com/urlshortener/v1/url', data, {withCredentials: false}).then(function(response) {
					scope.shareUrl = response.data.id.replace("http://goo.gl/", "http://isaacphysics.org/s/");
				}).catch(function() {
					// Fail silently
				});

                scope.getShareLink = function() {
	                scope.showShareUrl = !scope.showShareUrl;
                };
			}

		};
	}]

});