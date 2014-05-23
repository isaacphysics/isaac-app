'use strict';

define(["angular", "app/filters", "app/services", "app/directives", "app/controllers/GenericPageControllers"], function() {
	
	var genericPage = require("app/controllers/GenericPageControllers");
	
	/* Controllers */

	angular.module('isaac.controllers', [])
	
	.controller('GenericPageHeaderController', genericPage.HeaderController)

	.controller('GenericPageBodyController', genericPage.BodyController);
});