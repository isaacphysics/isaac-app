'use strict';

define(["angular", "showdown"], function() {

	/* Filters */

	angular.module('isaac.filters', [])

	.filter('interpolate', ['version', function(version) {
		return function(text) {
			return String(text).replace(/\%VERSION\%/mg, version);
		};
	}])

	.filter('showdown', [function() {
		var Showdown = require("showdown");
		var converter = new Showdown.converter();

		return function(input) {
			return converter.makeHtml(input);
		}
	}])

});