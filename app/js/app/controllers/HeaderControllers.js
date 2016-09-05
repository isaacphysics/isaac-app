/**
 * Copyright 2014 Ian Davies
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
		
		$scope.$root.segueEnvironment = "LIVE"; //Live by default

		//Find out which version we're on
		api.environment.get().$promise.then(function(response){
			$scope.$root.segueEnvironment = response.segueEnvironment;
		});

		// FIXME: Which frontend should we use (this is a temporary solution only).
		$scope.$root.isaacPhysics = document.location.host == "localhost:8000" || document.location.origin.indexOf("isaacphysics") > -1;
		$scope.$root.isaacChemistry = document.location.host == "localhost:8001" || document.location.origin.indexOf("isaacchemistry") > -1;
		$scope.$root.isaacBiology = document.location.host == "localhost:8002" || document.location.origin.indexOf("isaacbiology") > -1;

	}];

	return {
		PageController: PageController
	};
});