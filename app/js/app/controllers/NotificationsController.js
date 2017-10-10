/**
 * Copyright 2017 Dan Underwood
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

    var PageController = ['$rootScope', '$scope', '$animate', function($rootScope, $scope) {


        $scope.popupInteraction = function(notification, action) {

            for (var i = 0; i < $rootScope.notificationPopups.length; i++) {

                if ($rootScope.notificationPopups[i].id && $rootScope.notificationPopups[i].id == notification.id) {

                    clearTimeout($rootScope.notificationPopups[i].timeout);

                    $rootScope.notificationListLength--;
                    $rootScope.notificationPopups.splice(i, 1);
                    break;
                }
            }


            $rootScope.notificationWebSocket.send(JSON.stringify({
                "feedbackType" : action,
                "notificationId" : notification.id
            }));


        }

        $scope.resetTimeouts = function() {
            $rootScope.notificationPopups.forEach(function(entry) {

                clearTimeout(entry.timeout);

                entry.timeout = setTimeout(function() {
                    $rootScope.notificationPopups.shift();
                },12000)
            });
        }

    }];

    return {
        PageController: PageController
    };
});