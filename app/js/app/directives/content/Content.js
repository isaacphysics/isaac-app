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
	            	});

	            	if(scope.doc && scope.doc.layout=="right") {
	            		iElement.css("float", "right").width(300);
	            	}
	            });
	        }
		};
	}];
});