/**
 * Copyright 2014 Stephen Cummins
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
		$scope.selectedChapterId = null;
		$scope.setLoading(true);

		$scope.introText = null;

		api.pageFragments.get({id: "physics_skills_14_intro"}).$promise.then(function(result){
				$scope.introText = result;
            	$scope.setLoading(false);
			}).catch(function(e){
				$scope.setLoading(false);
				console.log("Error unable to load intro text " + e)
			})

		$scope.selectChapter = function(chapterId) {
            $scope.setLoading(true);
			api.pageFragments.get({id: chapterId}).$promise.then(function(result){
				$scope.modalContent = result;
				$scope.selectedChapterId = chapterId;
				$scope.modals.bookChapterOptions.show();
            	$scope.setLoading(false);
			}).catch(function(e){
				$scope.setLoading(false);
        		$scope.showToast($scope.toastTypes.Failure, "Unable to load the chapter your requested", "Error message (" + e.status + ") "+ e.status + ") "+ e.data.errorMessage != undefined ? e.data.errorMessage : "");
			})
		}
	}];

	return {
		PageController: PageController
	};
});