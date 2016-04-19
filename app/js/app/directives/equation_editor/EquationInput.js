define([], function() {

    return ["$timeout", "$rootScope", "api", function($timeout, $rootScope, api) {

        return {
            scope: {
                state: "=",
                questionDoc: "="
            },
            restrict: "A",
            templateUrl: "/partials/equation_editor/equation_input.html",
            link: function(scope, element, attrs) {

                scope.edit = function() {
                    $rootScope.showEquationEditor(scope.state, scope.questionDoc);
                    api.logger.log({
                        type : "OPEN_EQUATION_EDITOR",
                        questionId : scope.questionDoc.id
                    });
                };

                scope.$watch("state", function(s) {
                    // TODO Pick the largest expression and show it here.
                    console.log("watch(scope.state): ", s);
                    if (s.result && s.result.tex) {
                        katex.render(s.result.tex, element.find(".eqn-preview")[0]);
                    } else {
                        element.find(".eqn-preview").html("&nbsp;");                        
                    }
                }, true);
            }
        };
    }];
});