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

define(function(require) {

	require('angular-recursion');

	angular.module('isaac.templates', []);

	/* Directives */
	angular.module('isaac.directives',
		['RecursionHelper'])

	.directive('appVersion', ['version', function(version) {
	    return function(_scope, elm, _attrs) {
	    	elm.text(version);
	    };
	}])

	// General Directives

	.directive('desktopPanel', require("./directives/DesktopPanel"))

	.directive('mobilePanel', require("./directives/MobilePanel"))

    .directive('printButton', require("./directives/PrintButton"))

    .directive('shareButton', require("./directives/ShareButton"))

	.directive('hexagons', require("./directives/Hexagons"))

	.directive('hexFilter', require("./directives/HexFilter"))

	.directive('difficultyFilter', require("./directives/DifficultyFilter"))

	.directive('footerPods', require("./directives/FooterPods"))

	.directive('schoolDropdown', require("./directives/SchoolDropdown"))

	.directive('questionPod', require("./directives/QuestionPod"))

	.directive('globalNavigation', require("./directives/GlobalNavigation"))

	.directive('podCarousel', require("./directives/PodCarousel"))

	.directive('podCarouselItem', require("./directives/PodCarouselItem"))

	.directive('hexCarousel', require("./directives/HexCarousel"))

	.directive('hexCarouselItem', require("./directives/HexCarouselItem"))

	.directive('d3Donut', require("./directives/d3/Donut"))

	.directive('d3Plot', require("./directives/d3/Plot"))

	.directive('d3Bar', require("./directives/d3/Bar"))

	.directive('progressBar', require("./directives/ProgressBar"))

	.directive('fastTrackProgressBar', require("./directives/FastTrackProgressBar"))

	.directive('toast', require("./directives/Toast"))

	.directive('loadingOverlay', require("./directives/LoadingOverlay"))

	.directive('isaacModal', require("./directives/IsaacModal"))

	.directive('jsonLdWriter', require("./directives/JsonLdWriter"))

	.directive('onRepeatRender', ['$timeout', function ($timeout) {
		return {
			restrict: 'A',
			link: function (scope, element, attr) {
				if (scope.$last === true) {
					$timeout(function () {
						scope.$emit(attr.onRepeatRender);
					});
				}
			}
		}
	}])

	// Equation Editor Directives

	.directive('equationEditor', require("./directives/equation_editor/EquationEditor"))

	.directive('elementsMenu', require("./directives/equation_editor/ElementsMenu"))

	.directive('equationInput', require("./directives/equation_editor/EquationInput"))

	.directive('topMenu', require("./directives/equation_editor/TopMenu"))

	.directive('subMenu', require("./directives/equation_editor/SubMenu"))

	.directive('menuSymbol', require("./directives/equation_editor/MenuSymbol"))

	.directive('symbolMenu', require("./directives/equation_editor/SymbolMenu"))

	.directive('numberEntry', require("./directives/equation_editor/NumberEntry"))

	.directive('canvasSymbol', require("./directives/equation_editor/CanvasSymbol"))

	.directive('selectionHandle', require("./directives/equation_editor/SelectionHandle"))

	// Sketcher directives
	.directive('graphInput', require("./directives/graph_sketcher/GraphInput"))
	
	.directive('graphSketcher', require("./directives/graph_sketcher/GraphSketcher"))

	.directive('graphPreview', require("./directives/graph_sketcher/GraphPreview"))


	// Content Directives

	.directive('mathJax', require("./directives/content/MathJax"))

	.directive('bindMarkdown', require("./directives/content/BindMarkdown"))

	.directive('isaacContent', require("./directives/content/Content"))

	.directive('isaacPageFragment', require("./directives/content/PageFragment"))

	.directive('isaacContentValueOrChildren', require("./directives/content/ValueOrChildren"))

	.directive('isaacImage', require("./directives/content/Image"))

	.directive('isaacFigure', require("./directives/content/Figure"))

	.directive('isaacFigureRef', require("./directives/content/FigureRef"))

	.directive('isaacVideo', require("./directives/content/Video"))

	.directive('isaacTabs', require("./directives/content/Tabs"))

	.directive('isaacAccordion', require("./directives/content/Accordion"))

	.directive('isaacHorizontal', require("./directives/content/Horizontal"))

	.directive('isaacFeaturedProfile', require("./directives/content/FeaturedProfile"))

	.directive('isaacQuestionTabs', require("./directives/content/QuestionTabs"))

	.directive('isaacMultiChoiceQuestion', require("./directives/content/MultiChoiceQuestion"))

	.directive('isaacNumericQuestion', require("./directives/content/NumericQuestion"))

	.directive('isaacSymbolicQuestion', require("./directives/content/SymbolicQuestion"))

	.directive('isaacSymbolicChemistryQuestion', require("./directives/content/SymbolicChemistryQuestion"))

	.directive('isaacSymbolicLogicQuestion', require("./directives/content/SymbolicLogicQuestion"))

	.directive('isaacGraphSketcherQuestion', require("./directives/content/GraphSketcherQuestion"))

	.directive('isaacStringMatchQuestion', require("./directives/content/StringMatchQuestion"))

	.directive('isaacQuickQuestion', require("./directives/content/QuickQuestion"))

	.directive('isaacPod', require("./directives/content/Pod"))

	.directive('anvilApp', require("./directives/content/AnvilApp"))

	.directive('isaacAnvilQuestion', require("./directives/content/AnvilQuestion"))

	.directive('inputAnimation', require("./directives/content/InputAnimation"))

	.directive('eventBookingForm', require("./directives/EventBookingForm"))

	.directive('fadeOnSearch', [function() {
		return {
			link: function(scope, element, _attrs) {
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

	.directive('syncSearchFocus', [function() {
		return {
			link: function(scope, element, _attrs) {
				element.addClass("search-fade")
				scope.$watch("globalFlags.siteSearchOpen", function(searchOpen) {

	            if (searchOpen) {
	            	setTimeout(function(){
	                	element[0].focus();
	            	}, 1);
	            } else {
	                element[0].blur();
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
					if (scope.accordionSection == i && !e.foundSection) {
						$timeout(function() {
							$("html,body").animate({
				                scrollTop: element.offset().top
				            }, 1000);
						});
						// Prevent nested accordions from also scrolling.
						e.foundSection = true;
					}
				});
			},
		};
	}])

	.directive('ngContent', ["$rootScope", function() {
		return {
			scope: {
				ngContent: "=",
			},
			link: function(scope, element, _attrs) {
				scope.$watch("ngContent", function(newContent) {
					element.attr("content", newContent);
				})
			}
		}
	}])

	.directive("ngScopeElement", [function () {
	  let directiveDefinitionObject = {

	    restrict: "A",

	    compile: function compile(_tElement, _tAttrs, _transclude) {
	      return {
	          pre: function preLink(scope, iElement, iAttrs, _controller) {
	            scope[iAttrs.ngScopeElement] = iElement;
	          }
	        };
	    }
	  };

	  return directiveDefinitionObject;
	}])

});
