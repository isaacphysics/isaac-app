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
    return function() {
        return {
            restrict: 'A',

            scope: {
                value: "=",
                max: "=",
            },

            template: "<div class='bar'><span></span></div><span></span>",

            link: function(scope, element, _attrs) {

                let leftSpan = element.find("div span");

                let update = function() {
                    element.children("div").remove(".text-center");
                    if (scope.max != null && scope.max > 0) {
                        if (scope.value == null) {
                            scope.value = 0;
                        }
                        leftSpan.text(scope.value + " of " + scope.max);

                        // Uncomment if we prefer "A vs B" instead of "A out of A+B"
                        // rightSpan.text(scope.max - scope.value);

                        element.children("div").css("width", ((scope.value / scope.max) * 100) + "%");
                    } else {
                        element.append("<div class='text-center'><i>No Data</i></div>");
                    }
                };

                scope.$watch("value", update);
                scope.$watch("max", update);
            }
        }
    }
});