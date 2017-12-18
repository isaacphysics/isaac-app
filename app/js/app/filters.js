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

define(["angular", "lib/showdown/showdown.js", "lib/showdown/extensions/table.js"], function() {

	/* Filters */

	angular.module('isaac.filters', [])

	.filter('interpolate', ['version', function(version) {
		return function(text) {
			return String(text).replace(/\%VERSION\%/mg, version);
		};
	}])
	.filter('capitalize', [function() {
		return function(input) {
			return (!!input) ? input.charAt(0).toUpperCase() + input.substring(1).toLowerCase() : "";
		}
	}])
	.filter('showdown', [function() {
		var Showdown = require("lib/showdown/showdown.js");
		var converter = new Showdown.converter({
			extensions: ["table"],
		});

		return function(input) {
			return converter.makeHtml(input);
		}
	}])
	.filter('indexToPart', [function() {
		return function(input) {
			return String.fromCharCode(65 + input);
		}
	}])
	.filter('splitCapitalize', [function() {
		return function(input) {
			var splitInput = input.split(' ');
			var out = [];
			for (var i = 0; i < splitInput.length; i++) {
				var segment = splitInput[i];
				out.push(segment.charAt(0).toUpperCase() + segment.substring(1).toLowerCase())
			}
			return out.join(' ');
		};
	}])
	.filter('splitList', [function() {
		return function(input) {
			var splitInput = input.split(' ');
			return (splitInput.length > 1) ? [splitInput.slice(0,-1).join(', '), splitInput.slice(-1)].join(' & ') : input;
		};
	}])

});
