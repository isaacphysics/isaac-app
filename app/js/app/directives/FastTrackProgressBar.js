define(['jquery', "/partials/fasttrack_progress_bar.html"], function($, templateUrl) {
    return ['$location', function(_$location) {
        return {
            restrict: 'A',

            scope: {
                boardState: '=gameboard',
                currentPage: '=page',
            },

            templateUrl: templateUrl,

            link: function(scope, element, _attrs) {
                let svgElement = function(tagName) {
                    return $(document.createElementNS("http://www.w3.org/2000/svg", tagName));
                };

                let questionPartStatesGroup = element.find("div.ft-progress-bar > svg g#question-part-states");
                let questionSeparatorsGroup = element.find("div.ft-progress-bar > svg g#question-separators");
                scope.progressBarHeight = 45;
                let inProgressMask = 'url(#inProgressMask)';
                let highlightMask = 'url(#highlightMask)';
                let highlightColour = 'white';
                scope.FT_STATES = {
                    ft_top_ten: {tagName:'ft_top_ten', colour:'#009acd'}, // keep in sync with _settings.scss $ft-top-ten-colour or import the value
                    ft_upper: {tagName:'ft_upper', colour:'#fea100'}, // keep in sync with _settings.scss $ft-upper-colour or import the value
                    ft_lower: {tagName:'ft_lower', colour:'#7fd0ff'}, // keep in sync with _settings.scss $ft-lower-colour or import the value
                };

                let evaluateProgress = function(boardState, currentlyWorkingOn) {
                    let progressValues = [];
                    for (let i = 0; i < boardState.questions.length; i++) {
                        let question = boardState.questions[i];
                        let questionPartStates = [];
                        let workingOnThisPage = (question.id == currentlyWorkingOn.title) ? currentlyWorkingOn.level : null;
                        if (question.state == 'PERFECT') {
                            questionPartStates.push({
                                state: scope.FT_STATES.ft_top_ten.tagName,
                                currentlyWorkingOn: null,
                            });
                        } else {
                            for (let j = 0; j < question.questionPartConcepts.length; j++) {
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

                let renderProgress = function(progressValues) {
                    let questionWidth = 100 / progressValues.length;
                    for (let i = 0; i < progressValues.length; i++) {
                        let questionOffset = i * questionWidth;
                        let questionParts = progressValues[i].states;
                        let questionPartWidth = questionWidth / questionParts.length;
                        let questionCompleted = true;
                        for (let j = 0; j < questionParts.length; j++) {
                            let questionPartOffset = questionOffset + j * questionPartWidth;
                            let questionPartState = questionParts[j].state;
                            let currentlyWorkingOnThisConcept = questionParts[j].currentlyWorkingOn;
                            let questionPartColour = questionPartState ? scope.FT_STATES[questionPartState].colour : 'none';
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
                                let currentPartColour = scope.FT_STATES[currentlyWorkingOnThisConcept].colour;
                                let selectedColour = currentPartColour;
                                let selectedMask = inProgressMask;
                                if (currentPartColour == questionPartColour) {
                                    selectedColour = highlightColour;
                                    selectedMask = highlightMask;
                                }
                                questionPartStatesGroup.append(
                                    svgElement('rect').attr({
                                        width: questionPartWidth + '%',
                                        height: scope.progressBarHeight,
                                        x: questionPartOffset + '%',
                                        y: 0,
                                        fill: selectedColour,
                                        stroke: selectedColour,
                                        mask: selectedMask,
                                    })
                                )
                            }
                            questionCompleted &= questionPartState == scope.FT_STATES.ft_top_ten.tagName;
                        }
                        let topTenQuestion = progressValues[i];
                        let questionSeparatorAnchor = svgElement('a').attr({'href':"/questions/" + topTenQuestion.id + '?board=' + scope.boardState.id});
                        questionSeparatorAnchor
                            .append(svgElement('title')
                                .text(topTenQuestion.title + (topTenQuestion.currentlyWorkingOn ? ' (Current)' : ''))
                            )
                            .append(svgElement('rect').attr({
                                id: 'question-separator' + i,
                                width: questionWidth + '%',
                                height: scope.progressBarHeight,
                                x: questionOffset + '%',
                                y: 0,
                                fill: 'none',
                                stroke: 'black',
                                'stroke-width': 2
                            }))
                        if (topTenQuestion.currentlyWorkingOn) {
                            let selectedColour = scope.FT_STATES[topTenQuestion.currentlyWorkingOn].colour;
                            let selectedMask = inProgressMask;
                            if (questionCompleted) {
                                selectedColour = highlightColour;
                                selectedMask = highlightMask;
                            }
                            questionSeparatorAnchor
                            .append(
                                svgElement('rect').attr({
                                    id: 'in-progress-separator-' + i,
                                    width: questionWidth + '%',
                                    height: scope.progressBarHeight,
                                    x: questionOffset + '%',
                                    y: 0,
                                    stroke: 'black',
                                    'stroke-width': 2,
                                    fill: selectedColour,
                                    mask: selectedMask,
                                    'shape-rendering': 'crispEdges',
                                })
                            )
                        }
                        let doubleDigitNumber =  (i + 1 > 9);
                        let numberOffset = (questionOffset + (questionWidth / 2)) - (doubleDigitNumber ? 1.6 : 0.8);
                        questionSeparatorAnchor
                            .append(svgElement('text').attr({
                                'font-family': 'Exo 2',
                                'font-size': 26,
                                'font-style': 'italic',
                                'font-weight': '900',
                                'fill': 'black',
                                'stroke': '#eee',
                                'stroke-width': '1',
                                'stroke-linejoin': 'round',
                                'stroke-linecap': 'round',
                                'x': numberOffset + '%',
                                'y': '68%',
                                'shape-rendering': 'geometricPrecision',
                            }).text(i+1))
                        questionSeparatorsGroup.append(questionSeparatorAnchor);
                    }
                }

                let update = function() {
                    if (scope.boardState.$resolved) {
                        let workingOn = {
                            title: scope.currentPage.tags.indexOf(scope.FT_STATES.ft_top_ten.tagName) >= 0 ? scope.currentPage.id : scope.currentPage.title,
                            level: scope.currentPage.tags.indexOf(scope.FT_STATES.ft_top_ten.tagName) >= 0 ? scope.FT_STATES.ft_top_ten.tagName : (scope.currentPage.tags.indexOf(scope.FT_STATES.ft_upper.tagName) >= 0) ? scope.FT_STATES.ft_upper.tagName : scope.FT_STATES.ft_lower.tagName,
                        }
                        let progressValues = evaluateProgress(scope.boardState, workingOn);
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