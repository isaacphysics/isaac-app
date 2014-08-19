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