/**
 * Copyright 2014 Alistair Stead
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

			templateUrl: "/partials/toast.html",

			link: function(scope, element, attrs){

				//notes - removed ng-show to use animation instead

				scope.toastNotificationVisible = false;
				scope.toastTitle = "Title";
				scope.toastDescription = "Description";
				scope.toastTypes = {'Success' : 1, 'Failure': 2};
				scope.toastType = scope.toastTypes.Success; 

				scope.showToast = function(toastType, title, description){
					clearTimeout(scope.toastTimeouts);
					scope.toastTitle = title;
					scope.toastDescription = description;
					scope.toastType = toastType;
					scope.toastNotificationVisible = true;
					scope.toastTimeouts = setTimeout(scope.hideToast, 3000);

					element.children("div").css("visibility","visible");
				};


				scope.hideToast = function(){
					scope.toastNotificationVisible = false;
					toastNotificationText = "";
					scope.$apply();
					scope.toastTimeouts = setTimeout(function() {
						element.children("div").css("visibility","hidden");
					}, 500);
				}
			}

		};
	}
});