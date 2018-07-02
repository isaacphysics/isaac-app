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
define(["/partials/content/Figure.html"], function(templateUrl) {


	return ["api", function(api) {

		return {

			scope: true,

			restrict: 'A',

			templateUrl: templateUrl,

			link: function(scope, element, attrs) {


				let figId = scope.doc.id || ("auto-fig-id-" + Object.keys(scope.$root.figures).length + 1);

				figId = figId.replace(/.*?([^\|]*)$/g,'$1');

				scope.$root.figurePaths[figId] = scope.getIndexPath();

				scope.$root.updateFigureNumbers();

				scope.figId = figId;

				scope.path = api.getImageUrl(scope.doc.src);
			}
		};
	}];
});