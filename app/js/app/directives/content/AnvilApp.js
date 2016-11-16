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

                var url = "https://anvil.works/apps/" + scope.app.appId + "/" + scope.app.appAccessKey + "/app?s=new" + Math.random();

                var ps = {};

                if (scope.$root.user && scope.$root.user._id) {
                    ps.user_id = scope.$root.user._id;
                    ps.user_role = scope.$root.user.role;
                }

                if (scope.$parent.question) {
                    ps.problem_id = scope.$parent.question.id;
                    ps.problem_type = scope.$parent.question.type;
                    if (scope.$parent.question.validationResponse) {
                        ps.problem_previously_correct = scope.$parent.question.validationResponse.correct;
                    }
                }

                if (location.pathname.indexOf("/questions/") == 0) {
                    ps.page_id = location.pathname.replace("/questions/", "");
                    ps.page_type = "isaacQuestionPage";
                } else if (location.pathname.indexOf("/concepts/") == 0) {
                    ps.page_id = location.pathname.replace("/concepts/", "");
                    ps.page_type = "isaacConceptPage";
                } else if (location.pathname.indexOf("/events/") == 0) {
                    ps.page_id = location.pathname.replace("/events/", "");
                    ps.page_type = "isaacEventPage";
                } else if (location.pathname.indexOf("/pages/") == 0) {
                    ps.page_id = location.pathname.replace("/pages/", "");
                    ps.page_type = "page";
                } else if ((location.pathname.match(/\//g) || []).length == 1) {
                    ps.page_id = location.pathname.replace("/", "");
                    ps.page_type = "page";
                }

                ps = $.extend(ps, scope.params);
                    
                url += "#?" + $.param(ps);

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