define(["app/honest/responsive_video"], function(rv) {

	return ["api", "units", function(api, units) {

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

				units.getUnits().then(function(allUnits) {

					// Add potential units to options list
					for (var i in scope.doc.choices) {
						var c = scope.doc.choices[i];

						if (c.units && scope.unitOptions.indexOf(c.units) == -1) 
							scope.unitOptions.push(c.units);
					}

					var unitsPool = JSON.parse(JSON.stringify(allUnits));

					while (scope.unitOptions.length < 6) {
						var u = unitsPool.splice(Math.floor(Math.random() * unitsPool.length), 1)[0].replace("\\\\", "\\");

						if (scope.unitOptions.indexOf(u) == -1)
							scope.unitOptions.push(u);
					}

					scope.selectedUnitsDisplay = "";

				})

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

				scope.$watch("validationResponse", function(r, oldR) {
					if (r === oldR) {
						console.warn("Init validationResponse",r)
						return; // Init
					}
					
					if(r) {

						scope.selectedChoice.value = r.answer.value;
						scope.selectUnit(r.answer.units);

						if (r.correct) {
							scope.accordionSection.titleSuffix = "$\\quantity{ " + scope.selectedChoice.value + " }{ " + (scope.selectedChoice.units || "") + " }$  ✓";
						} else {							
							scope.accordionSection.titleSuffix = "";
						}

						scope.accordionSection.correctAnswerFlag.isCorrect = r.correct;
					} else {

						// The user started changing their answer after a previous validation response.

						// Just in case this is the initialisation of scope.validationResponse, 
						// remove any watch the accordion might have.
						scope.accordionSection.correctAnswerFlag.unwatch();
					}

				})

			}
		};
	}];
});