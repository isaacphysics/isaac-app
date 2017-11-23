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
	return function() {
		return {
			filter: {
				cardDefault: "all",
				tableDefault: "all",
				values: {
					all: {label: "Boards", value: null},
					unstarted: {label: "Unstarted Boards", value: "not_attempted"},
					inProgress: {label: "In-progress Boards", value: "in_progress"},
					completed: {label: "Completed Boards", value: "completed"}
				}
			},
			sort: {
				cardDefault: "visited",
				tableDefault: "visited",
				values: {
					created: {label: "Date Created", value: "created"},
					visited: {label: "Date Visited", value: "visited"},
					titleAscending: {label: "Title Ascending", value: "title"},
					titleDescending: {label: "Title Descending", value: "-title"}
				}
			},
			noBoards: {
				cardDefault: "six",
				tableDefault: "all",
				values: {
					six: {label: "6", value: 6},
					eighteen: {label: "18", value: 18},
					sixty: {label: "60", value: 60},
					all: {label: "All", value: "ALL"}
				}
			},
			view: {
				cardDefault: "card",
				tableDefault: "table",
				values: {
					card: {label: "Card View", value: "card", defaultFieldName: "cardDefault"},
					table: {label: "Table View", value: "table", defaultFieldName: "tableDefault"}
				}
			}
		};
	}
});