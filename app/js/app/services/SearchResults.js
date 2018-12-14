/**
 * Copyright 2018 Ben Hanson
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
	let searchList = [

		{
			id: "assignments",
			title: "My Assignments",
			terms: ["my assignments", "assignments", "homework"],
			url: "/assignments"
		}, {
			id: "join_group",
			title: "Joining Groups",
			terms: ["join group", "join class", "teacher connections", "class code", "join a class", "classes", "share token"],
			url: "/account#teacherconnections"
		}, {
			id: "logout",
			title: "Logout",
			terms: ["logout"],
			url: "/logout"
		}, {
			id: "spc",
			title: "Senior Physics Challenge",
			terms: ["senior physics challenge", "spc", "masterclass", "bootcamp"],
			url: "/spc"
		}, {
			id: "books",
			title: "Physics Skills Book",
			terms: ["books", "book", "pre uni physics", "essential pre uni physics", "alevel", "a-level", "a level"],
			url: "/books/physics_skills_14"
		}, {
			id: "help",
			title: "Help",
			terms: ["help", "support"],
			url: "/support/student/general"
		}

	];

	this.getSearchTerms = function(term) {
		for (var i in searchList) {
			for (var j in searchList[i].terms) {
				if (searchList[i].terms[j] === term) {
					var response = searchList[i];
					return response;
				}
			}
		}
	};
});