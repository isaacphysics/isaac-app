define([], function() {


	return ["$compile", "RecursionHelper", "$sce", function($compile, RecursionHelper, $sce) {


		return {

			scope: true,

			restrict: 'A',

			templateUrl: '/partials/content/ValueOrChildren.html',

			compile: function(element) {
	            return RecursionHelper.compile(element, function(scope, iElement, iAttrs, controller, transcludeFn){

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

	            	var update = function updateFn() {

	            		scope.safeValue = $sce.trustAsHtml(scope.value);

						if (scope.value != "" && scope.value != null && scope.children != null && scope.children.length > 0)
							throw new Error("Cannot render both value and children:\n\tVALUE:\n" +  JSON.stringify(scope.value, null, 2) + "\n\n\tCHILDREN:\n" + JSON.stringify(scope.children, null, 2));

						scope.contentChunks = []; // One of these for each chunk of content, where accordions may only appear on their own in a chunk.
			            var breakOnTypeChange = false;
			            var lastType = "";
						var currentChunk = [];
						for (var i in scope.children) {
							var c = scope.children[i];

							if ((breakOnTypeChange && c.type != lastType) || (!breakOnTypeChange && c.type == "isaacFeaturedProfile")) {
								breakOnTypeChange = !breakOnTypeChange; // toggle

								if (currentChunk.length > 0) {
									scope.contentChunks.push(currentChunk);
								}

								currentChunk = [c];
								if (c.type == "isaacFeaturedProfile") {
									currentChunk.isAccordion = true;
								}
							} else if (c.layout == "accordion") {
								if (currentChunk.length > 0)
									scope.contentChunks.push(currentChunk);
								var accordionChunk = [c];
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