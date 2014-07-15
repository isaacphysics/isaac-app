'use strict';

define(["angular", "showdown/showdown", "showdown/extensions/table"], function() {

	/* Filters */

	angular.module('isaac.filters', [])

	.filter('interpolate', ['version', function(version) {
		return function(text) {
			return String(text).replace(/\%VERSION\%/mg, version);
		};
	}])

	.filter('showdown', [function() {
		var Showdown = require("showdown/showdown");
		var converter = new Showdown.converter({
			extensions: ["table"],
		});

		return function(input) {
			return converter.makeHtml(input);
		}
	}])

});