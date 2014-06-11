define([], function() {


	return ["api", function(api) {

		return {
			scope: {
				doc: "=isaacQuickQuestion"
			},

			restrict: 'EA',

			templateUrl: "/partials/content/QuickQuestion.html",

			link: function(scope, element, attrs) {
		       
		       // extracted from honest/answer_reveal.js - code drop prior to 10/06/2014
		       var showHide = $(function()
		        {
		           // If 'show answer' clicked - reveal answer
		           $(".ru_answer_reveal div:first-child").click(function()
		           {
		               $(this).next("div").show();
		           });
		           // If close clicked - hide answer
		           $(".ru_answer_close").click(function()
		           {
		               $(this).parent().hide();
		           });
		        });	
			}
		};
	}];
});