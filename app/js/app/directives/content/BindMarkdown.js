define(["showdown/showdown", "showdown/extensions/table"], function() {


	return ["$parse", "$compile", function($parse, $compile) {


		return {

			restrict: 'A',
			priority: 0,

			link: function(scope, element, attrs) {
				Showdown.extensions.refs = function(converter) {
					return [{
						type: "lang",
						regex: '(~D)?\\\\ref{([^}]*)}(~D)?',
						replace: '<span isaac-figure-ref="' + scope.page.id + '|$2"></span>',
					}];
				};

				var converter = new Showdown.converter({
					extensions: ["table", "refs"],
				});

				var parsed = $parse(attrs.bindMarkdown|| element.html());
				var markdown = (parsed(scope) || "").toString();
				var converted = converter.makeHtml(markdown);
				element.html($compile(converted)(scope));
			}
		};
	}];
});