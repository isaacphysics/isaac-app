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


	return ["$compile", "RecursionHelper", "$location", "$timeout", function($compile, RecursionHelper, $location, $timeout) {

		return {

			scope: true,

			restrict: 'A',

			templateUrl: '/partials/content/Content.html',

			compile: function(element) {
	            return RecursionHelper.compile(element, function(scope, iElement, iAttrs, controller, transcludeFn) {
	            	// Post-link actions go here.

	            	scope.doc = undefined;
	            	scope.$parent.$watch(iAttrs.doc, function(newDoc) {
	            		scope.doc = newDoc;
	            		//TODO: we should probably make this a scss rule.
		            	if(scope.doc && scope.doc.layout=="right") {
		            		iElement.css("float", "right").width(300);
		            		iElement.css("margin-left", "30px");
		            	} else if(scope.doc && scope.doc.layout=="righthalf") {
		            		iElement.css("float", "right").width("50%");
		            		iElement.css("margin-left", "30px");
		            	} else if(scope.doc && scope.doc.layout=="left") {
		            		iElement.css("float", "left").width(300);
		            		iElement.css("margin-right", "30px");
		            	}

		            	if (scope.doc && scope.doc.id) {

		            		if (scope.doc.id.indexOf("|" + $location.hash()) == scope.doc.id.length - $location.hash().length - 1) {

		            			scope.$emit("ensureVisible");

								$timeout(function() {
									$("body").animate({
						                scrollTop: iElement.offset().top
						            }, 1000);        
								});
		            		}
		            	}
	            	});


	            });
	        }
		};
	}];
});