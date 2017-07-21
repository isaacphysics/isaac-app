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
				default: 0,
				values: [
					{label: "All Boards", value: null},
					{label: "Not Started", value: "not_attempted"},
					{label: "In Progress", value: "in_progress"},
					{label: "Completed", value: "completed"}
				]
			},
			sort: {
				default: 1,
				values: [
					{label: "Date Created", value: "created"},
					{label: "Date Visited", value: "visited"},
					{label: "Title Ascending", value: "title"},
					{label: "Title Descending", value: "-title"}
				]
			},
			noBoards: {
				default: 0,
				values: [
					{label: "6", value: "6"},
					{label: "18", value: "18"},
					{label: "60", value: "60"},
					{label: "Show All", value: "ALL"}
				]
			},
			view: {
				default: 0,
				values: [
					{label: "Assignment Cards", value: "card"},
					{label: "Table of Records", value: "table"}
				]
			}
		};
	}
});