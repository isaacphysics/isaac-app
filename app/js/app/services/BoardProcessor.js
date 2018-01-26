/**
 * Copyright 2016 Meurig Thomas
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

	var PRIORITISED_BOARD_TAGS = [
		{identifier: 'ISAAC_BOARD', createdByLabel: 'Isaac'}
	]

	var calculateBoardLevels = function(board) {
		levels = [];
		for(var i = 0; i < board.questions.length; i++) {
			if (levels.indexOf(board.questions[i].level) == -1 && board.questions[i].level != 0) {
				levels.push(board.questions[i].level);
			}
		}
		levels.sort(function (a, b) {
			return a > b ? 1 : a < b ? -1 : 0;
		});
		return levels;
	};

	var calculateBoardSubjects = function(board) {
		subjects = [];
		for(i = 0; i < board.questions.length; i++) {
			var q = board.questions[i];
			if (q.tags && q.tags.indexOf("maths") > -1 && subjects.indexOf("maths") == -1) {
				subjects.push("maths");
			} else if (q.tags && q.tags.indexOf("physics") > -1 && subjects.indexOf("physics") == -1) {
				subjects.push("physics");
			} else if (q.tags && q.tags.indexOf("chemistry") > -1 && subjects.indexOf("physics") == -1) {
				// FIXME - Hack for now to avoid having to change the sprite image!
				subjects.push("physics");
			}
		}
		return subjects;
	};

	var calculateBoardCreator = function(board, userId) {
		var creator = "Someone else";
		if (board.ownerUserId == userId) {
			creator = "Me";
		}
		else if (board.tags) {
			for (var i = 0; i < PRIORITISED_BOARD_TAGS.length; i++) {
				var boardTag = PRIORITISED_BOARD_TAGS[i];
				if (board.tags.indexOf(boardTag.identifier) >= 0) {
					creator = boardTag.createdByLabel;
					break;
				}
			}
		}
		return creator;
	}

	return ['$filter', function PersistenceConstructor($filter) {
		this.augmentBoards = function(boards, userId) {
			for (boardIndex in boards.results) {
				board = boards.results[boardIndex];
				board.completion = board.percentageCompleted == 100 ? 'Completed' : board.percentageCompleted == 0 ? 'Not Started' : 'In Progress'
				board.subjects = calculateBoardSubjects(board);
				board.levels = calculateBoardLevels(board)
				board.createdBy = calculateBoardCreator(board, userId);
				board.formattedCreationDate = $filter('date')(board.creationDate, 'dd/MM/yyyy');
				board.formattedLastVisitedDate = $filter('date')(board.lastVisited, 'dd/MM/yyyy');
			}
			return boards;
		}
	}];

});