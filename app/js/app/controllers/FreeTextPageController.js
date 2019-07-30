/**
 * Copyright 2019 Ben Hanson

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

export const PageController = ['$scope', '$rootScope', '$stateParams', function($scope, _$rootScope, $stateParams) {
    $scope.title = "Free Text Entry";
    $scope.freeTextRuleJson = {
        value: ""
    };
    // $scope.freeTextState = {
    //     value: ""
    // };
    $scope.question = {
        selectedChoice: {}
    };
    $scope.$watch("freeTextRule", function(s) {
        console.log("hiya");
        if (s == null) return;
        try {
            console.log(s);
            $scope.freeTextRuleJson = {
              "encoding": "markdown",
              "value": s,
              "type": "freeTextRule",
              "caseInsensitive": true,
              "allowsAnyOrder": false,
              "allowsExtraWords": true,
              "allowsMisspelling": true,
              "explanation": {
                "type": "content",
                "children": [],
                "encoding": "markdown"
              }
            };
        } catch (e) {
            console.error("Invalid answer.");
        }
    });
    $scope.$watch("freeTextState", function(s) {
        console.log("hi");
        if (s == null) return;
        try {
            let answer = JSON.parse(s);
            $scope.freeTextState = {
                value: answer
            }
        } catch (e) {
            console.error("Invalid answer.");
        }
    });
}];