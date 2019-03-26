"use strict";

define(['/partials/graph_sketcher/graph_input.html'], function(templateUrl) {
    return ["$rootScope", function($rootScope) {

        return {
            scope: {
                state: "=",
                questionDoc: "=",
            },

            restrict: "A",
            templateUrl: templateUrl,
            link: function(scope, _element, _attrs) {
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

                // scope.$watch("state", function(s) {
                //     if (!s) {
                //         element.find(".graph-preview").html("Draw a graph");
                //     } 
                // });
            }
        };
    }];
});
