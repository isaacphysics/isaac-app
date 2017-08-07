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
				mobileDefault: 0,
				tabletAndDesktopDefault: 0,
				values: [
					{label: "boards", value: null},
					{label: "unstarted boards", value: "not_attempted"},
					{label: "in-progress boards", value: "in_progress"},
					{label: "completed boards", value: "completed"}
				]
			},
			sort: {
				mobileDefault: 1,
				tabletAndDesktopDefault: 1,
				values: [
					{label: "date created", value: "created"},
					{label: "date visited", value: "visited"}
				]
			},
			noBoards: {
				mobileDefault: 0,
				tabletAndDesktopDefault: 3,
				values: [
					{label: "6", value: "6"},
					{label: "18", value: "18"},
					{label: "60", value: "60"},
					{label: "all", value: "ALL"}
				]
			},
			view: {
				mobileDefault: 0,
				tabletAndDesktopDefault: 1,
				values: [
					{label: "assignment cards", value: "card"},
					{label: "a table of records", value: "table"}
				]
			}
		};
	}
});