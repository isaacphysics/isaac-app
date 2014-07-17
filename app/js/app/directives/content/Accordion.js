define([], function() {


	return [function() {

		return {

			scope: true,

			restrict: 'A',

			templateUrl: "/partials/content/Accordion.html",

			link: function(scope, element, attrs) {

				scope.$parent.$watch(attrs.doc, function(newDoc) {
					scope.doc = newDoc;
				});
				
				// Work out whether we're on a question page. If we are, open the first accordion section. Otherwise, only open it if it is the first item on the page.
				var isOnQuestionPage = false;
				var p = scope;
				while(p = p.$parent) {
					if (!p.doc)
						continue;

					if (p.doc.type == "isaacQuestionPage")
						isOnQuestionPage = true;
				}

				scope.openChildren = {
					0: scope.contentChunkIndex == 0 || isOnQuestionPage,
				};

				scope.toggleChild = function(i) {
					scope.openChildren[i] = !scope.openChildren[i];
				}

			}
		};
	}];
});