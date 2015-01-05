define([], function() {

	return ["$timeout", function($timeout) {

		return {
			scope: true,
			restrict: "A",
			templateUrl: "/partials/equation_editor/equation_editor.html",
			link: function(scope, element, attrs) {

                scope.equationEditorElement = element;

                scope.editorClick = function() {
                    scope.$broadcast("closeMenus");
                }

                scope.$on("triggerCloseMenus", function() {
                	scope.$broadcast("closeMenus");
                })

                scope.$on("triggerResizeMenu", function() {
                	scope.$broadcast("resizeMenu");
                })

                scope.state = {
					symbols: { 
						"ssym-0": {
							x: 330,
							y: 242,
							spec: {
								fontSize: 48,
								token: "x",
								type: "string"
							}
						},
						"ssym-1": {
							x: 370,
							y: 206,
							spec: {
								fontSize: 48,
								token: "y",
								type: "string"
							}
						},
						"ssym-2": {
							x: 309.5,
							y: 210,
							spec: {
								width: 157,
								height: 128,
								type: "container",
								subType: "sqrt"
							}
						},
						"ssym-3": {
							x: 285,
							y: 233,
							spec: {
								fontSize: 48,
								token: "3",
								type: "string"
							}
						},				
					},
                };


			},

		};
	}];
});