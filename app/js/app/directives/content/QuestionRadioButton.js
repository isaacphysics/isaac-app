define(["honest-lib/anim_check"], function() {


	return ["api", function(api) {
		var uniqueId = 1;
		var uniqueLabel = 1;
		return {
			scope: {
				choice: "=questionRadioButton"
			},

			restrict: 'EA',

			templateUrl: "/partials/content/QuestionRadioButton.html",

			link: function(scope, element, attrs) {
				var labelId = 'r' + uniqueLabel++;
				var item = 'r' + uniqueId++;

            	element.find('input').attr('id' , item);
            	element.find('label').attr('for' , labelId);

				initRadioButtons();
			}
		};
	}];
});

