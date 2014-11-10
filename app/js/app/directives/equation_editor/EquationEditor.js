define([], function() {

	return ["$timeout", function($timeout) {

		return {
			restrict: "A",
			templateUrl: "/partials/equation_editor/equation_editor.html",
			link: function(scope, element, attrs) {

                scope.equationEditorElement = element;

                scope.editorClick = function() {
                    scope.$broadcast("closeMenus");
                }
			},

		};
	}];
});