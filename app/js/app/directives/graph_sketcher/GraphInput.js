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
                    // console.log(scope.state.curves);
                    console.log("checking answer prev");
                    return (scope.dat.curves != undefined);
                    console.log(scope.dat.curves);
                    // return (scope.state.curves != undefined && scope.state.freeSymbols != undefined );
                }

                // console.log("previous answer check");
                // console.log(isTherePreviousAnswer());

                scope.edit = function() {
                    $rootScope.showGraphSketcher(scope.state, scope.questionDoc, scope.editorMode, scope.dat).then(function(finalState) {
                        scope.state = finalState;
                        scope.$apply();
                    });
                };

                // scope.$watch(scope.state, function(s) {
                //     if (s && s.result) {
                //         console.log("graph previewing")
                //         katex.render(s.result.tex, element.find(".graph-preview")[0]);
                //     } else if (scope.questionDoc) {
                //         console.log("enter ans")
                //         element.find(".graph-preview").html("Click to enter your answer");
                //     } else {
                //         console.log("enter graph")
                //         element.find(".graph-preview").html("Click to enter a graph");
                //     }
                // })

            }
        };
    }];
});
