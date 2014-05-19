'use strict';

define(["angular", "angular-route", "app/filters"], function() {

	/* Directives */


	angular.module('isaac.directives', [])

	.directive('appVersion', ['version', function(version) {
	    return function(scope, elm, attrs) {
	    	elm.text(version);
	    };
	}]);

});
