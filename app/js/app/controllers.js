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
	"app/controllers/LoginPageControllers",
	"app/controllers/SearchControllers",
	"app/controllers/AccountSettingsPageControllers",
	"app/controllers/ContactControllers",
	"app/controllers/ResetPasswordControllers",
	"app/controllers/VerifyEmailPageControllers",
	"app/controllers/HeaderControllers",
	"app/controllers/AuthErrorPageControllers",
	"app/controllers/AdminPageControllers",
	"app/controllers/AdminEmailController",
	"app/controllers/GameEditorControllers",
	"app/controllers/GroupManagementPageControllers",
	"app/controllers/MyProgressPageControllers",
	"app/controllers/AssignmentsController",	
	"app/controllers/AssignmentProgressPageControllers",
	"app/controllers/EventsControllers",
	"app/controllers/BooksControllers",
	"app/controllers/TeacherFeaturesPageController",			
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

	var loginPageControllers = require("app/controllers/LoginPageControllers");

	var searchControllers = require("app/controllers/SearchControllers");

	var accountSettingsPageControllers = require("app/controllers/AccountSettingsPageControllers");

	var contactPageControllers = require("app/controllers/ContactControllers");

	var resetPasswordControllers = require("app/controllers/ResetPasswordControllers");

	var verifyEmailPageControllers = require("app/controllers/VerifyEmailPageControllers");

	var headerControllers = require("app/controllers/HeaderControllers");

	var authErrorPageControllers = require("app/controllers/AuthErrorPageControllers");

	var adminPageControllers = require("app/controllers/AdminPageControllers");

	var adminEmailController = require("app/controllers/AdminEmailController");

	var gameEditorControllers = require("app/controllers/GameEditorControllers");

	var groupManagementPageControllers = require("app/controllers/GroupManagementPageControllers");
	
	var myProgressPageControllers = require("app/controllers/MyProgressPageControllers");

	var assignmentsController = require("app/controllers/AssignmentsController")

	var assignmentProgressPageControllers = require("app/controllers/AssignmentProgressPageControllers");

	var eventsControllers = require("app/controllers/EventsControllers");

	var booksControllers = require("app/controllers/BooksControllers");

	var teacherFeaturesPageController = require("app/controllers/TeacherFeaturesPageController");

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
	.controller('LoginPageController', loginPageControllers.PageController)

	.controller('SearchController', searchControllers.PageController)

	.controller('GlobalSearchController', searchControllers.GlobalSearchController)

	.controller('ContactController', contactPageControllers.PageController)

	.controller('AccountSettingsPageController', accountSettingsPageControllers.PageController)

	.controller('ResetPasswordPageController', resetPasswordControllers.PageController)

	.controller('VerifyEmailPageController', verifyEmailPageControllers.PageController)

	.controller('HeaderController', headerControllers.PageController)

	.controller('AuthErrorPageController', authErrorPageControllers.PageController)
	
	.controller('AdminPageController', adminPageControllers.PageController)

	.controller('AdminEmailController', adminEmailController.PageController)

	.controller('AdminStatsPageController', adminPageControllers.AdminStatsPageController)
	.controller('AnalyticsPageController', adminPageControllers.AnalyticsPageController)	
	.controller('AdminEventBookingController', adminPageControllers.AdminEventBookingController)

	.controller('GameEditorControllers', gameEditorControllers.PageController)

	.controller('GroupManagementPageController', groupManagementPageControllers.PageController)

	.controller('MyProgressPageController', myProgressPageControllers.PageController)

	.controller('AssignmentProgressPageController', assignmentProgressPageControllers.PageController)
	.controller('SetAssignmentsPageController', assignmentsController.SetAssignmentsPageController)

	.controller('MyAssignmentsPageController', assignmentsController.MyAssignmentsPageController)

	.controller('EventsPageController', eventsControllers.ListController)
	.controller('EventDetailController', eventsControllers.DetailController)

	.controller('BooksControllers', booksControllers.PageController)
	.controller('TeacherFeaturesPageController', teacherFeaturesPageController.PageController)
});