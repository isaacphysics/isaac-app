define(["../../honest/responsive_video", "/partials/content/GraphSketcherQuestion.html"], function(rv, templateUrl) {

    return function() {
        
        return {
            scope: true,

            restrict: 'A',

            templateUrl: templateUrl,

            controller: ["$scope", function(scope) {
                let ctrl = this;

                if (scope.question.selectedChoice) {
                    // We have a previous answer. Load it.
                    try {
                        ctrl.formulaChoice = JSON.parse(scope.question.selectedChoice.value);
                    } catch (e) {
                        console.warn("Error loading previous answer: ", e.message);
                    }
                } else {
                    // We have no answer and no seed
                    ctrl.formulaChoice = {};
                }

                ctrl.plainDoc = JSON.parse(JSON.stringify(scope.doc));
                ctrl.plainDoc.type = "content";

                scope.$watch("ctrl.formulaChoice", function(f, oldF) {
                    
                    if (f === oldF) {
                        return; // Init
                    }
                    
                    if (f) {
                        scope.question.selectedChoice = {
                            type: "graphChoice",
                            value: JSON.stringify(f)
                        }
                    } else {
                        scope.question.selectedChoice = null;
                    }


                }, true);


            }],

            controllerAs: "ctrl",
        };
    };
});