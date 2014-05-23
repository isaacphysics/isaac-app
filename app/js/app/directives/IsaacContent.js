define(["showdown"], function() {


	return ["$compile", function($compile) {

		function update(scope, element) {
			var Showdown = require("showdown");
			var converter = new Showdown.converter();

			if (!scope.doc)
				return;

			if (scope.doc.value) {

				// Convert the value to HTML, add it to the element.

				var html = converter.makeHtml(scope.doc.value);
				element.html(html);

			} else if (scope.doc.children) {

				// For each child, recursively create an isaac-content element for the child content object.

				for(var i in scope.doc.children) {
					var childScope = scope.$new(true);
					childScope.doc = scope.doc.children[i];
					var e = $compile('<isaac-content doc="doc" />')(childScope);
					element.append(e);						
				}

			}

		}

		return {

			scope: {
				doc: "=",
			},

			restrict: 'EA',

			link: function(scope, element, attrs) {
				scope.$watch("doc", function() {
					update(scope, element);
				})
			},
		};
	}];
});