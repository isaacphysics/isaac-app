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
define(["app/MathJaxConfig"], function() {


	return ["$compile", function($compile) {


		return {

			restrict: 'A',

			link: function(scope, element, attrs) {

				// This must be done asynchronously. Content isn't actually in element yet. Don't really understand why...
				var first = true;
				scope.$watch(function() {
					setTimeout(function() {
						MathJax.Hub.Queue(["Typeset",MathJax.Hub, element[0]]);      
					}, first ? 1000: 0);
					first = false;
				})
				   
			}
		};
	}];
});