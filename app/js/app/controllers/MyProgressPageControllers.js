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

			$scope.levelData = [
				{label: 'Level 1', val: $scope.progress.attempts_by_level["1"] || 0},
				{label: 'Level 2', val: $scope.progress.attempts_by_level["2"] || 0},
				{label: 'Level 3', val: $scope.progress.attempts_by_level["3"] || 0},
				{label: 'Level 4', val: $scope.progress.attempts_by_level["4"] || 0},
				{label: 'Level 5', val: $scope.progress.attempts_by_level["5"] || 0},
				{label: 'Level 6', val: $scope.progress.attempts_by_level["6"] || 0}
			];

			$scope.subjectData = [
				{label: 'Physics', val: $scope.progress.attempts_by_tag["physics"] || 0},
				{label: 'Maths', val: $scope.progress.attempts_by_tag["maths"] || 0}
			];

			$scope.fieldData = [
				{label: 'Mechanics', val: $scope.progress.attempts_by_tag["mechanics"] || 0},
				{label: 'Waves', val: $scope.progress.attempts_by_tag["waves"] || 0},
				{label: 'Fields', val: $scope.progress.attempts_by_tag["fields"] || 0},
				{label: 'Circuits', val: $scope.progress.attempts_by_tag["circuits"] || 0},
			];

		});
	}];

	return {
		PageController: PageController
	};
})