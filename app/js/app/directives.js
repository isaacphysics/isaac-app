'use strict';

define([ 
	"angular", 
	"angular-recursion", 
	"app/filters", 
	"app/directives/content/Content", 
	"app/directives/content/ContentLoad", 
	"app/directives/content/ValueOrChildren", 
	"app/directives/content/MathJax",
	"app/directives/content/BindMarkdown",
	"app/directives/content/Image",
	"app/directives/content/Figure",
	"app/directives/content/Video",
	"app/directives/content/Tabs",
	"app/directives/content/Accordion",
	"app/directives/content/FeaturedProfile",
	"app/directives/content/QuestionTabs",
	"app/directives/content/MultiChoiceQuestion",
	"app/directives/content/NumericQuestion",
	"app/directives/content/QuickQuestion",
	"app/directives/content/QuestionRadioButton",
	"app/directives/DesktopPanel",
	"app/directives/MobilePanel",
	"app/directives/Hexagons",
	"app/directives/HexFilter",
	"app/directives/DifficultyFilter",
	"app/directives/ConceptFilter",
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
	
	.directive('hexagons', require("app/directives/Hexagons"))
	
	.directive('hexFilter', require("app/directives/HexFilter"))
	
	.directive('difficultyFilter', require("app/directives/DifficultyFilter"))
	
	.directive('conceptFilter', require("app/directives/ConceptFilter"))

	// Content Directives

	.directive('mathJax', require("app/directives/content/MathJax"))

	.directive('bindMarkdown', require("app/directives/content/BindMarkdown"))

	.directive('isaacContent', require("app/directives/content/Content"))

	.directive('isaacContentLoad', require("app/directives/content/ContentLoad"))

	.directive('isaacContentValueOrChildren', require("app/directives/content/ValueOrChildren"))

	.directive('isaacImage', require("app/directives/content/Image"))
	
	.directive('isaacFigure', require("app/directives/content/Figure"))

	.directive('isaacVideo', require("app/directives/content/Video"))

	.directive('isaacTabs', require("app/directives/content/Tabs"))

	.directive('isaacAccordion', require("app/directives/content/Accordion"))

	.directive('isaacFeaturedProfile', require("app/directives/content/FeaturedProfile"))	

	.directive('isaacQuestionTabs', require("app/directives/content/QuestionTabs"))

	.directive('isaacMultiChoiceQuestion', require("app/directives/content/MultiChoiceQuestion"))

	.directive('isaacNumericQuestion', require("app/directives/content/NumericQuestion"))

	.directive('isaacQuickQuestion', require("app/directives/content/QuickQuestion"))

	.directive('questionRadioButton', require("app/directives/content/QuestionRadioButton"))	



});
