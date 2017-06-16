define([], function() {
	return function() {
		return {
			filter: [
				{label: "All Boards", val: null},
				{label: "Not Started", val: "not_attempted"},
				{label: "In Progress", val: "in_progress"},
				{label: "Completed", val: "completed"}
			],
			sort: [
				{label: "Date Created", val: "created"},
				{label: "Date Visited", val: "visited"},
				{label: "Title Ascending", val: "title"},
				{label: "Title Descending", val: "-title"}
			]
		};
	}
});