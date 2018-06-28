/**
 * Copyright 2017 Meurig Thomas
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at
 * 		http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
define([], function() {

	var boardTags = {
		isaac: {identifier: 'ISAAC_BOARD', createdByLabel: 'Isaac'}
	}
	var priorityOrderedBoardTags = ['isaac']

	// helper function for old javascript until we sort out transpiler
	var pushIfNotPresent = function(elements, element) {
		if (elements.indexOf(element) == -1) {
			elements.push(element);
		}
	}

	var calculateBoardCompletionStatus = function(board, options) {
		var completionStatus;
		if (board.percentageCompleted == 100) {
			completionStatus = 'Completed';
		} else if (board.percentageCompleted > 0) {
			completionStatus = 'In Progress';
		} else {
			completionStatus = 'Not Started';
		}
		pushIfNotPresent(options, completionStatus);
		return completionStatus
	}

	var calculateBoardLevels = function(board, options) {
		let levels = [];
		for(var i = 0; i < board.questions.length; i++) {
			var level = board.questions[i].level
			if (levels.indexOf(level) == -1 && level != 0) {
				levels.push(level);
				pushIfNotPresent(options, level);
			}
		}
		levels.sort(function (a, b) {
			return a > b ? 1 : a < b ? -1 : 0;
		});
		return levels;
	};

	var calculateBoardSubjects = function(board, options) {
		let subjects = [];
		for(let i = 0; i < board.questions.length; i++) {
			var q = board.questions[i];
			if (q.tags && q.tags.indexOf("maths") > -1) {
				pushIfNotPresent(subjects, "maths");
				pushIfNotPresent(options, "Maths");
			} else if (q.tags && q.tags.indexOf("physics") > -1) {
				pushIfNotPresent(subjects, "physics");
				pushIfNotPresent(options, "Physics");
			} else if (q.tags && q.tags.indexOf("chemistry") > -1) {
				pushIfNotPresent(subjects, "chemistry");
				pushIfNotPresent(options, "Chemistry");
			}
		}
		return subjects;
	};

	var calculateBoardCreator = function(board, options, userId) {
		var creator = board.ownerUserId == userId ? "Me" : "Someone else";
		// A tagged gameboard overrides creator
		if (board.tags) {
			for (var i = 0; i < priorityOrderedBoardTags.length; i++) {
				var boardTag = boardTags[priorityOrderedBoardTags[i]];
				if (board.tags.indexOf(boardTag.identifier) >= 0) {
					creator = boardTag.createdByLabel;
					break;
				}
			}
		}
		pushIfNotPresent(options, creator);
		return creator;
	}

	var noFilterOption = {
		label: 'All',
		value: undefined
	};

	var generateFilterOptions = function(allOptions) {
		var filterOptions = {};
		angular.forEach(allOptions, function(seenOptions, selectorKey) {
			// start with the no filter option
			filterOptions[selectorKey] = [noFilterOption];
			let selectorOptions = filterOptions[selectorKey];
			for (var i = 0; i < seenOptions.length; i++) {
				var seenOption = seenOptions[i];
				selectorOptions.push({label: seenOption, value: seenOption});
			}
		});
		return filterOptions;
	}

	return ['$filter', 'gameBoardTitles', function PersistenceConstructor($filter, gameBoardTitles) {
		this.boardTags = boardTags;
		this.filterOptions = {};
		this.augmentBoards = function(boards, userId) {
			var seenOptions = {completion:[], levels:[], subjects:[], createdBy:[]};

			for (var i = 0; i < boards.length; i++) {
				let board = boards[i];
				board.completion = calculateBoardCompletionStatus(board, seenOptions.completion);
				board.subjects = calculateBoardSubjects(board, seenOptions.subjects);
				board.levels = calculateBoardLevels(board, seenOptions.levels);
				board.createdBy = calculateBoardCreator(board, seenOptions.createdBy, userId);
				board.formattedCreationDate = $filter('date')(board.creationDate, 'dd/MM/yyyy');
				board.formattedLastVisitedDate = $filter('date')(board.lastVisited, 'dd/MM/yyyy');
				board.title = board.title || gameBoardTitles.generate(board);
			}

			this.filterOptions = generateFilterOptions(seenOptions);
			return boards;
		}
	}];

});