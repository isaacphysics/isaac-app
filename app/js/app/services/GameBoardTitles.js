/**
 * Copyright 2014 Ian Davies
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

	return ["tags", "$sce", function(tags, $sce) {

		function getTagTitle(id) {
			for (var i in tags.tagArray) {
				if (tags.tagArray[i].id == id)
					return $sce.trustAsHtml(tags.tagArray[i].title);
			}
		}

		return {
			generate: function(gameBoard) {
				// Find the most specific filter tag that is the only one at its level.

				// E.g. Physics > Mechanics > Dynamics = Dynamics
				//      Physics > Mechanics > Dynamics, Statics = Mechanics
				//      Physics > Mechanics = Mechanics
				// Include special case:
				//      Physics, Maths = Physics & Maths

				// TODO: I have removed !gameBoard.$resolved, not sure if this is required
				if (!gameBoard || !gameBoard.gameFilter)
					return "";

				var filter = gameBoard.gameFilter;

				if (filter.levels && filter.levels.length == 1) {
					var level = ", Level " + filter.levels[0];
				}

				if (filter.topics && filter.topics.length == 1) {

					var title = getTagTitle(filter.topics[0]);

				} else if (filter.fields && filter.fields.length == 1) {

					var title = getTagTitle(filter.fields[0]);

				} else if (filter.subjects && filter.subjects.length == 1) {

					var title = getTagTitle(filter.subjects[0]);

				} else {

					var title = "Physics & Maths";
				}

				return title + (level || "");
			}
		}
	}];
});