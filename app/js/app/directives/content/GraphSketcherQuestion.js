define(["app/honest/responsive_video"], function(rv) {

    return ["api", function(api) {
        
        return {
            scope: true,

            restrict: 'A',

            templateUrl: "/partials/content/GraphSketcherQuestion.html",

            controller: ["$scope", function(scope) {
                var ctrl = this;

                ctrl.selectedFormula = {};

                if (scope.question.selectedChoice) {
                    // We have a previous answer. Load it.
                    console.debug("Loading the previous answer.");
                    try {
                        ctrl.selectedFormula = JSON.parse(scope.question.selectedChoice.graphData);
                    } catch (e) {
                        console.warn("Error loading previous answer: ", e.message);
                    }
                } else {
                    // We have no answer and no seed
                    console.debug("No previous answer.");
                    ctrl.selectedFormula = {};
                }

                ctrl.plainDoc = JSON.parse(JSON.stringify(scope.doc));
                ctrl.plainDoc.type = "content";

                scope.$watch("ctrl.selectedFormula", function(f, oldF) {
                    console.debug("ctrl.selectedFormula", f);
                    
                    if (f === oldF) {
                        return; // Init
                    }
                    
                    if (f) {
                        scope.question.selectedChoice = {
                            type: "graphChoice",
                            graphData: JSON.stringify(f)
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