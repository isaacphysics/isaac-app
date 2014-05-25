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
					}



					scope.$watch('value', update);
					scope.$watch('children', update);
					scope.$watch('encoding', update);
	            });
	        }
		};
	}];
});