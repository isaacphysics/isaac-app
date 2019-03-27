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
define(["../../honest/responsive_video", "/partials/content/ParsonsQuestion.html"], function(_rv, templateUrl) {

    return ["api", function(_api) {

        return {
            scope: true,

            restrict: 'A',

            templateUrl: templateUrl,

            controller: ["$scope", function(scope) {
                let ctrl = this;

                scope.tabWidth = 40;
                scope.maxIndent = 2; // TODO initialise this value fromthe question

                scope.parsonsQuestionItems = scope.doc.items;

                scope.parsonsDragOptions = {
                    additionalPlaceholderClass: 'parsons-item',
                    accept: function(source, target) {
                        let targetOffset = source.element[0].getBoundingClientRect().left - target.element[0].getBoundingClientRect().left;
                        if (targetOffset > scope.tabWidth) {
                            let indentation = Math.max(Math.min(Math.floor(targetOffset / scope.tabWidth), scope.maxIndent), 0)
                            $(".as-sortable-placeholder").css("margin-left", (scope.tabWidth * indentation) + "px");
                            source.parsonsItem.indentation = indentation;
                        } else {
                            $(".as-sortable-placeholder").css("margin-left", "0px");
                            source.parsonsItem.indentation = 0;
                        }
                        return true;
                    }
                };

                scope.initaliseState = function() {

                    if (scope.question.selectedChoice) {
                        // We have a previous answer. Load it.
                        console.debug("Loading the previous answer.");
                        try {
                            ctrl.selectedValue = angular.fromJson(scope.question.selectedChoice.value);
                        } catch (e) {
                            console.warn("Error loading previous answer: ", e.message);
                        }  
                    } else {
                        // We have no answer and no seed
                        console.debug("No previous answer or seed.");
                        ctrl.selectedValue = {
                            items: [],
                            remainingItems: angular.copy(scope.parsonsQuestionItems),
                        };
                    }
                };
                scope.initaliseState();

                scope.$watch("ctrl.selectedValue", function(value, oldValue) {
                    if (value === oldValue) {
                        return; /* Init */
                    }
                    if (value.items) {
                        scope.question.selectedChoice = {
                            type: "parsonsChoice",
                            value: angular.toJson(value),
                            items: value.items,
                        };
                    } else {
                        scope.question.selectedChoice = null;
                    }
                }, true);
            }],

            controllerAs: "ctrl",
        };
    }];
});
