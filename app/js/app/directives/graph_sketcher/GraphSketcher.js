"use strict";
define(function(require) {

    var MySketch = require("inequality").MySketch;

    return ["$timeout", "$rootScope", "api", function($timeout, $rootScope, api) {

        return {
            scope: true,
            restrict: "A",
            templateUrl: "/partials/graph_sketcher/graph_sketcher.html",
            link: function(scope, element, attrs) {

                element.on("touchstart touchmove", "canvas", function(e) {
                    e.preventDefault();
                });

                var sketch = null;
                scope.title = "Sketcher";
                scope.canvasOffset = {};
                scope.draggingNewSymbol = false;
                scope.equationEditorElement = element;


                scope.logOnClose = function(event) {
                    // This ought to catch people who navigate away without closing the editor!
                    if (scope.log != null) {
                        scope.log.actions.push({
                            event: "NAVIGATE_AWAY",
                            timestamp: Date.now()
                        });
                        api.logger.log(scope.log);
                    }
                };



                $rootScope.showGraphSketcher = function(initialState, questionDoc, editorMode) {

                    return new Promise(function(resolve, reject) {





                        $(".result-preview>span").empty();
                        $(".result-preview").width(0);

                        var eqnModal = $('#equationModal');
                        eqnModal.one("opened.fndtn.reveal", function() {
                            element.find(".top-menu").css("bottom", scope.equationEditorElement.height());
                        });

                        eqnModal.foundation("reveal", "open");
                        scope.state = initialState || {
                            symbols: []
                        };
                        scope.questionDoc = questionDoc;
                        scope.editorMode = editorMode;


                        scope.log = {
                            type: "EQN_EDITOR_LOG",
                            questionId: scope.questionDoc ? scope.questionDoc.id : null,
                            screenSize: {
                                width: window.innerWidth,
                                height: window.innerHeight
                            },
                            actions: [{
                                event: "OPEN",
                                timestamp: Date.now()
                            }]
                        };

                        // Log just before the page closes if tab/browser closed:
                        window.addEventListener("beforeunload", scope.logOnClose);
                        // Log the editor being closed and submit log event to server:
                        eqnModal.one("close", function(e) {
                            scope.log.finalState = [];
                            sketch.symbols.forEach(function(e) {
                                scope.log.finalState.push(e.subtreeObject(true, true));
                            });
                            scope.log.actions.push({
                                event: "CLOSE",
                                timestamp: Date.now()
                            });
                            if (scope.segueEnvironment == "DEV") {
                                console.log("\nLOG: ~" + (JSON.stringify(scope.log).length / 1000).toFixed(2) + "kb\n\n", JSON.stringify(scope.log));
                            }
                            window.removeEventListener("beforeunload", scope.logOnClose);
                            api.logger.log(scope.log);
                            scope.log = null;
                        });

                        scope.history = [JSON.parse(JSON.stringify(scope.state))];
                        scope.historyPtr = 0;
                        //element.find("canvas").remove();

                        // TODO: Redisplay old equations in the centre

                        scope.future = [];
                        var p = new p5(function(p) {
                            sketch = new MySketch(p, scope, element.width(), element.height(), scope.state.symbols);
                            $rootScope.sketch = sketch;
                            return sketch;
                        }, element.find(".equation-editor")[0]);

                        eqnModal.one("closed.fndtn.reveal", function() {
                            sketch.p.remove();
                            resolve(scope.state);
                        });

                    });
                };






                scope.submit = function() {
                    $("#equationModal").foundation("reveal", "close");
                };

                scope.centre = function() {
                    sketch.centre();
                }




            }
        };
    }];
});
