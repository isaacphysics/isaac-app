/**
 * Copyright 2015 Ian Davies
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
define([], function() {

    var PageController = ['$scope', '$state', '$location', function($scope, $state, $location) {

        // Check whether someone has arrived at the homepage trying to load a game board. If so, 
        // redirect them to the new /questions route.
        var hash = $location.hash();

        if (hash) {
            console.debug("HASH", hash);
            $location.replace();
            $location.url("/gameboards#" + hash);
        }

        $scope.$root.isHomePage = true;
    }]

    return {
        PageController: PageController,
    };
})