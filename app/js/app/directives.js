'use strict';

define(["angular", "app/filters", "app/directives/IsaacContent", "app/directives/IsaacContentLoad"], function() {

	/* Directives */


	angular.module('isaac.directives', [])

	.directive('appVersion', ['version', function(version) {
	    return function(scope, elm, attrs) {
	    	elm.text(version);
	    };
	}])

	.directive('isaacContent', require("app/directives/IsaacContent"))

	.directive('isaacContentLoad', require("app/directives/IsaacContentLoad"))

});
