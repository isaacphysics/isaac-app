define(["../../honest/responsive_video", "/partials/content/GraphSketcherQuestion.html"], function(rv, templateUrl) {

    return ["api", function(api) {
        
        return {
            scope: true,

            restrict: 'A',

            templateUrl: templateUrl,

            controller: ["$scope", function(scope) {
                let ctrl = this;

                ctrl.selectedFormula = {};

                if (scope.question.selectedChoice) {
                    // We have a previous answer. Load it.
                    try {
                        ctrl.selectedFormula = JSON.parse(scope.question.selectedChoice.graphData);
                    } catch (e) {
                        console.warn("Error loading previous answer: ", e.message);
                    }
                } else {
                    // We have no answer and no seed
                    ctrl.selectedFormula = {};
                }

                ctrl.plainDoc = JSON.parse(JSON.stringify(scope.doc));
                ctrl.plainDoc.type = "content";

                scope.$watch("ctrl.selectedFormula", function(f, oldF) {
                    
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