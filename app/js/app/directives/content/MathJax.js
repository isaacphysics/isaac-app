define(["app/MathJaxConfig"], function() {


	return ["$compile", function($compile) {


		return {

			restrict: 'A',

			link: function(scope, element, attrs) {

				// This must be done asynchronously. Content isn't actually in element yet. Don't really understand why...
				setTimeout(function() {
					MathJax.Hub.Queue(["Typeset",MathJax.Hub, element[0]]);      
				}, 1000);
				   
			}
		};
	}];
});