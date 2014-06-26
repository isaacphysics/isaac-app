'use strict';

define([
	"angular", 
	"app/filters", 
	"app/services", 
	"app/directives", 
	"app/controllers/GenericPageControllers",
	"app/controllers/ConceptPageControllers",
	"app/controllers/ConceptIndexControllers",
	"app/controllers/QuestionIndexControllers",
	"app/controllers/QuestionPageControllers",
	"app/controllers/HomePageControllers",
	"app/controllers/ContentErrorControllers"
	], function() {
	
	var genericPageControllers = require("app/controllers/GenericPageControllers");

	var conceptPageControllers = require("app/controllers/ConceptPageControllers");
	var conceptIndexControllers = require("app/controllers/ConceptIndexControllers");

	var questionPageControllers = require("app/controllers/QuestionPageControllers");
	var questionIndexControllers = require("app/controllers/QuestionIndexControllers");

	var homePageControllers = require("app/controllers/HomePageControllers");

	var contentErrorController = require("app/controllers/ContentErrorControllers");

	/* Controllers */

	angular.module('isaac.controllers', [])
	
	.controller('GenericPageController', genericPageControllers.PageController)
	
	.controller('ConceptPageController', conceptPageControllers.PageController)

	.controller('ConceptIndexController', conceptIndexControllers.PageController)

	.controller('QuestionIndexController', questionIndexControllers.PageController)

	.controller('QuestionPageController', questionPageControllers.PageController)

	.controller('HomePageController', homePageControllers.PageController)

	.controller('ContentErrorController', contentErrorController.PageController)

	.controller("LoadingMessageController", ["$scope", "$timeout", function($scope, $timeout) {

		var showLoadingMessageAfter = 1000; // ms
		
		var timeout = $timeout(function() {
			$scope.displayMessage = true;
		}, showLoadingMessageAfter);

		$scope.$on("$destroy", function() {
			$timeout.cancel(timeout);
		})
	}])
	
});