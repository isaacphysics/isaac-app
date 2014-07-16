define([], function() {

	var TagsFactory = [function TagsFactory() {

		var tags = [

			// Subjects

			{
				id: "physics",
			}, {
				id: "maths",
			}, 

			// Physics fields

			{
				id: "mechanics",
				parent: "physics",
			}, {
				id: "waves",
				parent: "physics",
				comingSoon: true,
			}, {
				id: "fields",
				parent: "physics",
				comingSoon: true,
			}, {
				id: "circuits",
				parent: "physics",
				comingSoon: true,
			},

			// Maths fields

			{
				id: "geometry",
				parent: "maths",
			}, {
				id: "calculus",
				parent: "maths",
			}, {
				id: "algebra",
				parent: "maths",
			}, {
				id: "functions",
				parent: "maths",
			}, {
				id: "probability",
				parent: "maths",
			}, 

			// Mechanics topics

			{
				id: "statics",
				parent: "mechanics",
			}, {
				id: "dynamics",
				parent: "mechanics",
			}, {
				id: "shm",
				title: "SHM",
				parent: "mechanics",
			}, , {
				id: "angular_motion",
				parent: "mechanics",
			}, {
				id: "circular_motion",
				parent: "mechanics",
			}, {
				id: "kinematics",
				parent: "mechanics",
			},

		];

		var generateTitle = function(tag) {

			if (tag.title)
				return tag.title;

			return tag.id.replace(/_/g, " ").replace(/\w*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
		}

		for (var i in tags) {
			tags[i].title = generateTitle(tags[i]);
		}


		return tags;

	}];

	return TagsFactory;
});