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
define(["/partials/content/AnvilQuestion.html"], function(templateUrl) {


    return ["api", "$sce", function(_api, _$sce) {

        return {
            scope: true,

            restrict: 'A',

            templateUrl: templateUrl,

            link: function(scope, _element, _attrs) {

                scope.appParams = {
                    username: scope.$root.user.email, 
                    user_id: scope.$root.user._id,
                    problem_id: scope.doc.id
                };

                scope.$on("anvilAppMessage", function(_event, data) {
                    if (data.msg == "answer") {
                        if (!scope.question.selectedChoice) {
                            scope.question.selectedChoice = {
                              "value": "AnvilAnswer",
                              "type": "choice",
                            };
                        }
                    }
                })
            },
        };
    }];
});