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
define(["../../MathJaxConfig"], function() {


	return ["$compile", "$rootScope", function(_$compile, $rootScope) {

		return {

			restrict: 'A',

			link: function(scope, _element, _attrs) {

				// This must be done asynchronously. Content isn't actually in element yet. Don't really understand why...
				let first = true;
				scope.$watch(function() {
					if (first) {
						setTimeout(function() {
							$rootScope.requestMathjaxRender();
						}, 0);
						first = false;
					}
				})
				   
			}
		};
	}];
});