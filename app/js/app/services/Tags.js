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

	return ['subject', function TagsConstructor(subjectService) {
		this.tagArray = [

			// Subjects

			{
				id: "physics"
			}, {
				id: "maths"
			}, {
				id: "chemistry"
			},

			// Physics fields

			{
				id: "mechanics",
				parent: "physics"
			}, {
				id: "waves",
				parent: "physics"
			}, {
				id: "fields",
				parent: "physics"
			}, {
				id: "circuits",
				parent: "physics"
			}, 
			{
				id: "chemphysics",
				title: "Physical Chemistry",
				parent: "physics"
			},

			// Mechanics topics

			{
				id: "statics",
				parent: "mechanics"
			}, {
				id: "dynamics",
				parent: "mechanics"
			}, {
				id: "shm",
				title: "SHM",
				parent: "mechanics"
			}, {
				id: "angular_motion",
				parent: "mechanics"
			}, {
				id: "circular_motion",
				parent: "mechanics"
			}, {
				id: "kinematics",
				parent: "mechanics"
			},

			// Fields topics

			{
				id: "electric",
				title: "Electric Fields",
				parent: "fields"
			}, {
				id: "magnetic",
				title: "Magnetic Fields",
				parent: "fields"
			}, {
				id: "gravitational",
				title: "Gravitational Fields",
				parent: "fields"
			}, {
				id: "combined",
				title: "Combined Fields",
				parent: "fields"
			},

			// Circuits topics

			{
			    id: "resistors",
			    parent: "circuits"
			}, {
			    id: "capacitors",
			    parent: "circuits"
			}, {
			    id: "general_circuits",
			    parent: "circuits",
			    title: "General Circuits"
			},

			// Waves topics:

			{
			    id: "optics",
			    parent: "waves"
			}, {
			    id: "superposition",
			    parent: "waves"
			}, {
			    id: "wave_motion",
			    parent: "waves",
			    title: "Wave Motion"
			},

			// Physical Chemistry topics:

			{
			    id: "thermodynamics",
			    parent: "chemphysics"
			}, {
				id:"kinetics",
				parent: "chemphysics",
				title: "Reaction Kinetics",
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
				parent: "maths"
			},
			// Removed 18/8/16
			// {
			// 	id: "probability",
			// 	parent: "maths",
			// 	comingSoon:true,
			// }, 

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
				id: "general_functions",
				parent: "functions"
			}, {
				id: "graph_sketching",
				parent: "functions",
				comingSoon: true,
			},

			// // Probability topics
			// Removed 18/8/16
			// {
			// 	id: "means",
			// 	parent: "probability"
			// }, {
			// 	id: "prob_functions",
			// 	title: "Functions",
			// 	parent: "probability"
			// }, {
			// 	id: "distributions",
			// 	parent: "probability"
			// }

		];

		this.getById = function(id) {
			for (var i in this.tagArray) {
				if (this.tagArray[i].id === id) {
					return this.tagArray[i];
				}
			}
		};

		this.getSpecifiedTag = function(tagType, tagArray) {
			// Return the first (as ordered in tagArray) tag an object has of a given type!
			if (tagArray == null) return null;

			for (var i in tagArray) {
				var tag = this.getById(tagArray[i]);
				if (tag != null && tag.type === tagType) {
					return tag;
				}
			}

			return null;
		};

		this.getAllSpecifiedTags = function(tagType, tagArray) {
			// Return all tags an object has of a given type!
			if (tagArray == null) return [];

			var tags = [];
			for (var i in tagArray) {
				var tag = this.getById(tagArray[i]);
				if (tag != null && tag.type === tagType) {
					tags.push(tag);
				}
			}

			return tags;
		};

		this.getPageSubjectTag = function(tagArray) {
			// Extract the subject tag from a tag array,
			// defaulting to the current site subject if no tags
			// and intelligently choosing if more than one subject tag.
			var globalSubjectTagId = subjectService.id;

			if (tagArray == null || tagArray.length == 0) {
				return this.getById(globalSubjectTagId);
			}

			var subjectTags = this.getAllSpecifiedTags("subject", tagArray);			
			for (var i in subjectTags) {
				if (subjectTags[i].id == globalSubjectTagId) {
					return subjectTags[i];
				}
			}
			return subjectTags[0];
		};

		this.getSubjectTag = this.getSpecifiedTag.bind(this, "subject");
		this.getAllSubjectTags = this.getAllSpecifiedTags.bind(this, "subject");

		this.getFieldTag = this.getSpecifiedTag.bind(this, "field");
		this.getAllFieldTags = this.getAllSpecifiedTags.bind(this, "field");

		this.getTopicTag = this.getSpecifiedTag.bind(this, "topic");
		this.getAllTopicTags = this.getAllSpecifiedTags.bind(this, "topic");

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

		this.getDescendents = function(tagId) {
			var descs = [];

			for (var i in this.tagArray) {
				if (this.tagArray[i].parent == tagId) {
					descs.push(this.tagArray[i]);
					descs = descs.concat(this.getDescendents(this.tagArray[i].id));
				}
			}

			return descs;
		}

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
	}];

});