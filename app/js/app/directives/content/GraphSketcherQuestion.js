define(["app/honest/responsive_video"], function(rv) {

    return ["api", function(api) {

        return {
            scope: true,

            restrict: 'A',

            templateUrl: "/partials/content/GraphSketcherQuestion.html",

            controller: ["$scope", function(scope) {
                var ctrl = this;

                scope.editorMode = 'chemistry';
                ctrl.selectedFormula = {
                    symbols: {}
                };

                if (scope.question.selectedChoice) {
                    // We have a previous answer. Load it.
                    console.debug("Loading the previous answer.");
                    try {
                        ctrl.selectedFormula = JSON.parse(scope.question.selectedChoice.value);
                    } catch (e) {
                        console.warn("Error loading previous answer: ", e.message);
                    }

                } else if (scope.doc.formulaSeed) {
                    // We have seed to load and no previous answer
                    console.debug("Loading the formula seed.", scope.doc.formulaSeed);
                    try {
                        ctrl.selectedFormula = {
                            symbols: JSON.parse(scope.doc.formulaSeed)
                        };
                    } catch (e) {
                        console.error("Error loading seed: ", e.message);
                    }


                } else {
                    // We have no answer and no seed
                    console.debug("No previous answer or seed.");
                    ctrl.selectedFormula = {
                        symbols: {}
                    };
                }



                ctrl.plainDoc = JSON.parse(JSON.stringify(scope.doc));
                ctrl.plainDoc.type = "content";

                scope.$watch("ctrl.selectedFormula", function(f, oldF) {
                    if (f === oldF) {
                        return; // Init
                    }

                    if (f) {
                        scope.question.selectedChoice = {
                            type: "graph",
                            value: JSON.stringify(f),
                            mhchemExpression: f.result ? f.result.mhchem : ""
                        }

                    } else {
                        scope.question.selectedChoice = null;
                    }
                }, true);

            }],

            controllerAs: "ctrl",
        };
    }];
});