'use strict';

define(["angular", "angular-resource", "app/services/Api", "app/services/Tags", "app/services/Units", "app/services/Persistence", "app/services/FilterWarnings", "app/services/Auth"], function() {

	/* Services */

	var auth = require("app/services/Auth");

	// Demonstrate how to register services
	// In this case it is a simple value service.
	angular.module('isaac.services', ['ngResource'])

	.value('version', '0.1')

	// TODO: This should probably be a service rather than a factory
	.factory('tags', require("app/services/Tags"))

	.factory('units', require("app/services/Units"))

	.factory('filterWarnings', require("app/services/FilterWarnings"))

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