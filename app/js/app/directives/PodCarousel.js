/**
 * Copyright 2015 Ian Davies
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

	return ["api", "$timeout", function(api, $timeout) {

		return {
			scope: true,

			restrict: "A",

			templateUrl: "/partials/pod_carousel.html",

			link: function(scope, element, attrs) {
				scope.startPod = 0;
				scope.pods = api.pods.get();

				scope.pods.$promise.then(function(){
					scope.pods.sort(function(a,b) { return a.id > b.id; });
				});

				$timeout(function() {
					scope.startPod++;
				}, 10000);
			},
		};
	}];
});