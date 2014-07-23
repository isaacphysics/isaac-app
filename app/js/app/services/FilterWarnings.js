define([], function() {

	return [function() {

		var contains = function(arr, val) {
			return arr.indexOf(val) > -1;
		}

		var joinList = function(arr) {
			arr.sort();
			var s = "";

			for (var i = 0; i < arr.length; i++) {
				if (i > 0 && i < arr.length - 1)
					s += ", ";

				if (i == arr.length - 1 && i > 0)
					s += " or ";
				s += arr[i];
			}

			return s;
		}

		function getWarnings(subjects, fields, topics, levels, concepts) {

			var warnings = [];

			if (contains(topics, "circular_motion") && !(contains(levels, 4) || contains(levels, 5) || levels.length == 0))
				warnings.push("There are no Circular Motion questions in " + (levels.length > 1 ? "levels" : "level") + " " + joinList(levels));

			if (contains(topics, "angular_motion") && !(contains(levels, 4) || contains(levels, 5) || contains(levels, 6) || levels.length == 0))
				warnings.push("There are no Angular Motion questions in " + (levels.length > 1 ? "levels" : "level") + " " + joinList(levels));

			if (contains(topics, "shm") && !(contains(levels, 4) || contains(levels, 5) || contains(levels, 6) || levels.length == 0))
				warnings.push("There are no SHM questions in " + (levels.length > 1 ? "levels" : "level") + " " + joinList(levels));

			return warnings;
		}

		return getWarnings;
	}];
});
