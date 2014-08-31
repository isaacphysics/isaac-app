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
define([], function() {


	return ["$compile", "RecursionHelper", function($compile, RecursionHelper) {

		return {

			scope: true,

			restrict: 'A',

			templateUrl: '/partials/content/Content.html',

			compile: function(element) {
	            return RecursionHelper.compile(element, function(scope, iElement, iAttrs, controller, transcludeFn){
	            	// Post-link actions go here.

	            	scope.doc = undefined;
	            	scope.$parent.$watch(iAttrs.doc, function(newDoc) {
	            		scope.doc = newDoc;
	            		
		            	if(scope.doc && scope.doc.layout=="right") {
		            		iElement.css("float", "right").width(300);
		            	} else if(scope.doc && scope.doc.layout=="righthalf") {
		            		iElement.css("float", "right").width("50%");
		            	}
	            	});

	            });
	        }
		};
	}];
});