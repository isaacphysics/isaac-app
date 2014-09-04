define([], function() { 

	angular.module("isaac.templates",[])

	.run(["$templateCache", function($templateCache) {

		// The ngtemplates grunt task will replace this file with one that defines all the required HTML partial templates.

		// It is not strictly necessary to run the grunt task - without it all the templates will be loaded individually by the browser, which is just slower.

	}])
});