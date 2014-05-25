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
	], function() {

	/* Directives */


	angular.module('isaac.directives', 
		['RecursionHelper'])

	.directive('appVersion', ['version', function(version) {
	    return function(scope, elm, attrs) {
	    	elm.text(version);
	    };
	}])

	.directive('mathJax', require("app/directives/content/MathJax"))

	.directive('bindMarkdown', require("app/directives/content/BindMarkdown"))

	.directive('isaacContent', require("app/directives/content/Content"))

	.directive('isaacContentLoad', require("app/directives/content/ContentLoad"))

	.directive('isaacContentValueOrChildren', require("app/directives/content/ValueOrChildren"))

});
