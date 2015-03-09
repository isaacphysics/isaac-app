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

	return function TagsConstructor() {
		this.tagArray = [

			// Subjects

			{
				id: "biology"
			}, {
				id: "maths"
			}, 

			// Biology fields

			{
				id: "ecology",
				parent: "biology"
			}, {
				id: "genetics",
				parent: "biology",
				enabled: true,
				comingSoon: false,
			},

			// Mechanics topics

			{
				id: "populations",
				parent: "ecology"
			}, {
				id: "communities",
				parent: "ecology"
			},

			// Fields topics

			{
				id: "molecular_biology",
				title: "Molecular Biology",
				parent: "genetics",
				enabled: false,
				comingSoon: true,
			}, {
				id: "transmission",
				parent: "genetics",
				enabled: false,
				comingSoon: true,
			},

			// Maths fields

			{
				id: "geometry",
				parent: "maths"
			}, {
				id: "calculus",
				parent: "maths"
			}, {
				id: "algebra",
				parent: "maths"
			}, {
				id: "functions",
				parent: "maths",
				comingSoon:true,
			}, {
				id: "probability",
				parent: "maths",
				comingSoon:true,
			}, 

			// Geometry topics

			{
				id: "geom_vectors",
				title: "Vectors",
				parent: "geometry"
			}, {
				id: "trigonometry",
				parent: "geometry"
			}, {
				id: "shapes",
				parent: "geometry"
			}, {
				id: "symmetry",
				parent: "geometry",
				comingSoon: true,
			},
			
			// Calculus topics

			{
				id: "integration",
				parent: "calculus"
			}, {
				id: "differentiation",
				parent: "calculus"
			}, {
				id: "differential_eq",
				title: "Differential Equations",
				parent: "calculus"
			},

			// Algebra topics

			{
				id: "simultaneous",
				title: "Simultaneous Equations",
				parent: "algebra"
			}, {
				id: "quadratics",
				parent: "algebra"
			}, {
				id: "manipulation",
				parent: "algebra"
			}, {
				id: "series",
				parent: "algebra"
			},
			
			// Functions topics

			{
				id: "special",
				parent: "functions"
			}, {
				id: "trigonometric",
				parent: "functions"
			}, {
				id: "curve_sketching",
				parent: "functions"
			},

			// Probability topics

			{
				id: "means",
				parent: "probability"
			}, {
				id: "prob_functions",
				title: "Functions",
				parent: "probability"
			}, {
				id: "distributions",
				parent: "probability"
			}

		];

		this.getById = function(id) {
			for (var i in this.tagArray) {
				if (this.tagArray[i].id === id) {
					return this.tagArray[i];
				}
			}
		};

		this.getSubjectTag = function(tagArray) {
			if (tagArray == null) return null;

			for (var i in tagArray) {
				var tag = this.getById(tagArray[i]);
				if (tag != null && tag.type === "subject") {
					return tag;
				}
			}
		};

		this.getDeepestTag = function(tagArray) {
			if (tagArray == null) return null;

			var deepestTag = null;
			for (var i in tagArray) {
				var tag = this.getById(tagArray[i]);
				if (tag != null && (deepestTag == null || tag.level > deepestTag.level)) {
					deepestTag = tag;
				}
			}
			return deepestTag;
		};

		var tagHeirarchy = ["subject", "field", "topic"];

		var generateTitle = function(tag) {
			if (tag.title)
				return tag.title;

			return tag.id.replace(/_/g, " ").replace(/\w*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
		};

		for (var i in this.tagArray) {
			this.tagArray[i].title = generateTitle(this.tagArray[i]);
			var j = 0;
			if (this.tagArray[i].parent) {
				var parent = this.getById(this.tagArray[i].parent);
				j++;
				while (parent.parent) {
					j++;
					parent = this.getById(parent.parent);
				}
			}
			this.tagArray[i].type = tagHeirarchy[j];
			this.tagArray[i].level = j;
		}
	};

});