'use strict';

define([
	"angular", 
	"app/filters", 
	"app/services", 
	"app/directives", 
	"app/controllers/GenericPageControllers",
	"app/controllers/ConceptPageControllers",
	], function() {
	
	var genericPage = require("app/controllers/GenericPageControllers");
	var conceptPage = require("app/controllers/ConceptPageControllers");
	
	/* Controllers */

	angular.module('isaac.controllers', [])
	
	.controller('GenericPageHeaderController', genericPage.HeaderController)
	.controller('GenericPageBodyController', genericPage.BodyController)
	
	.controller('ConceptPageHeaderController', conceptPage.HeaderController)
	.controller('ConceptPageBodyController', conceptPage.BodyController)
	
});