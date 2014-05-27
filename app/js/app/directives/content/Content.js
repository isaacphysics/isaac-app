define([], function() {


	return ["$compile", "RecursionHelper", function($compile, RecursionHelper) {

		return {

			scope: {
				doc: "=",
			},

			restrict: 'EA',

			templateUrl: '/partials/content/Content.html',

			compile: function(element) {
	            return RecursionHelper.compile(element, function(scope, iElement, iAttrs, controller, transcludeFn){
	            	// Post-link actions go here.

	            	if(scope.doc && scope.doc.layout=="right") {
	            		iElement.css("float", "right").width(300);
	            	}
	            });
	        }
		};
	}];
});