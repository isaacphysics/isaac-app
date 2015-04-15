define([], function() {

	return ["$timeout", function($timeout) {

		return {
            scope: true,
			restrict: "A",
			templateUrl: "/partials/equation_editor/number_entry.html",
			link: function(scope, element, attrs) {
                scope.name+="NUMBER ENTRY"

                scope.currentNumber = "";
                scope.currentExponent = null;
                scope.currentSymbol = null;

                scope.buttonClick = function(btn) {
                	if (btn == "^") {
                		scope.currentExponent = "";
                	} else {
                		if (scope.currentExponent != null) {
                			scope.currentExponent += btn;
                		} else {
		                	scope.currentNumber += btn;
                		}
                	}
                }

                scope.clearInput = function() {
                	scope.currentExponent = null;
                	scope.currentNumber = "";
                }

                var updateInputPadding = function() {
                	$timeout(function() {
                		$(element).find("input").css("padding-right", $(element).find(".input-exponent").width() + 10);
                	});
                };

                var updateSymbol = function() {

                	scope.currentSymbol = {
                		type: "string",
                        fontSize: 48,
                		label: scope.currentNumber,
                        texLabel: true,
                	}

                	var expNum = parseFloat(scope.currentExponent);

                	if (scope.currentNumber == "" || isNaN(parseFloat(scope.currentSymbol.label))) {
                		scope.currentSymbol = null;
                		return;
                	}

                	if (scope.currentSymbol.label && scope.currentExponent != null && scope.currentExponent.length > 0) {
                		if (!isNaN(expNum)) {
                			scope.currentSymbol.label += "\n\\times 10^{" + expNum + "}";
                            scope.currentSymbol.labelClass = "tiny";
                		}
                	}


                	scope.currentSymbol.token = scope.currentSymbol.label;
                    scope.currentSymbol.fromCalc = true;
                };

                scope.$watch("currentNumber", updateSymbol);
                scope.$watch("currentExponent", updateSymbol);
                scope.$watch("currentExponent", updateInputPadding);

				scope.$on("symbolDrag", function($e, pageX, pageY, deltaX, deltaY) {
					if (pageY > element.offset().top + element.height()) {
						scope.$emit("triggerCloseMenus");
					}
				})

                scope.$on("symbolDrop", function($e, symbolSpec, pageX, pageY) {
                	if (pageY > element.offset().top + element.height()) {
                		scope.$emit("spawnSymbol", symbolSpec, pageX, pageY);
                	}
                });
			},
		};
	}];
});