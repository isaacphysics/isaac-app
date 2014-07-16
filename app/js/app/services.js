'use strict';

define(["angular", "angular-resource", "app/services/Api", "app/services/Tags"], function() {

	/* Services */


	// Demonstrate how to register services
	// In this case it is a simple value service.
	angular.module('isaac.services', ['ngResource'])

	.value('version', '0.1')

	.factory('tags', require("app/services/Tags"))

	.provider('api', function ApiProvider() {

		// In here we might look at the URL of the page to decide whether to connect to a remote API server or use the local one.
		// For now, just rely on specific app config, or assume the server is local.

		var server = "";

		this.server = function(value) {
			server = value;
		}

		this.$get = ["$resource", function ApiFactory($resource) {

			var Api = require("app/services/Api");

			return new Api($resource, server);
				
		}];
	})




});