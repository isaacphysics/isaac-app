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
	"app/directives/content/Tabs",
	"app/directives/content/Accordion",
	"app/directives/content/FeaturedProfile",
	"app/directives/content/MultiChoiceQuestion",
	"app/directives/content/QuickQuestion",
	"app/directives/content/QuestionRadioButton",
	"app/directives/DesktopPanel",
	"app/directives/MobilePanel",
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

	// Content Directives

	.directive('mathJax', require("app/directives/content/MathJax"))

	.directive('bindMarkdown', require("app/directives/content/BindMarkdown"))

	.directive('isaacContent', require("app/directives/content/Content"))

	.directive('isaacContentLoad', require("app/directives/content/ContentLoad"))

	.directive('isaacContentValueOrChildren', require("app/directives/content/ValueOrChildren"))

	.directive('isaacImage', require("app/directives/content/Image"))
	
	.directive('isaacFigure', require("app/directives/content/Figure"))

	.directive('isaacTabs', require("app/directives/content/Tabs"))

	.directive('isaacAccordion', require("app/directives/content/Accordion"))

	.directive('isaacFeaturedProfile', require("app/directives/content/FeaturedProfile"))	

	.directive('isaacMultiChoiceQuestion', require("app/directives/content/MultiChoiceQuestion"))

	.directive('isaacQuickQuestion', require("app/directives/content/QuickQuestion"))

	.directive('questionRadioButton', require("app/directives/content/QuestionRadioButton"))	



});
