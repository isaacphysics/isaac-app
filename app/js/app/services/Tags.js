define([], function() {

	var TagsFactory = function TagsFactory() {
		this.tagArray = [

			// Subjects

			{
				id: "physics"
			}, {
				id: "maths"
			}, 

			// Physics fields

			{
				id: "mechanics",
				parent: "physics"
			}, {
				id: "waves",
				parent: "physics",
				comingSoon: true
			}, {
				id: "fields",
				parent: "physics",
				comingSoon: true
			}, {
				id: "circuits",
				parent: "physics",
				comingSoon: true
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
			}, {
				id: "probability",
				parent: "maths"
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
				id: "greek",
				parent: "geometry"
			}, {
				id: "symmetry",
				parent: "geometry"
			},
			
			// Calculus topics

			{
				id: "integration",
				parent: "calculus"
			}, {
				id: "differentiation",
				parent: "calculus"
			}, {
				id: "differential_equations",
				parent: "calculus"
			},

			// Algebra topics

			{
				id: "simultaneous_equations",
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

		return this;
	};

	return TagsFactory;
});