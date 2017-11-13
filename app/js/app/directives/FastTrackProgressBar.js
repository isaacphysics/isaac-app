define(['jquery'], function($) {
    return ['$location', function($location) {
        return {
            restrict: 'A',

            scope: {
                boardState: '=gameboard',
                currentPage: '=page',
            },

            templateUrl: "/partials/fasttrack_progress_bar.html",

            link: function(scope, element, attrs) {
                var svgElement = function(tagName) {
                    return $(document.createElementNS("http://www.w3.org/2000/svg", tagName));
                };

                var questionPartStatesGroup = element.find("div.ft-progress-bar > svg g#question-part-states");
                var questionSeparatorsGroup = element.find("div.ft-progress-bar > svg g#question-separators");
                scope.progressBarHeight = 45;
                var ruGreen = '#509e2e';

                scope.FT_STATES = {
                    ft_top_ten: {tagName:'ft_top_ten', colour:'#009acd'},//'#2c7fb8'},//'#009acd'},
                    ft_upper: {tagName:'ft_upper', colour:'#00b8f4'},//'#41b6c4'},//'#00b8f4'},
                    ft_lower: {tagName:'ft_lower', colour:'#7fd0ff'},//'#a1dab4'},//'#7fd0ff'},
                };

                var evaluateProgress = function(boardState, currentlyWorkingOn) {
                    var progressValues = [];
                    for (var i = 0; i < boardState.questions.length; i++) {
                        var question = boardState.questions[i];
                        var questionPartStates = [];
                        var workingOnThisPage = (question.id == currentlyWorkingOn.title) ? currentlyWorkingOn.level : null;
                        if (question.state == 'PERFECT') {
                            questionPartStates.push({
                                state: scope.FT_STATES.ft_top_ten.tagName,
                                currentlyWorkingOn: null,
                            });
                        } else {
                            for (var j = 0; j < question.questionPartConcepts.length; j++) {
                                questionPartStates.push({
                                    state: question.questionPartConcepts[j].bestLevel,
                                    currentlyWorkingOn: (question.questionPartConcepts[j].title == currentlyWorkingOn.title) ? currentlyWorkingOn.level : null,
                                });
                            }
                        }
                        progressValues.push({id:question.id, title:question.title, states:questionPartStates, currentlyWorkingOn:workingOnThisPage});
                    }
                    return progressValues;
                }

                var renderProgress = function(progressValues) {
                    var questionWidth = 100 / progressValues.length;
                    for (var i = 0; i < progressValues.length; i++) {
                        var questionOffset = i * questionWidth;
                        var questionParts = progressValues[i].states;
                        var questionPartWidth = questionWidth / questionParts.length;
                        var questionCompleted = true;
                        for (var j = 0; j < questionParts.length; j++) {
                            var questionPartOffset = questionOffset + j * questionPartWidth;
                            var questionPartState = questionParts[j].state;
                            var currentlyWorkingOnThisConcept = questionParts[j].currentlyWorkingOn;
                            var questionPartColour = questionPartState ? scope.FT_STATES[questionPartState].colour : 'none';
                            questionPartStatesGroup.append(
                                svgElement('rect').attr({
                                    id: 'question-part' + i + '_' + j,
                                    width: questionPartWidth + '%',
                                    height: scope.progressBarHeight,
                                    x: questionPartOffset + '%',
                                    y: 0,
                                    fill: questionPartColour,
                                    stroke: questionPartColour,
                                })
                            );
                            if (currentlyWorkingOnThisConcept) {
                                var currentPartColour = scope.FT_STATES[currentlyWorkingOnThisConcept].colour;
                                var elementColour = currentPartColour == questionPartColour ? ruGreen : currentPartColour;
                                questionPartStatesGroup.append(
                                    svgElement('rect').attr({
                                        width: questionPartWidth + '%',
                                        height: scope.progressBarHeight,
                                        x: questionPartOffset + '%',
                                        y: 0,
                                        fill: elementColour,
                                        stroke: elementColour,
                                        mask: 'url(#inProgressMask)',
                                    })
                                )
                            }
                            questionCompleted &= questionPartState == scope.FT_STATES.ft_top_ten.tagName;
                        }
                        var topTenQuestion = progressValues[i];
                        var title = topTenQuestion.title;
                        questionSeparatorsGroup.append(
                            svgElement('a').attr({'href':"/questions/" + topTenQuestion.id + '?board=' + scope.boardState.id})
                                .append(svgElement('title').text(topTenQuestion.title))
                                .append(svgElement('rect').attr({
                                    id: 'question-separator' + i,
                                    width: questionWidth + '%',
                                    height: scope.progressBarHeight,
                                    x: questionOffset + '%',
                                    y: 0,
                                    fill: 'none',
                                    stroke: 'black'
                                })
                            )
                        );
                        if (topTenQuestion.currentlyWorkingOn) {
                            var currentColour = scope.FT_STATES[topTenQuestion.currentlyWorkingOn].colour;
                            var fillColour = questionCompleted ? ruGreen : currentColour;
                            questionSeparatorsGroup
                            .append(
                                svgElement('rect').attr({
                                    id: 'in-progress-separator-' + i,
                                    width: questionWidth + '%',
                                    height: scope.progressBarHeight,
                                    x: questionOffset + '%',
                                    y: 0,
                                    fill: fillColour,
                                    mask: 'url(#inProgressMask)',
                                })
                            )
                        }
                    }
                }

                var update = function() {
                    if (scope.boardState.$resolved) {
                        scope.boardState = scope.boardState;
                        var workingOn = {
                            title: scope.currentPage.tags.includes(scope.FT_STATES.ft_top_ten.tagName) ? scope.currentPage.id : scope.currentPage.title,
                            level: scope.currentPage.tags.includes(scope.FT_STATES.ft_top_ten.tagName) ? scope.FT_STATES.ft_top_ten.tagName : (scope.currentPage.tags.includes(scope.FT_STATES.ft_upper.tagName)) ? scope.FT_STATES.ft_upper.tagName : scope.FT_STATES.ft_lower.tagName,
                        }
                        var progressValues = evaluateProgress(scope.boardState, workingOn);
                        renderProgress(progressValues);
                    }
                }

                scope.$watch('boardState', function(newValue, oldValue) {
                    if (newValue !== oldValue) {
                        scope.boardState.$promise.then(update);
                    }
                });
                scope.boardState.$promise.then(update);
            }
        }
    }]
});