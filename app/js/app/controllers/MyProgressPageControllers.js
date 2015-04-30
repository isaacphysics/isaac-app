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

	var PageController = ['$scope', 'auth', 'api', 'tags', '$stateParams', '$timeout', function($scope, auth, api, tags, $stateParams, $timeout) {
		// start and end dates for line graphs
		var dataStartDate = new Date(new Date().setYear(new Date().getFullYear() - 1)) //set it to a year ago
		dataStartDate = dataStartDate.getTime();
		var dataEndDate = new Date().getTime();

		var userOfInterest = $scope.user._id;

		$scope.questionsAnsweredOverTime = null;

		$timeout(function() {
			// Call this asynchronously, so that loading icon doesn't get immediately clobbered by $stateChangeSuccess.
			$scope.globalFlags.isLoading = true;
		});

		if ($stateParams.userId) {
			$scope.progress = api.user.getProgress({ userId: $stateParams.userId });
			$scope.viewingOwnData = false;
			userOfInterest = $stateParams.userId;
		} else {
			$scope.progress = api.currentUser.getProgress();
			$scope.viewingOwnData = true;
			userOfInterest = $scope.user._id;
		}

		api.user.getEventsOverTime({userId: userOfInterest, from_date: dataStartDate, to_date:dataEndDate, events:"ANSWER_QUESTION"}).$promise.then(function(result){
			$scope.questionsAnsweredOverTime = JSON.parse(angular.toJson(result));
			$scope.globalFlags.isLoading = !$scope.subjectData;
		})

		$scope.progress.$promise.then(function() {
			$scope.globalFlags.isLoading = !$scope.questionsAnsweredOverTime && $scope.progress != null;
			$scope.levelData = [
				{label: 'Level 1', val: $scope.progress.attemptsByLevel["1"] || 0},
				{label: 'Level 2', val: $scope.progress.attemptsByLevel["2"] || 0},
				{label: 'Level 3', val: $scope.progress.attemptsByLevel["3"] || 0},
				{label: 'Level 4', val: $scope.progress.attemptsByLevel["4"] || 0},
				{label: 'Level 5', val: $scope.progress.attemptsByLevel["5"] || 0},
				{label: 'Level 6', val: $scope.progress.attemptsByLevel["6"] || 0}
			];

			$scope.subjectData = [
				{label: 'Physics', val: $scope.progress.attemptsByTag["physics"] || 0},
				{label: 'Maths', val: $scope.progress.attemptsByTag["maths"] || 0}
			];

			var attemptedFields = [];
			$scope.fields = [];
			for (var tid in $scope.progress.attemptsByTag) {
				var t = tags.getById(tid);
				if (t && t.level == 1) {
					attemptedFields.push(t);
					$scope.fields.push(t);
				}
			}

			if (attemptedFields.length == 0)
				return;

			$scope.field = {
				selection: attemptedFields[0],
			};

			$scope.topicsSubject = attemptedFields[0].parent;



			$scope.$watch("field.selection", function(newField) {

				$scope.fieldData = [];

				var topics = tags.getDescendents($scope.field.selection.id);
				for(var i in topics) {
					var t = topics[i];
					$scope.fieldData.push({
						label: t.title,
						val: $scope.progress.attemptsByTag[t.id] || 0,
					})
				}

				$scope.topicsSubject = newField.parent;

			})

		}).catch(function(e) {
			console.error("Unable to load user progress:", e);
			$timeout(function() {
				// Call this asynchronously, so that it happens later than the previous asynchronous call (!)
				$scope.globalFlags.isLoading = false;
			});
		});
	}];

	return {
		PageController: PageController
	};
})