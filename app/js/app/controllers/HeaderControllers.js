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

	var PageController = ['$rootScope', '$scope', 'auth', 'api', function($rootScope, $scope, auth, api) {
		
		$scope.$root.segueEnvironment = "LIVE"; //Live by default

		//Find out which version we're on
		api.environment.get().$promise.then(function(response){
			$scope.$root.segueEnvironment = response.segueEnvironment;
		});

        var notificationsOpen = false;

		$scope.notificationToggle = function() {

			notificationsOpen = !notificationsOpen;

			if (notificationsOpen) {

				var notificationSeenList = [];

                for (var i = 0; i < $rootScope.notificationList.length; i++) {

                    notificationSeenList.push($rootScope.notificationList[i].id);
                }

                $rootScope.notificationWebSocket.send(JSON.stringify({
                    "feedbackType" : "NOTIFICATION_VIEW_LIST",
					"notificationIds" : notificationSeenList
                }));





                $rootScope.notificationListLength = 0;
                $rootScope.notificationPopups = [];
			}

            $('.dl-notifications').slideToggle(200);

		}


        $rootScope.streakDialToggle = function(streakNum) {

            // if we are rendering a new dial, remove the current one
            $('#svg-progress').find(".dot").remove();

            var dotsPerCircle = 12;

            var interval = (Math.PI * 2) / dotsPerCircle;

            var centerX = $('#svg-progress').width()/2;
            var centerY = $('#svg-progress').height()/2;
            var radius = 20;


            for (var i = 0; i < dotsPerCircle; i++) {

                desiredRadianAngleOnCircle = interval * i;

                var x = centerX + radius * Math.sin(desiredRadianAngleOnCircle);
                var y = centerY - radius * Math.cos(desiredRadianAngleOnCircle);

                var className = "dot";

                if (i < streakNum) {
                    var className = "dot highlighted";
                }


                var shape = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                shape.setAttributeNS(null, "class", className);
                shape.setAttributeNS(null, "cx", x);
                shape.setAttributeNS(null, "cy", y);
                shape.setAttributeNS(null, "r", 2.6);

                $('#svg-progress').append(shape);

            }
        }

	}];

	return {
		PageController: PageController
	};
});