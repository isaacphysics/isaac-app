define(['jquery', '/partials/fasttrack_progress_bar.html'], function($, templateUrl) {
    return ['$rootScope', '$stateParams', 'persistence', 'api', function($rootScope, $stateParams, persistence, api) {
        return {
            restrict: 'A',

            scope: {
                boardState: '=gameboard',
                currentPage: '=page',
            },

            templateUrl: templateUrl,

            link: function(scope, htmlElement, _attrs) {
                let fastTrackStates = ['ft_top_ten', 'ft_upper', 'ft_lower'];

                let getFastTrackLevel = function(tags) {
                    for (let state of fastTrackStates) {
                        if (tags.indexOf(state) != -1) {
                            return state;
                        }
                    }
                };

                let categoriseConceptQuestions = function(conceptQuestions) {
                    let result = null;
                    if (conceptQuestions !== null) {
                        result = {
                            upperLevelQuestions: conceptQuestions.filter(question => getFastTrackLevel(question.tags) === 'ft_upper'),
                            lowerLevelQuestions: conceptQuestions.filter(question => getFastTrackLevel(question.tags) === 'ft_lower'),
                        };
                    }
                    return result; 
                }

                let svgElement = function(tagName) {
                    return $(document.createElementNS('http://www.w3.org/2000/svg', tagName));
                };

                let moveTo = function(x, y) {
                    return 'M' + x + ' ' + y;
                };

                let line = function(x, y) {
                    return 'L' + x + ' ' + y;
                };

                let getCurrentlyWorkingOn = function() {
                    return {
                        id: scope.currentPage.id,
                        title: scope.currentPage.title,
                        fastTrackLevel: getFastTrackLevel(scope.currentPage.tags),
                        isConcept: getFastTrackLevel(scope.currentPage.tags) != 'ft_top_ten',
                    };
                };

                let calculateDashArray = function(elements, evaluator, perimiterLength) {
                    if (elements === undefined) {
                        return null;
                    }
                    let sectionLength = perimiterLength / elements.length;
                    let recordingDash = true;
                    let lengthCollector = 0;
                    let dashArray = [];
                    for (let element of elements) {
                        let shouldRecordDash = evaluator(element);
                        if (shouldRecordDash === recordingDash) {
                            lengthCollector += sectionLength;
                        } else {
                            dashArray.push(lengthCollector);
                            recordingDash = !recordingDash;
                            lengthCollector = sectionLength;
                        }
                    }
                    dashArray.push(lengthCollector);
                    return dashArray.join(',');
                };

                let calculateProgressBarHeight = function(questionLevel, hexagonQuarterHeight, hexagonPadding, progressBarPadding) {
                    let numberOfHexagonRows = {ft_top_ten: 1, ft_upper: 2, ft_lower: 3}[questionLevel];
                    return 2 * progressBarPadding + 4 * hexagonQuarterHeight + (numberOfHexagonRows - 1) * (6 * hexagonQuarterHeight + 2 * hexagonPadding);
                };

                scope.generateHexagonPoints = function(halfWidth, quarterHeight) {
                    return '' + 1 * halfWidth + ' ' + 0 * quarterHeight +
                         ', ' + 2 * halfWidth + ' ' + 1 * quarterHeight +
                         ', ' + 2 * halfWidth + ' ' + 3 * quarterHeight +
                         ', ' + 1 * halfWidth + ' ' + 4 * quarterHeight +
                         ', ' + 0 * halfWidth + ' ' + 3 * quarterHeight +
                         ', ' + 0 * halfWidth + ' ' + 1 * quarterHeight;
                };

                let progressCachePrefix = 'fasttrack_progress_';
                let deviceSize = window.Foundation.utils.is_small_only() ? 'small' : window.Foundation.utils.is_medium_only() ? 'medium' : 'large';
                let hexagonUnitLength = {large: 28, medium: 22, small: 12.5}[deviceSize];
                let hexagonPadding = {large: 4, medium: 4, small: 2}[deviceSize];
                let hexagonHalfWidth = hexagonUnitLength;
                let hexagonQuarterHeight = hexagonUnitLength / Math.sqrt(3);
                scope.currentlyWorkingOn = getCurrentlyWorkingOn();
                if (scope.currentlyWorkingOn.isConcept) {
                    scope.conceptQuestions = api.fastTrack.concepts({gameboardId: $stateParams.board, concept: scope.currentlyWorkingOn.title});
                } else {
                    scope.conceptQuestions =  {$promise: Promise.resolve(null)};
                }

                scope.rootElement = htmlElement.find('div.ft-progress-bar > svg');
                scope.cachedTitle = '';
                scope.cachedConceptTitle = '';
                scope.progressBarPadding = deviceSize !== 'small' ? 5 : 1;
                scope.progressBarHeight = calculateProgressBarHeight(scope.currentlyWorkingOn.fastTrackLevel, hexagonQuarterHeight, hexagonPadding, scope.progressBarPadding);
                scope.hexagon = {
                    padding: hexagonPadding,
                    halfWidth: hexagonHalfWidth,
                    quarterHeight: hexagonQuarterHeight,
                    x: {
                        left: (Math.sqrt(3) * hexagonQuarterHeight) / 2,
                        center: hexagonHalfWidth,
                        right: (hexagonHalfWidth * 2) - (Math.sqrt(3) * hexagonQuarterHeight) / 2,
                    },
                    y: {
                        top: hexagonQuarterHeight / 2,
                        center: 2 * hexagonQuarterHeight,
                        bottom: 7 * hexagonQuarterHeight / 2,
                    },
                    base: {
                        stroke: {
                            width: {large: 3, medium: 3, small: 2}[deviceSize],
                            colour: '#ddd'
                        },
                        fill: {
                            selectedColour: 'none',
                            deselectedColour: '#f0f0f0',
                            completedColour: 'none',
                            deselectedCompletedColour: '#f0f0f0',
                        },
                    },
                    questionPartProgress: {
                        stroke: {
                            width: {large: 3, medium: 3, small: 2}[deviceSize],
                            colour: '#009acd'
                        },
                        fill: {colour: 'none'},
                    },
                };

                scope.conceptConnection = {
                    fill: 'none',
                    stroke: {
                        colour: '#fea100',
                        width: {large: 3, medium: 3, small: 2}[deviceSize],
                        dashArray: 4
                    },
                }

                let augmentQuestion = function(question, gameboardId, currentlyWorkingOn, questionHistory, index) {
                    question.fastTrackLevel = getFastTrackLevel(question.tags);
                    question.isCurrentQuestion = question.id == currentlyWorkingOn.id;
                    question.isCompleted = question.state === 'PERFECT';
                    question.hexagonTitle = index + 1;
                    question.href = "/questions/" + question.id + '?board=' + gameboardId;
                    if (questionHistory) {
                        let newQuestionHistory = null
                        if (question.fastTrackLevel == 'ft_top_ten') {
                            newQuestionHistory = "";
                        } else if (question.fastTrackLevel === currentlyWorkingOn.fastTrackLevel) {
                            // Maintain history if moving to another question on the same level
                            newQuestionHistory = questionHistory;    
                        } else {
                            // Step back in question history if possible
                            newQuestionHistory = questionHistory.slice(0, questionHistory.lastIndexOf(question.id));
                        }
                        if (newQuestionHistory && newQuestionHistory.length) {
                            question.href += "&questionHistory=" + newQuestionHistory.join(',');
                        }
                    }
                }

                let getMostRecentQuestion = function(questionHistory, conceptLevel) {
                    let reversedQuestionHistory = questionHistory.slice().reverse();
                    let questionLevelMatcheFunctions = {
                        'ft_top_ten': questionId => questionId.indexOf('fasttrack') != -1,
                        'ft_upper': questionId => questionId.indexOf('upper') != -1,
                    };
                    let result = null;
                    for (let questionId of reversedQuestionHistory) {
                        if (questionLevelMatcheFunctions[conceptLevel](questionId)) {
                            result = questionId;
                        }
                    }
                    return result;
                }

                let orderConceptQuestionsById = function(unorderedConceptQuestions) {
                    if (unorderedConceptQuestions === null) {
                        return null;
                    }
                    let result = {upperLevelQuestions: [], lowerLevelQuestions: []};
                    for (let conceptLevelName of ['upperLevelQuestions', 'lowerLevelQuestions']) {
                        result[conceptLevelName] = unorderedConceptQuestions[conceptLevelName].slice().sort((a, b) => a.id === b.id ? 0 : a.id > b.id ? 1 : -1);
                    }
                    return result;
                }

                let evaluateProgress = function(boardState, unorderedConceptQuestions, currentlyWorkingOn, questionHistory) {
                    let progress = {title: '', conceptTitle: '', questions: {topTen: [], upper: [], lower: []}, connections: {topTenToUpper: [], upperToLower: []}};

                    // Store title information for local storage retrieval
                    progress.title = boardState.title;
                    progress.conceptTitle = currentlyWorkingOn.isConcept ? currentlyWorkingOn.title : '';

                    let conceptQuestions = orderConceptQuestionsById(unorderedConceptQuestions);

                    // Evaluate top ten progress
                    for (let i = 0; i < boardState.questions.length; i++) {
                        let question = boardState.questions[i];
                        augmentQuestion(question, boardState.id, currentlyWorkingOn, questionHistory, i);
                        progress.questions.topTen.push(question);
                    }

                    // Evalueate concept question progress
                    if (currentlyWorkingOn.isConcept) {
                        let upperAndLowerConceptQuestions = new Map([['upper', conceptQuestions.upperLevelQuestions], ['lower', conceptQuestions.lowerLevelQuestions]]);
                        for (let [conceptQuestionType, conceptQuestionsOfType] of upperAndLowerConceptQuestions) {
                            for (let i = 0; i < conceptQuestionsOfType.length; i++) {
                                let question = conceptQuestionsOfType[i];
                                augmentQuestion(question, boardState.id, currentlyWorkingOn, questionHistory, i);
                                progress.questions[conceptQuestionType].push(question)
                            }
                        }
                    }

                    // Evaluate concept connections
                    if (currentlyWorkingOn.isConcept) {
                        let mostRecentTopTenQuestionId = getMostRecentQuestion(questionHistory, 'ft_top_ten');
                        let mostRecenetTopTenIndex = boardState.questions.map(question => question.id).indexOf(mostRecentTopTenQuestionId);

                        let upperQuestionId = currentlyWorkingOn.fastTrackLevel === 'ft_upper' ? currentlyWorkingOn.id : getMostRecentQuestion(questionHistory, 'ft_upper');
                        let upperIndex = conceptQuestions.upperLevelQuestions.map(question => question.id).indexOf(upperQuestionId);

                        // Top Ten to Upper connection
                        progress.connections.topTenToUpper.push({sourceIndex: mostRecenetTopTenIndex, targetIndex: upperIndex, isMostRecent: true, message: "Practise the concept before returning to complete the board"});

                        // Upper to Lower connections
                        if (currentlyWorkingOn.fastTrackLevel === 'ft_lower') {
                            let lowerIndex = conceptQuestions.lowerLevelQuestions.map(question => question.id).indexOf(currentlyWorkingOn.id);
                            progress.connections.upperToLower.push({sourceIndex: upperIndex, targetIndex: lowerIndex, isMostRecent: true, message: "Practise the concept with easier quesitons before returning to complete the board"});
                        }
                    }
                    return progress;
                }

                let generateHexagon = function(states, selector, properties, fillColour, clickable) {
                    let polygonAttributes = {
                        points: scope.generateHexagonPoints(scope.hexagon.halfWidth, scope.hexagon.quarterHeight),
                        stroke: properties.stroke.colour,
                        'stroke-width': properties.stroke.width,
                        fill: fillColour,
                    }
                    let perimiter = 6 * 2 * (scope.hexagon.quarterHeight);
                    let dashArray = calculateDashArray(states, selector, perimiter);
                    if (dashArray) {
                        polygonAttributes['stroke-dasharray'] = dashArray;
                    }
                    if (clickable) {
                        polygonAttributes['pointer-events'] = 'visible';
                    }
                    return svgElement('polygon').attr(polygonAttributes);
                }

                let generateHexagonTitle = function(title, isCurrentQuestion) {
                    let isTwoCharLength = ("" + title).length > 1;
                    let xSingleCharPosition = scope.hexagon.halfWidth - {large: 8, medium: 8, small: 5}[deviceSize];
                    let xTwoCharPosition = scope.hexagon.halfWidth - {large: 14, medium: 14, small: 10}[deviceSize];
                    let yPositoin = scope.hexagon.quarterHeight * 2 + {large: 9, medium: 9, small: 6}[deviceSize];
                    return svgElement('text').attr({
                        'font-family': 'Exo 2',
                        'font-size': {large: 26, medium: 26, small: 18}[deviceSize],
                        'font-style': 'italic',
                        'font-weight': deviceSize === 'small' ? 500 : 600,
                        'fill': isCurrentQuestion ? '#333' : '#ccc',
                        'stroke': 'none',
                        'stroke-width': '1',
                        'stroke-linejoin': 'round',
                        'stroke-linecap': 'round',
                        'x': isTwoCharLength ? xTwoCharPosition : xSingleCharPosition,
                        'y': yPositoin,
                    }).text(title);
                }

                let generateCompletionTick = function(isCurrentQuestion) {
                    return svgElement('image').attr({
                        href:'assets/tick-bg.png',
                        height: {large: 36, medium: 28, small: 18}[deviceSize],
                        width: {large: 36, medium: 28, small: 18}[deviceSize],
                        x: scope.hexagon.halfWidth - {large: 18, medium: 14, small: 9}[deviceSize],
                        y: scope.hexagon.quarterHeight - {large: 2, medium: 1, small: 2}[deviceSize],
                        opacity: isCurrentQuestion ? 1 : 0.3,
                    });
                }

                let calculateConnectionLine = function(sourceIndex, targetIndex) {
                    let result = ''

                    let hexagonWidth = 2 * (scope.hexagon.halfWidth + scope.hexagon.padding);

                    let sourceHexagonX = (sourceIndex <= targetIndex ? sourceIndex * hexagonWidth : Math.max(sourceIndex - 1, 0) * hexagonWidth);
                    let targetHexagonX = (targetIndex <= sourceIndex ? targetIndex * hexagonWidth : Math.max(targetIndex - 1, 0) * hexagonWidth);

                    // First stroke
                    if (sourceIndex <= targetIndex) {
                        result += moveTo(sourceHexagonX + scope.hexagon.x.left, scope.hexagon.y.top);
                    } else {
                        result += moveTo(sourceHexagonX + scope.hexagon.x.right, scope.hexagon.y.top);
                    }
                    result += line(sourceHexagonX + scope.hexagon.x.center, scope.hexagon.y.center);

                    // Horrizontal connection
                    if (Math.abs(sourceIndex - targetIndex) > 1) {
                        result += line(targetHexagonX + scope.hexagon.x.center, scope.hexagon.y.center);
                    }

                    // Last stroke
                    if (targetIndex <= sourceIndex) {
                        result += line(targetHexagonX + scope.hexagon.x.left, scope.hexagon.y.bottom);
                    } else {
                        result += line(targetHexagonX + scope.hexagon.x.right, scope.hexagon.y.bottom);
                    }

                    return result;
                }

                let createQuestionHexagon = function(baseElement, question) {
                    // Question link
                    let questionAnchor = svgElement('a').attr({'href': question.href});

                    // Mouse-over text
                    questionAnchor.append(svgElement('title').text(question.title + (question.currentlyWorkingOn ? ' (Current)' : '')));

                    // Base hexagon
                    let fillColour = 'none';
                    if (question.isCompleted) {
                        fillColour = question.isCurrentQuestion ? scope.hexagon.base.fill.completedColour : scope.hexagon.base.fill.deselectedCompletedColour;
                    } else {
                        fillColour = question.isCurrentQuestion ? scope.hexagon.base.fill.selectedColour : scope.hexagon.base.fill.deselectedColour;
                    }
                    questionAnchor.append(generateHexagon([true], allVisible => allVisible === true, scope.hexagon.base, fillColour, true))

                    // Question part progress
                    questionAnchor.append(generateHexagon(
                        question.questionPartStates,
                        state => state === 'CORRECT',
                        scope.hexagon.questionPartProgress,
                        'none'
                    ));

                    if (question.isCompleted) {
                        questionAnchor.append(generateCompletionTick(question.isCurrentQuestion));
                    } else {
                        questionAnchor.append(generateHexagonTitle(question.hexagonTitle, question.isCurrentQuestion));
                    }

                    $(baseElement).append(questionAnchor);
                }

                let createConnection = function(sourceIndex, targetIndex) {
                    let connectionAttributes = {
                        d: calculateConnectionLine(sourceIndex, targetIndex),
                        fill: scope.conceptConnection.fill,
                        stroke: scope.conceptConnection.stroke.colour,
                        'stroke-width': scope.conceptConnection.stroke.width,
                        'stroke-dasharray': scope.conceptConnection.stroke.dashArray, 
                    };
                    return svgElement('path').attr(connectionAttributes);
                }

                let createQuestionRow = function(conceptQuestions, fastTrackLevel, conceptRowIndex) {
                    let questionsGroup = svgElement('g').attr({
                        id: fastTrackLevel + '-question-hexagons',
                        transform: 'translate(0,' + conceptRowIndex * (6 * scope.hexagon.quarterHeight + 2 * scope.hexagon.padding) + ')',
                    });

                    for (let columnIndex = 0; columnIndex < conceptQuestions.length; columnIndex++) {
                        let question = conceptQuestions[columnIndex];
                        let questionGroup = svgElement('g').attr({
                            class: fastTrackLevel + '-question-hexagon',
                            transform: 'translate(' + columnIndex * 2 * (scope.hexagon.halfWidth + scope.hexagon.padding) + ', 0)',
                        });
                        createQuestionHexagon(questionGroup, question);
                        questionsGroup.append(questionGroup);
                    }
                    return questionsGroup;
                }

                let createConceptConnectionRow = function(conceptConnections, connectionName, connectionRowIndex) {
                    let connectionGroup = svgElement('g').attr({
                        id: connectionName + '-concept-connections',
                        transform: 'translate(' +
                            (scope.hexagon.halfWidth + scope.hexagon.padding) + ',' +
                            (3 * scope.hexagon.quarterHeight + scope.hexagon.padding + connectionRowIndex * (6 * scope.hexagon.quarterHeight + 2 * scope.hexagon.padding)) + ')',
                    });
                    for (let conceptConnection of conceptConnections) {
                        connectionGroup.append(svgElement('title').text(conceptConnection.message));
                        connectionGroup.append(createConnection(conceptConnection.sourceIndex, conceptConnection.targetIndex));
                    }
                    return connectionGroup;
                }

                let renderProgress = function(rootElement, progress) {

                    let questionHexagons = $(rootElement.find('#question-hexagons'));
                    questionHexagons.empty();
                    let conceptConnections = $(rootElement.find('#concept-connections'));
                    conceptConnections.empty();

                    questionHexagons.append(questionHexagons.append(createQuestionRow(progress.questions.topTen, 'top_ten', 0)));

                    if (progress.questions.upper.length) {
                        conceptConnections.append(createConceptConnectionRow(progress.connections.topTenToUpper, 'top-ten-to-upper', 0));
                        questionHexagons.append(createQuestionRow(progress.questions.upper, 'upper', 1));
                    }

                    if (progress.questions.lower.length) {
                        conceptConnections.append(createConceptConnectionRow(progress.connections.upperToLower, 'upper-to-lower', 1));
                        questionHexagons.append(createQuestionRow(progress.questions.lower, 'lower', 2));
                    }
                }

                let update = function() {
                    if (scope.boardState.$resolved) {
                        scope.conceptQuestions.$promise.then(function(conceptQuestions) {
                            let categorisedConceptQuestions = categoriseConceptQuestions(conceptQuestions);
                            let questionHistory = $stateParams.questionHistory ? $stateParams.questionHistory.split(',') : [];
                            scope.progress = evaluateProgress(scope.boardState, categorisedConceptQuestions, scope.currentlyWorkingOn, questionHistory);
                            renderProgress(scope.rootElement, scope.progress);
                            // Persist progress in local storage for quick re-loading
                            persistence.save(progressCachePrefix + $stateParams.board, JSON.stringify(scope.progress));
                        });
                    }
                }

                scope.$watchGroup(['boardState', 'boardState.questions'], function(newValue, oldValue) {
                    if (newValue !== oldValue) {
                        scope.boardState.$promise.then(update);
                    }
                });

                $rootScope.$on('questionPartCorrect', function(event, questionId, questionPartIndex) {
                    for (let questionSet of ['topTen', 'upper', 'lower']) {
                        for (let question of scope.progress.questions[questionSet]) {
                            if (question.id === questionId) {
                                question.questionPartStates[questionPartIndex] = 'CORRECT';
                                renderProgress(scope.rootElement, scope.progress);
                                return; // early exit
                            }
                        }
                    }
                });

                let cachedProgress = persistence.load(progressCachePrefix + $stateParams.board);
                if (cachedProgress) {
                    let deserialisedCachedProgress = JSON.parse(cachedProgress);
                    scope.cachedTitle = deserialisedCachedProgress.title;
                    scope.cachedConceptTitle = deserialisedCachedProgress.conceptTitle;
                    renderProgress(scope.rootElement, deserialisedCachedProgress);
                }
            }
        }
    }]
});