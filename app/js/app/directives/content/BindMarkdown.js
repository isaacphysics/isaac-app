/**
 * Copyright 2014 Ian Davies
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at
 * 		http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
define(["lib/showdown/showdown", "lib/showdown/extensions/table"], function() {


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
						replace: '<a href="javascript:void(0)" ng-click="markdownLinkGo(\'$2\')" rel="nofollow">$1</a>',
					}]
				};				

				Showdown.extensions.glossary = function(converter) {
					return [{
						type: "lang",
						regex: '\\*\\*Glossary\\*\\*',
						replace: '[**Glossary**](/glossary)',
					}];
				};

				Showdown.extensions.concepts = function(converter) {
					return [{
						type: "lang",
						regex: '\\*\\*Concepts\\*\\*',
						replace: '[**Concepts**](/concepts)',
					}];
				};

				var converter = new Showdown.converter({
					extensions: ["table", "refs", "links", "glossary", "concepts"],
				});

				scope.markdownLinkGo = function(url) {

					// TODO: If the target is local, but doesn't exist, the 404 page redirects back iummediately. Work out why.
					if (url.indexOf("http://") == 0)
						document.location.href = url;
					else
						$location.url(url);
				}

				var parsed = $parse(attrs.bindMarkdown|| element.html());
				var markdown = (parsed(scope) || "").toString();
				var converted = converter.makeHtml(markdown).replace('<a href="', '<a rel="nofollow" href="');
				element.html($compile(converted.replace("{{", "{ {").replace("}}", "} }"))(scope));
			}
		};
	}];
});