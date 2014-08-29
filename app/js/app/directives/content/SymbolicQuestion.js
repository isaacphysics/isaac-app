define(["app/honest/responsive_video"], function(rv) {

	return ["api", function(api) {

		return {
			scope: true,

			restrict: 'A',

			templateUrl: "/partials/content/SymbolicQuestion.html",

			link: function(scope, element, attrs) {

				scope.doc = undefined;
				scope.$parent.$watch(attrs.isaacSymbolicQuestion, function(newDoc) {
					scope.doc = newDoc;
				});

				scope.activateTab = function(i) {
					scope.activeTab = i;
					rv.updateAll();	
					if (i > -1) {
						api.logger.log({
							type : "VIEW_HINT",
							questionId : scope.doc.id,
							hintIndex : i,
						})
					}					
				}

				scope.activateTab(-1); // Activate "Answer now" tab by default.
			}
		};
	}];
});