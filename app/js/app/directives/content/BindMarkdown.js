define(["showdown"], function() {


	return ["$parse", function($parse) {


		return {

			restrict: 'A',
			priority: 0,

			link: function(scope, element, attrs) {
				var Showdown = require("showdown");
				var converter = new Showdown.converter();

				var parsed = $parse(attrs.bindMarkdown|| element.html());
				var markdown = (parsed(scope) || "").toString();
				var converted = converter.makeHtml(markdown);
				element.html(converted);
			}
		};
	}];
});