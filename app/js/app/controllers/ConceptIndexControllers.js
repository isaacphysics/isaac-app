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

	// TODO: Implement keyboard-only navigation of concept index page.
	// Use, e.g.
	/*
		.bind('click keyup', function(e) {
            if(e.type === 'click' || (e.type === 'keyup' && e.which === 13))
            {
                e.preventDefault();
                window.location.href = ...;
            }
        });	 
	*/

	var PageController = ['$scope', '$state', 'conceptList', 'persistence', '$location', '$rootScope', function($scope, $state, conceptList, persistence, $location, $rootScope) {

		$scope.allConcepts = conceptList.results;
		$rootScope.pageTitle = "Concept Index";
		
		$scope.includePhysics = true;
		$scope.includeMaths = true;

		$scope.subjectFilter = function(input) {
			if (!input.tags)
				return false;
			return (input.tags.indexOf("physics") > -1 && $scope.includePhysics) || (input.tags.indexOf("maths") > -1 && $scope.includeMaths);
		}

		persistence.session.save("conceptPageSource", $location.url());

	}]

	return {
		PageController: PageController,
	};
})