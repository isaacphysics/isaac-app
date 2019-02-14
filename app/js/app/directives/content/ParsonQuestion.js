/**
 * Copyright 2019 Meurig Thomas
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
define(["../../honest/responsive_video", "/partials/content/ParsonQuestion.html"], function(_rv, templateUrl) {

    return ["api", function(_api) {

        return {
            scope: true,

            restrict: 'A',

            templateUrl: templateUrl,

            controller: ["$scope", function(scope) {
                scope.tabWidth = 40;
                scope.maxIndent = 3;

                scope.parsonQuestionItems = [
                    {id: 123, value:'print("C")', indentation: 0},
                    {id: 232, value:'print("A")', indentation: 0},
                    {id: 333, value:'print("B")', indentation: 0},
                ]
                scope.parsonAnswerItems = [
                ]

                scope.parsonDragOptions = {
                    additionalPlaceholderClass: 'parson-item',
                    accept: function(source, target) {
                        //if (target.getAttribute(tab-depth))
                        let targetOffset = source.element[0].getBoundingClientRect().left - target.element[0].getBoundingClientRect().left;
                        if (targetOffset > scope.tabWidth) {
                            let indentation = Math.max(Math.min(Math.floor(targetOffset / scope.tabWidth), scope.maxIndent), 0)
                            // placeholder margin y = targetOffset/tabWidth
                            $(".as-sortable-placeholder").css("margin-left", (scope.tabWidth * indentation) + "px");
                            source.parsonItem.indentation = indentation;
                        } else {
                            $(".as-sortable-placeholder").css("margin-left", "0px");
                            source.parsonItem.indentation = 0;
                        }
                        return true;
                    }
                };


                let ctrl = this;

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
