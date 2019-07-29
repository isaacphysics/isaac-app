"use strict";

define(['/partials/graph_sketcher/graph_input.html'], function(templateUrl) {
    return ["$rootScope", 'api', function($rootScope, api) {

        return {
            scope: {
                state: "=",
                questionDoc: "=",
                graphSpec: "=",
            },

            restrict: "A",
            templateUrl: templateUrl,
            link: function(scope, _element, _attrs) {
                scope.edit = function() {
                    $rootScope.showGraphSketcher(scope.state, scope.questionDoc, scope.editorMode, scope.graphSpec).then(
                        function(finalState) {
                            scope.state = finalState;
                            api.questionSpecification.getSpec({"type":"graphChoice","value":JSON.stringify(finalState)}).$promise.then(function(result){
                                scope.getSpec = result.results;
                                console.log(scope.getSpec);
                            });
                            scope.$apply();
                        },
                        function(exception) {
                            console.error("Exception interrupted Graph Sketcher result", exception);
                        }
                    );
                };

                // scope.$watch("state", function(s) {
                //     if (!s) {
                //         element.find(".graph-preview").html("Draw a graph");
                //     } 
                // });
            }
        };
    }];
});
