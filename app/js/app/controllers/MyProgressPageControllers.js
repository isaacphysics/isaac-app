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

		$scope.setLoading(2);

		if ($stateParams.userId) {
			$scope.progress = api.user.getProgress({ userId: $stateParams.userId });
			$scope.viewingOwnData = false;
			userOfInterest = $stateParams.userId;
		} else {
			$scope.progress = api.currentUser.getProgress();
			$scope.viewingOwnData = true;
			userOfInterest = $scope.user._id;
		}

		api.user.getEventsOverTime({userId: userOfInterest, from_date: dataStartDate, to_date:dataEndDate, events:"ANSWER_QUESTION", bin_data:true}).$promise.then(function(result){
			$scope.questionsAnsweredOverTime = JSON.parse(angular.toJson(result));
			$scope.showQuestionsOverTime = false;
			for (var property in $scope.questionsAnsweredOverTime) {
			    if ($scope.questionsAnsweredOverTime.hasOwnProperty(property)) {
			        for (var i in $scope.questionsAnsweredOverTime[property]) {
			        	$scope.showQuestionsOverTime = true; // There is data to show.
			        	break;
			        }
    			    // remove underscores in series label.
			        $scope.questionsAnsweredOverTime[property.replace("_", " ").toLowerCase()] = $scope.questionsAnsweredOverTime[property];
			        delete $scope.questionsAnsweredOverTime[property];
			    }
			}			
			$scope.setLoading(false);
		}).catch(function(e) {
			console.error("Unable to load user timeline:", e);
			$timeout(function() {
				// Call this asynchronously, so that it happens later than the previous asynchronous call (!)
				$scope.setLoading(false);
			});
		});

		$scope.progress.$promise.then(function() {
			$scope.setLoading(false);

			$scope.progress.percentCorrectQuestions = Math.round(100*$scope.progress.totalQuestionsCorrect/$scope.progress.totalQuestionsAttempted);
			$scope.progress.percentCorrectQuestionParts = Math.round(100*$scope.progress.totalQuestionPartsCorrect/$scope.progress.totalQuestionPartsAttempted);
			$scope.progress.symbolicCorrect = ($scope.progress.correctByType["isaacSymbolicQuestion"] || 0) + ($scope.progress.correctByType["isaacSymbolicChemistryQuestion"] || 0);
			$scope.progress.symbolicAttempts = ($scope.progress.attemptsByType["isaacSymbolicQuestion"] || 0) + ($scope.progress.attemptsByType["isaacSymbolicChemistryQuestion"] || 0);

			$scope.progress.percentCorrectNumeric = Math.round(100*$scope.progress.correctByType["isaacNumericQuestion"]/$scope.progress.attemptsByType["isaacNumericQuestion"]) || 0;
			$scope.progress.percentCorrectMultiChoice = Math.round(100*$scope.progress.correctByType["isaacMultiChoiceQuestion"]/$scope.progress.attemptsByType["isaacMultiChoiceQuestion"]) || 0;
			$scope.progress.percentCorrectSymbolic = Math.round(100*$scope.progress.symbolicCorrect/$scope.progress.symbolicAttempts) || 0;

			$scope.progress.percentCorrectPhysicsSkills14 = Math.round(100*$scope.progress.correctByTag["physics_skills_14"]/$scope.progress.attemptsByTag["physics_skills_14"]) || 0;
			$scope.progress.percentCorrectChemistry16 = Math.round(100*$scope.progress.correctByTag["chemistry_16"]/$scope.progress.attemptsByTag["chemistry_16"]) || 0;


			$scope.levelData = [
				{label: 'Level 1', val: $scope.progress.correctByLevel["1"] || 0},
				{label: 'Level 2', val: $scope.progress.correctByLevel["2"] || 0},
				{label: 'Level 3', val: $scope.progress.correctByLevel["3"] || 0},
				{label: 'Level 4', val: $scope.progress.correctByLevel["4"] || 0},
				{label: 'Level 5', val: $scope.progress.correctByLevel["5"] || 0},
				{label: 'Level 6', val: $scope.progress.correctByLevel["6"] || 0}
			];

			$scope.subjectData = [
				{label: 'Physics', val: $scope.progress.correctByTag["physics"] || 0},
				{label: 'Maths', val: $scope.progress.correctByTag["maths"] || 0},
				{label: 'Chemistry', val: $scope.progress.correctByTag["chemistry"] || 0}
			];

			$scope.fieldData = [];
			var attemptedFields = [];
			$scope.fields = [];
			for (var tid in $scope.progress.correctByTag) {
				var t = tags.getById(tid);
				if (t && t.level == 1) {
					attemptedFields.push(t);
					$scope.fields.push(t);
				}
			}

			if (attemptedFields.length == 0) {
				return;
			}

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
						val: $scope.progress.correctByTag[t.id] || 0,
					})
				}

				$scope.topicsSubject = newField.parent;

			})

		}).catch(function(e) {
			console.error("Unable to load user progress:", e);
			$timeout(function() {
				// Call this asynchronously, so that it happens later than the previous asynchronous call (!)
				$scope.setLoading(false);
			});
		});
	}];

	return {
		PageController: PageController
	};
})