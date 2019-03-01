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

 	/* Services */

 	let auth = require("./services/Auth");

	// Demonstrate how to register services
	// In this case it is a simple value service.
	angular.module('isaac.services', ['ngResource'])

	.value('version', '0.1')

	// TODO: This should probably be a service rather than a factory
	.service('tags', require("./services/Tags"))

	.service('searchResults', require("./services/SearchResults"))

	.factory('units', require("./services/Units"))

	.factory('filterWarnings', require("./services/FilterWarnings"))

	.factory('gameBoardTitles', require("./services/GameBoardTitles"))

	.factory('boardSearchOptions', require("./services/BoardSearchOptions"))

	.factory('questionActions', require("./services/QuestionActions"))

	.provider('api', function ApiProvider() {

		let urlPrefix = "";

		this.urlPrefix = function(value) {
			urlPrefix = value;
		}

		this.$get = ["$resource", "$http", "subject", function ApiFactory($resource, $http, subject) {

			let Api = require("./services/Api");

			return new Api($resource, urlPrefix, $http, subject);
		}];
	})

	.provider('subject', function SubjectProvider() {

		let subject = require("./services/Subject")();

		for(let k in subject) {
			this[k] = subject[k];
		}
		
		this.$get = function() { return subject; };
	})

	.service('boardProcessor', require("./services/BoardProcessor"))

	.service('persistence', require("./services/Persistence"))

	.service('auth', auth.service)

	.service('equationEditor', require("./services/EquationEditor"))

	.factory('promiseLoggedIn', auth.promiseLoggedIn)

	.constant('EditorURL', "https://editor.isaacphysics.org/#!/edit/master/")

	.constant('QUESTION_TYPES', ["isaacMultiChoiceQuestion", "isaacNumericQuestion", "isaacSymbolicQuestion", "isaacSymbolicChemistryQuestion", "isaacSymbolicLogicQuestion", "isaacAnvilQuestion"])

	.constant('fastTrackProgressEnabledBoards', ['ft_core_2017', 'ft_core_2018'])
});