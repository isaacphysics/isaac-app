define(["showdown", "app/MathJaxConfig"], function() {


	return ["$compile", function($compile) {

		function update(scope, element) {
			var Showdown = require("showdown");
			var converter = new Showdown.converter();

			if (!scope.doc)
				return;

			if (scope.doc.value) {

				switch (scope.doc.encoding) {
					case "html":
						var html = scope.doc.value;
						break;
					case "markdown":
						var html = converter.makeHtml(scope.doc.value);
						break;
					default:
						var html = "Invalid document encoding: " + scope.doc.encoding;
						break;
				}
				
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
            MathJax.Hub.Queue(["Typeset",MathJax.Hub, element[0]]);         

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