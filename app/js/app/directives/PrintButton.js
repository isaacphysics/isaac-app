/**
 * Copyright 2014 Nick Rogers
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
define([], function() {

    return ["api", function(api) {
        return {

            restrict: "A",

            template: '<div class="ru_print" ng-click="togglePrintingOptions()"></div>',

            link: function(scope, element, attrs) {

                var logPrintView = function() {
                    if (scope.page) {
                        var logMessage = {
                                type: "PRINT_PAGE",
                                pageType: scope.page.type,
                                pageId: scope.page.id,
                                printSettings: scope.printingVisibility,
                            };
                        api.logger.log(logMessage);
                    }
                }

                scope.printingOptionsVisible = false;

                scope.togglePrintingOptions = function(){
                    //If the page has no options, just print
                    if(scope.printingVisibility === undefined){
                        logPrintView();
                        window.print();
                    }
                    else{
                        scope.printingOptionsVisible = !scope.printingOptionsVisible;
                    }
                }

                scope.printdefault = function(){
                    //show everything in the default print
                    scope.printingVisibility.hints = false;

                    //Timeout required for page to update
                    setTimeout(function(){
                        logPrintView();
                        window.print();
                    }, 0)
                }

                scope.printWithOptions = function(showHints) {
                    scope.printingVisibility.hints = showHints;

                    //Timeout required for page to update
                    setTimeout(function(){
                        logPrintView();
                        window.print();
                    }, 0)
                };
            }

        };
    }]

});