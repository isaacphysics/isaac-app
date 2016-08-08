define([], function() {

    return ["$timeout", "$rootScope", "api", function($timeout, $rootScope, api) {

        return {
            scope: {
                state: "=",
                questionDoc: "=",
                
            },
            restrict: "A",
            templateUrl: "/partials/graph_sketcher/graph_input.html",
            link: function(scope, element, attrs) {

              scope.edit = function() {
                  $rootScope.showGraphSketcher(scope.state, scope.questionDoc, scope.editorMode).then(function(finalState) {
                      scope.state = finalState;
                      scope.$apply();
                  });
              };


            }
        };
    }];
});
