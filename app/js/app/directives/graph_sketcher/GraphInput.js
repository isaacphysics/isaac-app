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
