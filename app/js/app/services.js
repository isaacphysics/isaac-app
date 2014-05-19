'use strict';

define(["angular"], function() {

	/* Services */


	// Demonstrate how to register services
	// In this case it is a simple value service.
	angular.module('isaac.services', [])

		.value('version', '0.1');
});