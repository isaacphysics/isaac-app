define([], function() {


	return ["api", function(api) {

		return {

			scope: true,

			restrict: 'A',

			templateUrl: '/partials/content/Tabs.html',

			link: function(scope, element, attrs) {

				scope.children = undefined;
				scope.$parent.$watch(attrs.children, function(newChildren) {
					scope.children = newChildren;
				});

				scope.activeTab = 0;

				scope.activateTab = function(i) {
					scope.activeTab = i;
					if (scope.children[i].type == "isaacQuestion") {

						var logData = {
							type: "QUICK_QUESTION_TAB_VIEW",
							quickQuestionId: scope.children[i].id,
						};

						if (scope.page) {
							logData.pageId = scope.page.id;
						}

						api.logger.log(logData);
					}
				}
			},
		};
	}];
});