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
define(["app/honest/difficulty"], function(Difficulty) {


	return ["$state", function($state) {

		return {

			scope: {
				selectedLevels: "=difficultyFilter",
			},

			restrict: "A",

			templateUrl: "/partials/difficulty_filter.html",

			link: function(scope, element, attrs) {
			    var config = [
			    	{ level:1, selected:false, enabled:true },
			        { level:2, selected:false, enabled:true },
			        { level:3, selected:false, enabled:true },
			        { level:4, selected:false, enabled:true },
			        { level:5, selected:false, enabled:true },
			        { level:6, selected:false, enabled:true }
			    ];

				var difficulty = new Difficulty(element,
				{
	                // Replace with real function to get state
	                get:function(callback) {
	                	callback(config);
	                },
	                // Does nothing - replace as required
	                change:function(state)
	                {
	                	scope.selectedLevels.length = 0;
	                	$.each(config, function(i, level) {
	                		if (level.selected)
	                			scope.selectedLevels.push(level.level);
	                	});
	                	scope.$apply();
	                }
	            });

			    scope.$watch("selectedLevels", function() {

			    	if (scope.selectedLevels) {
				    	$.each(config, function(i, level) {
				    		level.selected = scope.selectedLevels.indexOf(level.level) > -1;
				    	});
					}
				    
				    difficulty.plotHexagons(config);
			    }, true)
			}
		};
	}]

});