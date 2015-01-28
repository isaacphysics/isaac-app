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

 	return ["api", "$interval", function(api, $interval) {

 		return {
 			scope: true,

 			restrict: "A",

 			templateUrl: "/partials/pod_carousel.html",

 			link: function(scope, element, attrs) {
 				var intervalReference = null;
 				var intervalValue = 10000; //ms
 				
 				scope.startPod = 0;
 				scope.pods = api.pods.get();

 				scope.visiblePods = [];

 				var calculateVisiblePods = function() {
 					scope.visiblePods = [
	 					scope.pods.results[scope.startPod % scope.pods.results.length],
	 					scope.pods.results[(scope.startPod + 1) % scope.pods.results.length],
	 					scope.pods.results[(scope.startPod + 2) % scope.pods.results.length]
 					]
 				}

				var interruptAndSetupNewInterval = function() {
					if (intervalReference != null) {
						$interval.cancel(intervalReference);
						interval = null;
					}

					intervalReference = $interval(function() {
						scope.startPod++;
					}, 10000);
				}

				scope.pods.$promise.then(function(){
					Array.prototype.sort.call(scope.pods.results,function(a,b) { return a.id > b.id; });
					calculateVisiblePods();
					interruptAndSetupNewInterval();
				});

				scope.pauseCarousel = function() {
					if (intervalReference != null) {
						$interval.cancel(intervalReference);
						intervalReference = null;
					}
				}

				scope.startCarousel = interruptAndSetupNewInterval;
				
				/**
				 * Function to navigate through the pods available.
				 */
				scope.navigate = function(positionAdjustment) {
					scope.startPod = scope.startPod + positionAdjustment;
					interruptAndSetupNewInterval();
				}

				/**
				 * Function to determine whether a given pod should be visible or not.
				 * This assumes desktop resolution.
				 */
				scope.isVisible = function(pod) {
					calculateVisiblePods();

					if (scope.visiblePods.indexOf(pod) != -1 ) {
						return true;
					}
					
					return false;
				}

				/**
				 * Function to determine the order of pods to be displayed.
				 */
				scope.comparitor = function(pod) {
					var pos = scope.visiblePods.indexOf(pod);
					if(pos != -1) {
						return pos;
					} 

					return scope.pods.results.length;
				}
			},
		};
	}];
});