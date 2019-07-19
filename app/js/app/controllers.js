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

	const genericPageControllers = require("./controllers/GenericPageControllers");

	const homePageControllers = require("./controllers/HomePageControllers");

	const conceptPageControllers = require("./controllers/ConceptPageControllers");
	const conceptIndexControllers = require("./controllers/ConceptIndexControllers");

	const questionPageControllers = require("./controllers/QuestionPageControllers");

	const gameBoardsControllers = require("./controllers/GameBoardsControllers");

	const myBoardsPageControllers = require("./controllers/MyBoardsPageControllers");

	const contentErrorController = require("./controllers/ContentErrorControllers");

	const loginControllers = require("./controllers/LoginControllers");

	const loginPageControllers = require("./controllers/LoginPageControllers");

	const searchControllers = require("./controllers/SearchControllers");

	const accountSettingsPageControllers = require("./controllers/AccountSettingsPageControllers");

	const contactPageControllers = require("./controllers/ContactControllers");

	const resetPasswordControllers = require("./controllers/ResetPasswordControllers");

	const verifyEmailPageControllers = require("./controllers/VerifyEmailPageControllers");

	const headerControllers = require("./controllers/HeaderControllers");

	const authErrorPageControllers = require("./controllers/AuthErrorPageControllers");

	const adminPageControllers = require("./controllers/AdminPageControllers");

	const adminEmailController = require("./controllers/AdminEmailController");

	const adminUserManagerController = require("./controllers/AdminUserManagerController");

	const gameEditorControllers = require("./controllers/GameEditorControllers");

	const groupManagementPageControllers = require("./controllers/GroupManagementPageControllers");

	const myProgressPageControllers = require("./controllers/MyProgressPageControllers");

	const assignmentsController = require("./controllers/AssignmentsController")

	const assignmentProgressPageControllers = require("./controllers/AssignmentProgressPageControllers");

	const eventsControllers = require("./controllers/EventsControllers");

	const booksControllers = require("./controllers/BooksControllers");

	const teacherFeaturesPageController = require("./controllers/TeacherFeaturesPageController");

	const equalityPageController = require("./controllers/EqualityPageController");
	const sketcherPageController = require("./controllers/SketcherPageController");

	const supportPageControllers = require("./controllers/SupportControllers");

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

	.controller('AdminStatsSummaryController', adminPageControllers.AdminStatsSummaryController)

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

	.controller('EqualityPageController', equalityPageController.PageController)
	.controller('SketcherPageController', sketcherPageController.PageController)

	.controller('SupportPageController', supportPageControllers.PageController)
});
