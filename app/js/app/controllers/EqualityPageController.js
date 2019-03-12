/**
 * Copyright 2016 Ian Davies & Andrew Wells

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

export const PageController = ['$scope', '$rootScope', '$stateParams', function($scope, _$rootScope, $stateParams) {
    $scope.eqnEditorSeed = null;
    $scope.editorMode = "maths";
    $scope.logicSyntax = "logic";
    if ($stateParams.mode) {
        $scope.editorMode = $stateParams.mode;
    }
    if ($scope.editorMode == "logic") {
        $scope.logicSyntax = $stateParams.logicsyntax || "logic";
    }
    if ($stateParams.symbols) {
        $scope.questionDoc = {
            availableSymbols: $stateParams.symbols.split(",")
        }
    }
    $scope.eqnState = {
        symbols: {}
    };
    $scope.$watch("eqnEditorSeed", function(s) {
        if (s == null) return;
        try {
            let seed = JSON.parse(s);
            $scope.eqnState = {
                symbols: seed,
                result: { tex: seed[0].expression.latex, python: seed[0].expression.python }
            }
        } catch (e) {
            console.error("Invalid seed.");
        }
    });
}];