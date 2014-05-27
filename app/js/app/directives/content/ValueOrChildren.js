define([], function() {


	return ["$compile", "RecursionHelper", "$sce", function($compile, RecursionHelper, $sce) {


		return {

			scope: {
				value: "=",
				children: "=",
				encoding: "=",
			},

			restrict: 'EA',

			templateUrl: '/partials/content/ValueOrChildren.html',

			compile: function(element) {
	            return RecursionHelper.compile(element, function(scope, iElement, iAttrs, controller, transcludeFn){
	            	

	            	var update = function updateFn() {

	            		scope.safeValue = $sce.trustAsHtml(scope.value);

						if (scope.value != "" && scope.value != null && scope.children != null && scope.children.length > 0)
							throw new Error("Cannot render both value and children:\n\tVALUE:\n" +  JSON.stringify(scope.value, null, 2) + "\n\n\tCHILDREN:\n" + JSON.stringify(scope.children, null, 2));

						scope.contentChunks = []; // One of these for each chunk of content, where accordions may only appear on their own in a chunk.
						var currentChunk = [];
						for (var i in scope.children) {
							var c = scope.children[i];
							if (c.layout == "accordion") {
								if (currentChunk.length > 0)
									scope.contentChunks.push(currentChunk);
								var accordionChunk = [c];
								accordionChunk.isAccordion = true;
								scope.contentChunks.push(accordionChunk);
								currentChunk = [];
							} else {
								currentChunk.push(c);
							}
						}

						if (currentChunk.length > 0)
							scope.contentChunks.push(currentChunk);

					}


					scope.$watch('value', update);
					scope.$watch('children', update);
					scope.$watch('encoding', update);
	            });
	        }
		};
	}];
});