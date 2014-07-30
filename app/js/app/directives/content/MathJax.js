define(["app/MathJaxConfig"], function() {


	return ["$compile", function($compile) {


		return {

			restrict: 'A',

			link: function(scope, element, attrs) {

				// This must be done asynchronously. Content isn't actually in element yet. Don't really understand why...
				var first = true;
				scope.$watch(function() {
					setTimeout(function() {
						MathJax.Hub.Queue(["Typeset",MathJax.Hub, element[0]]);      
					}, first ? 1000: 0);
					first = false;
				})
				   
			}
		};
	}];
});