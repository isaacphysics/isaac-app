define(function(require) {
    var templateUrl = require("/partials/graph_sketcher/graph_input.html");
    
    return ["$timeout", "$rootScope", "api", function($timeout, $rootScope, _api) {

        return {
            scope: {
                state: "=",
                questionDoc: "=",
            },

            restrict: "A",
            templateUrl: templateUrl,
            link: function(scope, _element, _attrs) {
                scope.isTherePreviousAnswer = function() {
                    return (scope.dat.curves != undefined);
                };

                scope.edit = function() {
                    $rootScope.showGraphSketcher(scope.state, scope.questionDoc, scope.editorMode).then(
                        function(finalState) {
                            scope.state = finalState;
                            scope.$apply();
                        },
                        function(exception) {
                            console.error("Exception interrupted Graph Sketcher result", exception);
                        }
                    );
                };
            }
        };
    }];
});
