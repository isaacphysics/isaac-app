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


	return ["$parse", "$compile", "$location", "$rootScope", function($parse, $compile, $location, $rootScope) {


		$rootScope.markdownLinkGo = function(url) {
			// If the link is external go ahead and return it
			if (url.indexOf("http://") == 0 || url.indexOf("https://") == 0) {
				return url;
			}
			
			// The link must be internal so add #! if required.
			if ($location.host().indexOf("localhost") > -1) {
				return "/#!" + url
			} else {
				return url;	
			}
		}

		return {
			scope: {
				md: "=",
			},
			restrict: 'A',
			priority: 0,

			link: function(scope, element, attrs) {

				var pageId = scope.$parent.page ? scope.$parent.page.id : "";

				// since we are in an isolated scope we need access to this function.
				scope.markdownLinkGo = $rootScope.markdownLinkGo;

				// since we are in an isolated scope we need access to this function.
				scope.markdownLinkGo = $rootScope.markdownLinkGo;

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
						replace: '<a ng-href="<lbr><lbr>markdownLinkGo(\'$2\')<rbr><rbr>" rel="nofollow">$1</a>',
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

				scope.$watch("md", function(markdown) {

					var converted = converter.makeHtml(markdown).replace('<a href="', '<a rel="nofollow" href="');
					
					var findAllLbs = /<lbr>/g;
					var findAllRbs = /<rbr>/g;
					var findAllDoubleLeftBraces = /{{/g;
					var findAllDoubleRightBraces= /}}/g;

					// we have to replace <lbr><lbr> and <rbr><rbr> with {{ }} before angular compiles. The need to add spaces to {{ }} is to cope with MathJax
					var replaced = converted.replace(findAllDoubleLeftBraces, "{ {").replace(findAllDoubleRightBraces, "} }").replace(findAllLbs, "{").replace(findAllRbs, "}")
					element.html($compile(replaced)(scope));

					$rootScope.requestMathjaxRender();

				});

			}
		};
	}];
});