/**
 * Copyright 2014 Ian Davies
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export const PageController = ['$rootScope', '$scope', 'auth', 'api', '$location', '$timeout', 'persistence', function($rootScope, $scope, _auth, api, $location, _$timeout, persistence) {
    
    $scope.$root.segueEnvironment = "LIVE"; //Live by default
    $scope.showImportantAnnouncement = !persistence.load('importantAnnouncementDismissed');
    $rootScope.browserIsIE = navigator.userAgent.indexOf("MSIE ") >= 0 || !!navigator.userAgent.match(/Trident.*rv:11\./);

    $rootScope.coronavirusBanner = {};
    let updateCoronavirusBanner = function() {
        $rootScope.coronavirusBanner.show = false;//['/', '/alevel', '/gcse'].indexOf($location.path()) >= 0;
        if ($location.path() == '/alevel') {
            $rootScope.coronavirusBanner.text = "A Level ";
            $rootScope.coronavirusBanner.urlHash = "#alevel";
        } else if ($location.path() == '/gcse') {
            $rootScope.coronavirusBanner.text = "GCSE ";
            $rootScope.coronavirusBanner.urlHash = "#gcse";
        } else {
            $rootScope.coronavirusBanner.text = "";
            $rootScope.coronavirusBanner.urlHash = "";
        }
    }
    updateCoronavirusBanner();
    $rootScope.$on('$locationChangeSuccess', function() {
        updateCoronavirusBanner();
    })

    //Find out which version we're on
    api.environment.get().$promise.then(function(response){
        $scope.$root.segueEnvironment = response.segueEnvironment;
    });



    let notificationsOpen = false;

    $scope.notificationToggle = function() {

        notificationsOpen = !notificationsOpen;

        if (notificationsOpen) {

            let notificationSeenList = [];

            for (let i = 0; i < $rootScope.notificationList.length; i++) {

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

    // DANGER WILL ROBINSON
    // The following two methods are to become useless after the hard-coded
    // endDate below, and should be removed.
    // I highly sympathise with anyone experiencing distress at the mere
    // thought of the following. Hold tight.
    $scope.shouldShowImportantAnnouncement = function() {
        const startDate = new Date('2020-01-01T09:00:00Z');
        const endDate = new Date('2021-01-01T00:00:00Z');
        return !persistence.load('importantAnnouncementDismissed') && (startDate <= Date.now() && Date.now() <= endDate);
    }
    $rootScope.showImportantAnnouncement = $scope.shouldShowImportantAnnouncement();

    $rootScope.dismissImportantAnnouncement = function() {
        persistence.save('importantAnnouncementDismissed', true);
        $rootScope.showImportantAnnouncement = false;
    }
    // Madness ends here. More or less. Have a look at header.html, elements
    // .important-announcement will need to be removed as well.


    $rootScope.streakDialToggle = function(questionPartsCorrectToday) {

        let progressValue = $('#progress-bar');
        let radius = 20;
        let circumference = 2 * Math.PI * radius;
        let dashOffset = circumference;


        if (questionPartsCorrectToday <= 3) {
            dashOffset = circumference * (1 - (questionPartsCorrectToday/3));
        } else if (questionPartsCorrectToday > 3) {
            dashOffset = 0;
        }

        progressValue.animate({'stroke-dashoffset' : dashOffset}, 500)

        //progressValue.attr('stroke-dashoffset', String(dashOffset));

    }

}];
