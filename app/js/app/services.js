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

	var auth = require("app/services/Auth");

	// Demonstrate how to register services
	// In this case it is a simple value service.
	angular.module('isaac.services', ['ngResource'])

	.value('version', '0.1')

	// TODO: This should probably be a service rather than a factory
	.service('tags', require("app/services/Tags"))

	.factory('units', require("app/services/Units"))

	.factory('filterWarnings', require("app/services/FilterWarnings"))

	.factory('gameBoardTitles', require("app/services/GameBoardTitles"))

	.factory('boardSearchOptions', require("app/services/BoardSearchOptions"))

	.factory('questionActions', require("app/services/QuestionActions"))

	.provider('api', function ApiProvider() {

		var urlPrefix = "";

		this.urlPrefix = function(value) {
			urlPrefix = value;
		}

		this.$get = ["$resource", "$http", "subject", function ApiFactory($resource, $http, subject) {

			var Api = require("app/services/Api");

			return new Api($resource, urlPrefix, $http, subject);
				
		}];
	})

	.provider('subject', function SubjectProvider() {

		var subject = require("app/services/Subject")();

		for(var k in subject) {
			this[k] = subject[k];
		}
		
		this.$get = function() { return subject; };
	})

	.service('persistence', require("app/services/Persistence"))

	.service('auth', auth.service)

	.factory('promiseLoggedIn', auth.promiseLoggedIn)

	.constant('EditorURL', "https://editor.isaacphysics.org/#!/edit/master/")

	.constant('QUESTION_TYPES', ["isaacMultiChoiceQuestion", "isaacNumericQuestion", "isaacSymbolicQuestion", "isaacSymbolicChemistryQuestion", "isaacAnvilQuestion"])

});