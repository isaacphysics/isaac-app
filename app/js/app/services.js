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

define(["angular", "angular-resource", "app/services/Api", "app/services/Tags", "app/services/Units", "app/services/Persistence", "app/services/FilterWarnings", "app/services/Auth", "app/services/GameBoardTitles"], function() {

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

	.provider('api', function ApiProvider() {

		// In here we might look at the URL of the page to decide whether to connect to a remote API server or use the local one.
		// For now, just rely on specific app config, or assume the server is local.

		var server = "";

		this.server = function(value) {
			server = value;
		}

		this.$get = ["$resource", "$http", function ApiFactory($resource, $http) {

			var Api = require("app/services/Api");

			return new Api($resource, server, $http);
				
		}];
	})

	.service('persistence', require("app/services/Persistence"))

	.service('auth', auth.service)

	.service('authResolver', auth.resolver)




});