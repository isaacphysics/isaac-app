define(["showdown/showdown", "showdown/extensions/table"], function() {


	return ["$parse", "$compile", "$location", function($parse, $compile, $location) {


		return {

			restrict: 'A',
			priority: 0,

			link: function(scope, element, attrs) {

				var pageId = scope.page ? scope.page.id : "";

				Showdown.extensions.refs = function(converter) {
					return [{
						type: "lang",
						regex: '(~D)?\\\\ref{([^}]*)}(~D)?',
						replace: '<span isaac-figure-ref="' + pageId + '|$2"></span>',
					}];
				};

				Showdown.extensions.links = function(converter) {
					return [{
						type: "lang",
						regex: '\\\\link{([^}]*)}{([^}]*)}',
						replace: '<a ng-click="markdownLinkGo(\'$2\')">$1</a>',
					}]
				};

				var converter = new Showdown.converter({
					extensions: ["table", "refs", "links"],
				});

				scope.markdownLinkGo = function(url) {
					if (url.indexOf("http://") == 0)
						document.location.href = url;
					else
						$location.url(url);
				}

				var parsed = $parse(attrs.bindMarkdown|| element.html());
				var markdown = (parsed(scope) || "").toString();
				var converted = converter.makeHtml(markdown);
				element.html($compile(converted)(scope));
			}
		};
	}];
});