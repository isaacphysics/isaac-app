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
define(["/partials/desktop_panel.html"], function(templateUrl) {

	return [function() {

		return {

			restrict: "A",

			templateUrl: templateUrl,

			transclude: true,

			link: function(scope, element, attrs) {

				if (attrs.arrowBlock != undefined) {
					element.find(".ru-desktop-panel").addClass(" ru-panel-arrow-block");
				}

				scope.$watch("globalFlags.siteSearchOpen", function(searchOpen) {

					// Do this the old-fashioned way, because we can't add an ngHide on the template.
					// This is because ngHide will create its own scope, preventing ngTransclude from working. Yuk.

					if(searchOpen) {
						//element.hide();
					} else {
						//element.show();
					}
				})
			}
		};
	}]
})