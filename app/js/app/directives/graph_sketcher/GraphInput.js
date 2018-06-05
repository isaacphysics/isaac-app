define(function(require) {
    
    return ["$timeout", "$rootScope", "api", function($timeout, $rootScope, api) {

        return {
            scope: {
                state: "=",
                questionDoc: "=",
            },

            restrict: "A",
            templateUrl: "/partials/graph_sketcher/graph_input.html",
            link: function(scope, element, attrs) {
                console.log("prev test");
                isTherePreviousAnswer = function() {
                    return (scope.dat.curves != undefined);
                }

                scope.edit = function() {
                    $rootScope.showGraphSketcher(scope.state, scope.questionDoc, scope.editorMode, scope.dat).then(function(finalState) {
                        scope.state = finalState;
                        scope.$apply();
                    });
                };
            }
        };
    }];
});
