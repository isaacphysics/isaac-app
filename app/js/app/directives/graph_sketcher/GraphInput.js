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
                scope.isTherePreviousAnswer = function() {
                    return (scope.state.curves != undefined && scope.state.freeSymbols != undefined );
                }

                scope.edit = function() {
                    $rootScope.showGraphSketcher(scope.state, scope.questionDoc, scope.editorMode).then(function(finalState) {
                        // console.debug("json: ", JSON.stringify(finalState));
                        scope.state = finalState;
                        scope.$apply();
                    });
                };

            }
        };
    }];
});
