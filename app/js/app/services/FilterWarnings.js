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

        // Mechanics topics:
			if (contains(topics, "circular_motion") && !(contains(levels, 4) || contains(levels, 5) || levels.length == 0))
				warnings.push(["circular_motion", "There are no Circular Motion questions in " + (levels.length > 1 ? "levels" : "level") + " " + joinList(levels)]);

			if (contains(topics, "angular_motion") && !(contains(levels, 4) || contains(levels, 5) || contains(levels, 6) || levels.length == 0))
				warnings.push(["angular_motion", "There are no Angular Motion questions in " + (levels.length > 1 ? "levels" : "level") + " " + joinList(levels)]);

			if (contains(topics, "shm") && !(contains(levels, 4) || contains(levels, 5) || contains(levels, 6) || levels.length == 0))
				warnings.push(["shm", "There are no SHM questions in " + (levels.length > 1 ? "levels" : "level") + " " + joinList(levels)]);

        // Fields field:
			// fields - only show fields (filter property not the tag) message when no topics are selected.
			if (topics.length == 0 && contains(fields, "fields") && !(contains(levels, 4) || contains(levels, 5) || levels.length == 0))
				warnings.push(["fields", "There are no Fields questions in " + (levels.length > 1 ? "levels" : "level") + " " + joinList(levels)]);
        // Fields topics:
			if (contains(topics, "electric") && !(contains(levels, 4) || contains(levels, 5) || levels.length == 0))
				warnings.push(["electric", "There are no Electric questions in " + (levels.length > 1 ? "levels" : "level") + " " + joinList(levels)]);
			
			if (contains(topics, "magnetic") && !(contains(levels, 4) || contains(levels, 5) || levels.length == 0))
				warnings.push(["magnetic", "There are no Magnetic questions in " + (levels.length > 1 ? "levels" : "level") + " " + joinList(levels)]);
			
			if (contains(topics, "gravitational") && !(contains(levels, 4) || contains(levels, 5) || levels.length == 0))
				warnings.push(["gravitational", "There are no Gravitational questions in " + (levels.length > 1 ? "levels" : "level") + " " + joinList(levels)]);
			
			if (contains(topics, "combined") && !(contains(levels, 4) || contains(levels, 5) || levels.length == 0))
				warnings.push(["combined", "There are no Combined questions in " + (levels.length > 1 ? "levels" : "level") + " " + joinList(levels)]);

        // Circuits field:
            if (topics.length == 0 && contains(fields, "circuits") && !(contains(levels, 1) || contains(levels, 2) || contains(levels, 3) || contains(levels, 4) || levels.length == 0))
				warnings.push(["circuits", "There are no Circuits questions in " + (levels.length > 1 ? "levels" : "level") + " " + joinList(levels)]);
        // Circuits topics:
			if (contains(topics, "resistors") && !(contains(levels, 1) || contains(levels, 2) || contains(levels, 3) || levels.length == 0))
				warnings.push(["resistors", "There are no Resistors questions in " + (levels.length > 1 ? "levels" : "level") + " " + joinList(levels)]);

			if (contains(topics, "capacitors") && !(contains(levels, 4) || levels.length == 0))
				warnings.push(["capacitors", "There are no Capacitors questions in " + (levels.length > 1 ? "levels" : "level") + " " + joinList(levels)]);

			if (contains(topics, "general_circuits") && !(contains(levels, 1) || contains(levels, 2) || contains(levels, 3) || levels.length == 0))
				warnings.push(["general_circuits", "There are no General Circuits questions in " + (levels.length > 1 ? "levels" : "level") + " " + joinList(levels)]);

        // Waves field:
            if (topics.length == 0 && contains(fields, "waves") && !(contains(levels, 1) || contains(levels, 2) || contains(levels, 3) || levels.length == 0))
				warnings.push(["waves", "There are no Waves questions in " + (levels.length > 1 ? "levels" : "level") + " " + joinList(levels)]);
        // Waves topics:
			if (contains(topics, "superposition") && !(contains(levels, 2) || contains(levels, 3) || levels.length == 0))
				warnings.push(["superposition", "There are no Superposition questions in " + (levels.length > 1 ? "levels" : "level") + " " + joinList(levels)]);

			if (contains(topics, "optics") && !(contains(levels, 1) || contains(levels, 2) || contains(levels, 3) || contains(levels, 4) || contains(levels, 5) || levels.length == 0))
				warnings.push(["optics", "There are no Optics questions in " + (levels.length > 1 ? "levels" : "level") + " " + joinList(levels)]);

			if (contains(topics, "wave_motion") && !(contains(levels, 1) || contains(levels, 2) || contains(levels, 3) || levels.length == 0))
				warnings.push(["wave_motion", "There are no Wave Motion questions in " + (levels.length > 1 ? "levels" : "level") + " " + joinList(levels)]);

        // Maths topics:
			if (contains(topics, "simultaneous") && !(contains(levels, 1) || levels.length == 0))
				warnings.push(["simultaneous", "There are no Simultaneous Equations questions in " + (levels.length > 1 ? "levels" : "level") + " " + joinList(levels)]);

			if (contains(topics, "manipulation") && !(contains(levels, 1) || levels.length == 0))
				warnings.push(["manipulation", "There are no Algebraic Manipulation questions in " + (levels.length > 1 ? "levels" : "level") + " " + joinList(levels)]);

			if (contains(topics, "quadratics") && !(contains(levels, 1) || levels.length == 0))
				warnings.push(["quadratics", "There are no Quadratics questions in " + (levels.length > 1 ? "levels" : "level") + " " + joinList(levels)]);


			if (contains(topics, "series") && !(contains(levels, 3) || levels.length == 0))
				warnings.push(["series", "There are no Series questions in " + (levels.length > 1 ? "levels" : "level") + " " + joinList(levels)]);

			if (contains(topics, "differentiation") && !(contains(levels, 2) || contains(levels, 4) || contains(levels, 5) || levels.length == 0))
				warnings.push(["differentiation", "There are no Differentiation questions in " + (levels.length > 1 ? "levels" : "level") + " " + joinList(levels)]);

			if (contains(topics, "integration") && !(contains(levels, 4) || contains(levels, 5) || levels.length == 0))
				warnings.push(["integration", "There are no Integration questions in " + (levels.length > 1 ? "levels" : "level") + " " + joinList(levels)]);

			if (contains(topics, "differential_eq") && !(contains(levels, 5) || levels.length == 0))
				warnings.push(["differential_eq", "There are no Differential Equations questions in " + (levels.length > 1 ? "levels" : "level") + " " + joinList(levels)]);

			if (contains(topics, "geom_vectors") && !(contains(levels, 2) || contains(levels, 5) || levels.length == 0))
				warnings.push(["vectors", "There are no Vectors questions in " + (levels.length > 1 ? "levels" : "level") + " " + joinList(levels)]);

			if (contains(topics, "shapes") && !(contains(levels, 2) || levels.length == 0))
				warnings.push(["shapes", "There are no Shapes questions in " + (levels.length > 1 ? "levels" : "level") + " " + joinList(levels)]);

			if (contains(topics, "trigonometry") && !(contains(levels, 1) || contains(levels, 2) || contains(levels, 3) || contains(levels, 4) || levels.length == 0))
				warnings.push(["trigonometry", "There are no Trigonometry questions in " + (levels.length > 1 ? "levels" : "level") + " " + joinList(levels)]);

			if (contains(topics, "algebra") && !(contains(levels, 4) || contains(levels, 5) || contains(levels, 6) || levels.length == 0))
				warnings.push(["algebra", "There are no Algebra questions in " + (levels.length > 1 ? "levels" : "level") + " " + joinList(levels)]);

			return warnings;
		}

		return getWarnings;
	}];
});
