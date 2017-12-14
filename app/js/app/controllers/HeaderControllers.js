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

	var PageController = ['$rootScope', '$scope', 'auth', 'api', '$timeout', function($rootScope, $scope, auth, api, $timeout) {
		
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



        $rootScope.streakDialToggle = function(questionPartsCorrectToday) {

		    var progressValue = $('#progress-bar');
            var radius = 20;
            var circumference = 2 * Math.PI * radius;
            var dashOffset = circumference;


            if (questionPartsCorrectToday <= 3) {
                dashOffset = circumference * (1 - (questionPartsCorrectToday/3));
            } else if (questionPartsCorrectToday > 3) {
                dashOffset = 0;
            }

            progressValue.animate({'stroke-dashoffset' : dashOffset}, 500)

            //progressValue.attr('stroke-dashoffset', String(dashOffset));

        }

	}];

	return {
		PageController: PageController
	};
});