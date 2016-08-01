define([], function() {

    return ["$timeout", "$rootScope", "api", function($timeout, $rootScope, api) {

        return {
            scope: true,
            restrict: "A",
            templateUrl: "/partials/graph_sketcher/graph_input.html",
            link: function(scope, element, attrs) {

              scope.edit = function() {
                console.log($rootScope.showGraphSketcher);
                  $rootScope.showGraphSketcher(scope.state, scope.questionDoc, scope.editorMode).then(function(finalState) {
                      alert("hello");
                  });

              };


            }
        };
    }];
});
