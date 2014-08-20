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
	"app/controllers/MyBoardsPageControllers",
	"app/controllers/ContentErrorControllers",
	"app/controllers/LoginControllers",
	"app/controllers/SearchControllers",
	"app/controllers/AccountSettingsPageControllers",
	"app/controllers/ContactControllers",
	"app/controllers/ResetPasswordControllers"
	], function() {
	
	var genericPageControllers = require("app/controllers/GenericPageControllers");

	var conceptPageControllers = require("app/controllers/ConceptPageControllers");
	var conceptIndexControllers = require("app/controllers/ConceptIndexControllers");

	var questionPageControllers = require("app/controllers/QuestionPageControllers");
	var questionIndexControllers = require("app/controllers/QuestionIndexControllers");

	var homePageControllers = require("app/controllers/HomePageControllers");

	var myBoardsPageControllers = require("app/controllers/MyBoardsPageControllers");

	var contentErrorController = require("app/controllers/ContentErrorControllers");

	var loginControllers = require("app/controllers/LoginControllers");

	var searchControllers = require("app/controllers/SearchControllers");

	var accountSettingsPageControllers = require("app/controllers/AccountSettingsPageControllers");

	var contactPageControllers = require("app/controllers/ContactControllers");

	var resetPasswordControllers = require("app/controllers/ResetPasswordControllers");

	/* Controllers */

	angular.module('isaac.controllers', [])
	
	.controller('GenericPageController', genericPageControllers.PageController)
	
	.controller('ConceptPageController', conceptPageControllers.PageController)

	.controller('ConceptIndexController', conceptIndexControllers.PageController)

	.controller('QuestionIndexController', questionIndexControllers.PageController)

	.controller('QuestionPageController', questionPageControllers.PageController)

	.controller('HomePageController', homePageControllers.PageController)

	.controller('MyBoardsPageController', myBoardsPageControllers.PageController)

	.controller('ContentErrorController', contentErrorController.PageController)

	.controller('LoginController', loginControllers.PageController)

	.controller('SearchController', searchControllers.PageController)

	.controller('GlobalSearchController', searchControllers.GlobalSearchController)

	.controller('ContactController', contactPageControllers.PageController)

	.controller("LoadingMessageController", ["$scope", "$rootScope", "$timeout", function($scope, $rootScope, $timeout) {

		var showLoadingMessageAfter = 1000; // ms
		
		var timeout = $timeout(function() {
			$rootScope.globalFlags.displayLoadingMessage = true;
		}, showLoadingMessageAfter);

		$scope.$on("$destroy", function() {
			$timeout.cancel(timeout);
		})
	}])

	.controller('AccountSettingsPageController', accountSettingsPageControllers.PageController)

	.controller('ResetPasswordPageController', resetPasswordControllers.PageController)

});