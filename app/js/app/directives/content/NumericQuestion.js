define(["app/honest/responsive_video"], function(rv) {

	var allUnits = ["ns",
		"m^{-1}",
		"km\\,  s^ {-1}",
		"kg\\,m^2",
		"{m}\\,{s}^{-1}",
		"m\\,s^{-1}",
		"m \\, s^{-2}",
		"kg, m\\,  s^{-2}",
		"km\\,s^{-1}",
		"g\\,m^{2}",
		"s^2\\,m^{-3}",
		"radians",
		"rads",
		"hours",
		"kg\\,m^{2}\\,s^{-1}",
		"m \\, s^{-1}",
		"rad\\,s^{-1}",
		"rad\\,s^{-2}",
		"s^{-1}",
		"cm",
		"kg\\,m\\,s^{-1}",
		"^{\circ }",
		"N\\, m",
		"m\\, s^{-1}",
		"ms^{-1}",
		"N",
		"J\\, kg^{-1}",
		"J",
		"g\\,m^2",
		"W",
		"{rad}\\,{s}^{-1}",
		"rad\\, s^{-1}",
		"rad\\,s^{-2}",
		"m\\, s^{-2}",
		"mm",
		"rad \\, s^{-1}",
		"g",
		"{m}\\,{s}^{-2}",
		"m\\,s^{-2}",
		"ms",
		"m s^{-1}",
		"\%",
		"m",
		"degrees",
		"h",
		"kg\\, m\\, s^{-1}",
		"kg\\, m^2",
		"s",
		"mg\\,m^2",
		"m\\,  s^ {-1}",
		"kJ",
		"kg\\,m^{2}",
		"kg \\, s^{-1}",
		"^{\circ}",
		"km \\, h^{-1}",
		"rad",
		"ps"
	];

	return ["api", function(api) {

		return {
			scope: true,

			restrict: 'A',

			templateUrl: "/partials/content/NumericQuestion.html",

			link: function(scope, element, attrs) {

				scope.selectedChoice = {
					type: "quantity",
				};

				scope.toggleUnitsDropdown = function() {

					if (scope.unitsDropdownStyle) {
						scope.unitsDropdownStyle = null;
					} else {
						var btnPos = element.find("button").offset();
						var parent = element.find("button").parent().offset();

						scope.unitsDropdownStyle = {
							top: btnPos.top + btnPos.height - parent.top,
							left: btnPos.left - parent.left,
						}
					}
				}

				scope.unitOptions = [];

				// Add potential units to options list
				for (var i in scope.doc.choices) {
					var c = scope.doc.choices[i];

					if (c.units && scope.unitOptions.indexOf(c.units) == -1) 
						scope.unitOptions.push(c.units);
				}

				var unitsPool = JSON.parse(JSON.stringify(allUnits));

				while (scope.unitOptions.length < 6) {
					var u = unitsPool.splice(Math.floor(Math.random() * unitsPool.length), 1)[0];

					if (scope.unitOptions.indexOf(u) == -1)
						scope.unitOptions.push(u);
				}


				scope.selectedUnitsDisplay = "";

				scope.selectUnit = function(u) {
					scope.selectedChoice.units = u;

					if (scope.selectedChoice.units != undefined) {
						if (scope.selectedChoice.units == "")
							scope.selectedUnitsDisplay = "None";
						else
							scope.selectedUnitsDisplay = "$\\units{" + scope.selectedChoice.units + "}$";
					} else {
						scope.selectedUnitsDisplay = "";
					}
					scope.chosenUnitsForDisplay = 
					scope.unitsDropdownStyle = null;
				}

			}
		};
	}];
});