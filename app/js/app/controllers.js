'use strict';

define([
	"angular", 
	"app/filters", 
	"app/services", 
	"app/directives", 
	"app/controllers/GenericPageControllers",
	"app/controllers/ConceptPageControllers",
	"app/controllers/ConceptsIndexPageControllers",
	"app/controllers/QuestionPageControllers"
	], function() {
	
	var genericPage = require("app/controllers/GenericPageControllers");
	var conceptPage = require("app/controllers/ConceptPageControllers");
	var conceptIndexPage = require("app/controllers/ConceptsIndexPageControllers");
	var questionPage = require("app/controllers/QuestionPageControllers");
	
	/* Controllers */

	angular.module('isaac.controllers', [])
	
	.controller('GenericPageHeaderController', genericPage.HeaderController)
	.controller('GenericPageBodyController', genericPage.BodyController)
	
	.controller('ConceptPageHeaderController', conceptPage.HeaderController)
	.controller('ConceptPageBodyController', conceptPage.BodyController)

	.controller('ConceptsIndexPageHeaderController', conceptIndexPage.HeaderController)
	.controller('ConceptsIndexPageBodyController', conceptIndexPage.BodyController)

	.controller('QuestionPageHeaderController', questionPage.HeaderController)
	.controller('QuestionPageBodyController', questionPage.BodyController)

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