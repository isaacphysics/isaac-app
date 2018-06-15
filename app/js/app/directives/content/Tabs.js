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
define(['/partials/content/Tabs.html'], function(templateUrl) {


	return ["api", function(api) {

		return {

			scope: true,

			restrict: 'A',

			templateUrl: templateUrl,

			link: function(scope, element, attrs) {
				scope.activeTab = 0;

				scope.activateTab = function(i) {
					scope.activeTab = i;

					if (scope.doc.children[i].type == "isaacQuestion") {

						var logData = {
							type: "QUICK_QUESTION_TAB_VIEW",
							quickQuestionId: scope.doc.children[i].id,
						};

						if (scope.page) {
							logData.pageId = scope.page.id;
						}

						api.logger.log(logData);
					}
				}


				scope.$on("ensureVisible", function(e) {
					if (e.targetScope == scope)
						return;

					e.stopPropagation();

					var i = e.targetScope.tabIndex;

					scope.activateTab(i);

					scope.$emit("ensureVisible");
				});
			},
		};
	}];
});