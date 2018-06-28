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

	var genericPageControllers = require("./controllers/GenericPageControllers");

	var homePageControllers = require("./controllers/HomePageControllers");

	var conceptPageControllers = require("./controllers/ConceptPageControllers");
	var conceptIndexControllers = require("./controllers/ConceptIndexControllers");

	var questionPageControllers = require("./controllers/QuestionPageControllers");

	var gameBoardsControllers = require("./controllers/GameBoardsControllers");

	var myBoardsPageControllers = require("./controllers/MyBoardsPageControllers");

	var contentErrorController = require("./controllers/ContentErrorControllers");

	var loginControllers = require("./controllers/LoginControllers");

	var loginPageControllers = require("./controllers/LoginPageControllers");

	var searchControllers = require("./controllers/SearchControllers");

	var accountSettingsPageControllers = require("./controllers/AccountSettingsPageControllers");

	var contactPageControllers = require("./controllers/ContactControllers");

	var resetPasswordControllers = require("./controllers/ResetPasswordControllers");

	var verifyEmailPageControllers = require("./controllers/VerifyEmailPageControllers");

	var headerControllers = require("./controllers/HeaderControllers");

	var authErrorPageControllers = require("./controllers/AuthErrorPageControllers");

	var adminPageControllers = require("./controllers/AdminPageControllers");

	var adminEmailController = require("./controllers/AdminEmailController");

	var adminUserManagerController = require("./controllers/AdminUserManagerController");

	var gameEditorControllers = require("./controllers/GameEditorControllers");

	var groupManagementPageControllers = require("./controllers/GroupManagementPageControllers");

	var myProgressPageControllers = require("./controllers/MyProgressPageControllers");

	var assignmentsController = require("./controllers/AssignmentsController")

	var assignmentProgressPageControllers = require("./controllers/AssignmentProgressPageControllers");

	var eventsControllers = require("./controllers/EventsControllers");

	var booksControllers = require("./controllers/BooksControllers");

	var teacherFeaturesPageController = require("./controllers/TeacherFeaturesPageController");

	var questionsPageControllers = require("./controllers/QuestionsPageControllers");

	var equalityPageController = require("./controllers/EqualityPageController");
	var sketcherPageController = require("./controllers/SketcherPageController");

	var supportPageControllers = require("./controllers/SupportControllers");

	/* Controllers */

	angular.module('isaac.controllers', [])

	.controller('GenericPageController', genericPageControllers.PageController)

	.controller('HomePageController', homePageControllers.PageController)

	.controller('ConceptPageController', conceptPageControllers.PageController)

	.controller('ConceptIndexController', conceptIndexControllers.PageController)

	.controller('QuestionPageController', questionPageControllers.PageController)

	.controller('GameBoardsController', gameBoardsControllers.PageController)

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

	.controller('AdminUserManagerController', adminUserManagerController.PageController)

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

	.controller('BooksController', booksControllers.PageController)
	.controller('TeacherFeaturesPageController', teacherFeaturesPageController.PageController)

	.controller('QuestionsPageControllers', questionsPageControllers.PageController)
	.controller('EqualityPageController', equalityPageController.PageController)
	.controller('SketcherPageController', sketcherPageController.PageController)

	.controller('SupportPageController', supportPageControllers.PageController)
});
