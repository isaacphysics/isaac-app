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
define(['/partials/content/ValueOrChildren.html'], function(templateUrl) {


	return ["$compile", "RecursionHelper", "$sce", function(_$compile, RecursionHelper, $sce) {


		return {

			scope: true,

			restrict: 'A',

			templateUrl: templateUrl,

			compile: function(element) {
	            return RecursionHelper.compile(element, function(scope, _iElement, iAttrs, _controller, _transcludeFn){

	            	scope.value = undefined;
	            	scope.children = undefined;
	            	scope.encoding = undefined;

	            	scope.$parent.$watch(iAttrs.value, function(newValue) {
	            		scope.value = newValue;
	            		update();
	            	});

	            	scope.$parent.$watch(iAttrs.children, function(newChildren) {
	            		scope.children = newChildren;
	            		update();
	            	});

	            	scope.$parent.$watch(iAttrs.encoding, function(newEncoding) {
	            		scope.encoding = newEncoding;
	            		update();
	            	});

					// Replace three watchers which always get called one after another with one watcher:
					// TODO: work out why this didn't work. Also, work out why removing only enmcoding from it
					// and having that watcher separately *did* work just fine . . . 
					
					// scope.$parent.$watchGroup([iAttrs.value, iAttrs.children, iAttrs.encoding], function(newValues) {
					// 	scope.value = newValues[0];
					// 	scope.children = newValues[1];
					// 	scope.encoding = newValues[2];
					// 	update();
					// });

	            	let update = function updateFn() {

	            		scope.safeValue = $sce.trustAsHtml(scope.value);

						if (scope.value != "" && scope.value != null && scope.children != null && scope.children.length > 0) {
							throw new Error("Cannot render both value and children:\n\tVALUE:\n" +  JSON.stringify(scope.value, null, 2) + "\n\n\tCHILDREN:\n" + JSON.stringify(scope.children, null, 2));
						}

						scope.contentChunks = []; // One of these for each chunk of content, where accordions may only appear on their own in a chunk.
			            let breakOnTypeChange = false;
			            let lastType = "";
						let currentChunk = [];
						for (let i in scope.children) {
							let c = scope.children[i];
							c.contentChildIndex = scope.$root.padIndex(i);

							if ((breakOnTypeChange && c.type != lastType) || (!breakOnTypeChange && c.type == "isaacFeaturedProfile")) {
								// Split profiles into a separate content chunk
								// This means the index when iterating over the profiles starts from 0
								// and allows the multicolumn design to be more simply implemented
								breakOnTypeChange = !breakOnTypeChange; // toggle

								if (currentChunk.length > 0) {
									scope.contentChunks.push(currentChunk);
								}

								currentChunk = [c];
							} else if (c.layout == "accordion" || c.layout == "tabs") {
								if (currentChunk.length > 0)
									scope.contentChunks.push(currentChunk);
								let accordionChunk = [c];
								accordionChunk.isAccordion = true;
								accordionChunk.isFirstChunk = scope.contentChunks.length == 0;
								scope.contentChunks.push(accordionChunk);
								currentChunk = [];
							} else {
								currentChunk.push(c);
							}

							lastType = c.type;
						}

						if (currentChunk.length > 0)
							scope.contentChunks.push(currentChunk);

					}

	            });
	        }
		};
	}];
});