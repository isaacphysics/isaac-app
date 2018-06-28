/**
 * Copyright 2017 James Sharkey
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
define(["../../honest/responsive_video", "/partials/content/StringMatchQuestion.html"], function(rv, templateUrl) {

    return ["api", function(api) {

        return {
            scope: true,

            restrict: 'A',

            templateUrl: templateUrl,

            controller: ["$scope", function(scope) {
                var ctrl = this;

                ctrl.selectedValue = null;

                scope.$watch("ctrl.selectedValue", function(v, oldV) {
                    if (v === oldV) {
                        return; // Init
                    }

                    scope.question.selectedChoice = scope.question.selectedChoice || { type: "stringChoice" };
                    scope.question.selectedChoice.value = v;
                });

                if (scope.question.selectedChoice) {
                    ctrl.selectedValue = scope.question.selectedChoice.value;
                }

            }],

            controllerAs: "ctrl",
        };
    }];
});
