/**
 * Copyright 2018 Meurig Thomas
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
define(["../../honest/responsive_video", "/partials/content/FreeTextQuestion.html"], function(_rv, templateUrl) {

    return ["api", function(_api) {
        return {
            scope: true,

            restrict: 'A',

            templateUrl: templateUrl,

            controller: ["$scope", function(scope) {
                let ctrl = this;
                ctrl.selectedValue = null;

                scope.wordLimit = 20;
                scope.charLimit = 200;
                scope.validValue = true;

                scope.$watch("ctrl.selectedValue", function(value, oldValue) {
                    if (value === oldValue) {
                        return;
                    }

                    let whitespaceMatches = value.match(/\S+/g);
                    scope.currentNumebrOfWords = whitespaceMatches ? whitespaceMatches.length : 0;
                    scope.currentNumebrOfChars = value.length;

                    scope.wordLimitExceeded = scope.currentNumebrOfWords > scope.wordLimit;
                    scope.charLimitExceeded = scope.currentNumebrOfChars > scope.charLimit;

                    scope.validValue = !scope.wordLimitExceeded && !scope.charLimitExceeded;
                    scope.question.passedFrontEndValidation = scope.validValue;

                    scope.question.selectedChoice = scope.question.selectedChoice || { type: "stringChoice" };
                    scope.question.selectedChoice.value = value;
                });

                if (scope.question.selectedChoice) {
                    ctrl.selectedValue = scope.question.selectedChoice.value;
                }
            }],

            controllerAs: "ctrl",
        };
    }];
});
