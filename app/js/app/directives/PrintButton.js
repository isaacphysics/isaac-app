/**
 * Copyright 2014 Nick Rogers
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

	return function() {
		return {

			restrict: "A",

            template: '<div class="ru_print" ng-click="togglePrintingOptions()"></div>',

			link: function(scope, element, attrs, shareButtonCtrl) {
				scope.printingOptionsVisible = false;

				scope.togglePrintingOptions = function(){
					scope.printingOptionsVisible = !scope.printingOptionsVisible;
				}

                scope.printWithHints = function(showHints) {
					scope.hideForPrint.hints = !showHints;

					//Timeout required for page to update
					setTimeout(function(){
                    	window.print();
					}, 0)
                };
			}

		};
	}

});