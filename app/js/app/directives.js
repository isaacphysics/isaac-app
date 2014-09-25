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
'use strict';

define([ 
	"angular", 
	"angular-recursion", 
	"app/filters", 
	"app/directives/content/Content", 
	"app/directives/content/PageFragment", 
	"app/directives/content/ValueOrChildren", 
	"app/directives/content/MathJax",
	"app/directives/content/BindMarkdown",
	"app/directives/content/Image",
	"app/directives/content/Figure",
	"app/directives/content/FigureRef",
	"app/directives/content/Video",
	"app/directives/content/Tabs",
	"app/directives/content/Accordion",
	"app/directives/content/FeaturedProfile",
	"app/directives/content/QuestionTabs",
	"app/directives/content/MultiChoiceQuestion",
	"app/directives/content/NumericQuestion",
	"app/directives/content/SymbolicQuestion",
	"app/directives/content/QuickQuestion",
	"app/directives/content/QuestionRadioButton",
	"app/directives/FooterPods",
	"app/directives/DesktopPanel",
	"app/directives/MobilePanel",
	"app/directives/Hexagons",
	"app/directives/HexFilter",
	"app/directives/DifficultyFilter",
    "app/directives/ConceptFilter",
    "app/directives/PrintButton",
    "app/directives/ShareButton",
    "app/directives/SchoolDropdown",
	], function() {

	/* Directives */


	angular.module('isaac.directives', 
		['RecursionHelper'])

	.directive('appVersion', ['version', function(version) {
	    return function(scope, elm, attrs) {
	    	elm.text(version);
	    };
	}])

	// General Directives

	.directive('desktopPanel', require("app/directives/DesktopPanel"))

	.directive('mobilePanel', require("app/directives/MobilePanel"))

    .directive('printButton', require("app/directives/PrintButton"))

    .directive('shareButton', require("app/directives/ShareButton"))
	
	.directive('hexagons', require("app/directives/Hexagons"))
	
	.directive('hexFilter', require("app/directives/HexFilter"))
	
	.directive('difficultyFilter', require("app/directives/DifficultyFilter"))
	
	.directive('conceptFilter', require("app/directives/ConceptFilter"))

	.directive('footerPods', require("app/directives/FooterPods"))

	.directive('schoolDropdown', require("app/directives/SchoolDropdown"))

	// Content Directives

	.directive('mathJax', require("app/directives/content/MathJax"))

	.directive('bindMarkdown', require("app/directives/content/BindMarkdown"))

	.directive('isaacContent', require("app/directives/content/Content"))

	.directive('isaacPageFragment', require("app/directives/content/PageFragment"))

	.directive('isaacContentValueOrChildren', require("app/directives/content/ValueOrChildren"))

	.directive('isaacImage', require("app/directives/content/Image"))
	
	.directive('isaacFigure', require("app/directives/content/Figure"))

	.directive('isaacFigureRef', require("app/directives/content/FigureRef"))

	.directive('isaacVideo', require("app/directives/content/Video"))

	.directive('isaacTabs', require("app/directives/content/Tabs"))

	.directive('isaacAccordion', require("app/directives/content/Accordion"))

	.directive('isaacFeaturedProfile', require("app/directives/content/FeaturedProfile"))	

	.directive('isaacQuestionTabs', require("app/directives/content/QuestionTabs"))

	.directive('isaacMultiChoiceQuestion', require("app/directives/content/MultiChoiceQuestion"))

	.directive('isaacNumericQuestion', require("app/directives/content/NumericQuestion"))

	.directive('isaacSymbolicQuestion', require("app/directives/content/SymbolicQuestion"))

	.directive('isaacQuickQuestion', require("app/directives/content/QuickQuestion"))

	.directive('questionRadioButton', require("app/directives/content/QuestionRadioButton"))	

	.directive('fadeOnSearch', [function() {
		return {
			link: function(scope, element, attrs) {
				element.addClass("search-fade")
				scope.$watch("globalFlags.siteSearchOpen", function(searchOpen) {
					
		            if (searchOpen) {
		                element.addClass("search-fade-active");
		            } else {
		                element.removeClass("search-fade-active");
		            }
				})
			}
		}
	}])

	.directive('match', [function() {
		// From https://github.com/TheSharpieOne/angular-input-match
		return {
			require: 'ngModel',
			restrict: 'A',
			scope: {
				match: '='
			},
			link: function (scope, elem, attrs, ctrl) {
				scope.$watch(function () {
					return (ctrl.$pristine && angular.isUndefined(ctrl.$modelValue)) || scope.match === ctrl.$modelValue;
				}, function (currentValue) {
					ctrl.$setValidity('match', currentValue);
				});
			}
		}
	}])

	.directive('apiEnvironment', ["api", "$compile", function(api, $compile) {
		return {
			link: function(scope, element, attrs) {

				scope.env = api.environment.get();

				element.attr("ng-hide", "!env.segueEnvironment || env.segueEnvironment.toLowerCase() !='" + attrs["apiEnvironment"] + "'.toLowerCase()");
				element.attr("api-environment", null);

				$compile(element)(scope);
			}
		};
	}])

	.directive('scrollToOnAccordionOpen', ['$timeout',function($timeout) {
		return {
			link: function(scope, element) {
				scope.$on("accordionSectionOpened", function(e,i) {
					if (scope.accordionSection == i) {
						$timeout(function() {
							$("body").animate({
				                scrollTop: element.offset().top
				            }, 1000);        
						});
					}
				});
			},
		};
	}])
});
