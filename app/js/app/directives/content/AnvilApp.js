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


    return ["$sce", function($sce) {

        return {

            scope: {
                app: "=",
                params: "=",
            },

            restrict: 'A',

            templateUrl: "/partials/content/AnvilApp.html",

            link: function(scope, element, attrs) {

                var url = "https://anvil.works/apps/" + scope.app.appId + "/" + scope.app.appAccessKey + "/app";

                if (scope.params) {
                    url += "#?" + $.param(scope.params);
                }
                scope.src = $sce.trustAsResourceUrl(url);

                var iframe = element.find("iframe")[0];

                var onMessage = function(e) {
                    if (e.originalEvent.source !== iframe.contentWindow) { return; }

                    var data = e.originalEvent.data;
                    console.debug("Anvil app message:", data);

                    if (data.fn == "newAppHeight") {
                        $(iframe).height(data.newHeight+15);
                    } else {
                        scope.$emit("anvilAppMessage", data);
                    }
                };

                $(window).on("message", onMessage);

                scope.$on("$destroy", function() {
                    $(window).off("message", onMessage);
                })
            }
        };
    }];
});