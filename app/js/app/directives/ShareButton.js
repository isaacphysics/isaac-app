define([], function() {

    return ["$http", function($http) {
		return {

			restrict: "A",

            template: '<div class="ru_share" ng-click="getShareLink()"></div>',

			link: function(scope, element, attrs) {
				scope.showShareUrl = false;
				scope.shareUrl = null;

                scope.getShareLink = function() {
	                if (scope.showShareUrl) {
		                scope.showShareUrl = false;
		                scope.shareUrl = null;
		                return;
	                }

                    var data = {"longUrl": window.location.href};
                    $http.post('https://www.googleapis.com/urlshortener/v1/url', data, {withCredentials: false}).then(function(response) {
	                    scope.shareUrl = response.data.id;
	                    scope.showShareUrl = true;
                    }).catch(function() {
						// Fail silently
                    });
                };
			}

		};
	}]

});