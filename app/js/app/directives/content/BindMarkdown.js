define(["showdown/showdown"], function() {


	return ["$parse", function($parse) {


		return {

			restrict: 'A',
			priority: 0,

			link: function(scope, element, attrs) {
				var converter = new Showdown.converter({
					extensions: ["table"],
				});

				var parsed = $parse(attrs.bindMarkdown|| element.html());
				var markdown = (parsed(scope) || "").toString();
				var converted = converter.makeHtml(markdown);
				element.html(converted);
			}
		};
	}];
});