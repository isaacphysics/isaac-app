/**
 * Copyright 2015 Luke McLean
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
define([], function() {

	var PageController = ['$scope', 'auth', 'api', function($scope, auth, api) {
		
		$scope.progress = api.currentUser.getProgress();
		
		$scope.progress.$promise.then(function() {
			console.debug($scope.progress);
		});
		/*
		setTimeout(function() {

			// dummy data for donut charts.
			$scope.totalQuestionsAttempted = 67;

			$scope.firstAttemptRightCount = 40;

			$scope.correctCount = 23;

			$scope.levelData = [
				{label: 'Level 1 (30%)', val: 30},
				{label: 'Level 2 (20%)', val: 20},
				{label: 'Level 3 (19%)', val: 19},
				{label: 'Level 4 (15%)', val: 15},
				{label: 'Level 5 (8%)', val: 8},
				{label: 'Level 6 (8%)', val: 8}
			];

			$scope.subjectData = [
				{label: 'Physics (80%)', val: 80},
				{label: 'Maths (20%)', val: 20}
			];

			$scope.FieldData = [
				{label: 'Mech (30%)', val: 30},
				{label: 'Waves (25%)', val: 25},
				{label: 'Fields (20%)', val: 20},
				{label: 'Circuits (15%)', val: 15},
				{label: 'Gemetry (10%)', val: 10}
			];

			$scope.$apply();
		}, 100);
*/
	}];

	return {
		PageController: PageController
	};
})