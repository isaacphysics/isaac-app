define([], function() {



	var PageController = ['$scope', 'api', '$location', 'tags', '$sce', function($scope, api, $location, tags, $sce) {

		$scope.userInformation = api.currentUserInformation.get();

		$scope.filterPanelOpen = null;

		$scope.openFilterPanel = function(panelNumberToOpen) {
			if ($scope.filterPanelOpen === panelNumberToOpen) {
				// it turns into a toggle
				$scope.filterPanelOpen = null;
			}
			else{
				$scope.filterPanelOpen = panelNumberToOpen;	
			}
		}

		$scope.filterSubjects = ["physics"];
		$scope.filterFields = ["mechanics"];
		$scope.filterTopics = ["shm"];
		$scope.filterLevels = [2,4];
		$scope.filterConcepts = [];

		var watchers = [];

		function addFilterWatchers() {
			watchers.push($scope.$watchCollection("filterSubjects", filterChanged));
			watchers.push($scope.$watchCollection("filterFields", filterChanged));
			watchers.push($scope.$watchCollection("filterTopics", filterChanged));
			watchers.push($scope.$watchCollection("filterLevels", filterChanged));
			watchers.push($scope.$watchCollection("filterConcepts", filterChanged));
		}

		function clearFilterWatchers() {
			var w = null;
			while(w = watchers.pop())
				w();			
		}

		function loadGameBoardById(id) {

			console.debug("Loading game board by id: ", id)

			$scope.gameBoard = api.gameBoards.get({id: id}).$promise.then(function(board) {

				clearFilterWatchers();

				$scope.filterSubjects = board.gameFilter.subjects || [];
				$scope.filterFields = board.gameFilter.fields || [];
				$scope.filterTopics = board.gameFilter.topics || [];
				$scope.filterLevels = board.gameFilter.levels || [];
				$scope.filterConcepts = board.gameFilter.concepts || [];

				addFilterWatchers();

				$scope.gameBoard = board;

			});
		}

		function loadGameBoardFromFilter() {

			console.debug("Loading game board based on filter settings.")

			var params = {};

			if ($scope.filterSubjects.length > 0)
				params.subjects = $scope.filterSubjects.join(",");

			if ($scope.filterFields.length > 0)
				params.fields = $scope.filterFields.join(",");

			if ($scope.filterTopics.length > 0)
				params.topics = $scope.filterTopics.join(",");

			if ($scope.filterLevels.length > 0)
				params.levels = $scope.filterLevels.join(",");

			if ($scope.filterConcepts.length > 0)
				params.concepts = $scope.filterConcepts.join(",");

			$scope.gameBoard = api.gameBoards.filter(params);

			$scope.gameBoard.$promise.then(function(board) {
				$location.hash(board.id);
				lastHash = board.id;
			})
		}

		function filterChanged(newVal, oldVal) {
			if (newVal !== undefined && newVal === oldVal)
				return; // Initialisation

			buildBreadCrumb();

			loadGameBoardFromFilter();
		}

		var lastHash = null;
		function hashChanged() {
			var hash = $location.hash();

			if (hash == lastHash)
				return;

			console.debug("Hash changed:", hash);
			lastHash = hash;

			if (hash) {
				loadGameBoardById(hash);
			} else {
				loadGameBoardFromFilter();
			}			
		}

		function buildBreadCrumb() {

			delete $scope.breadCrumbSubject;
			delete $scope.breadCrumbField;
			delete $scope.breadCrumbTopic;

			if ($scope.filterSubjects.length == 1) {
				$scope.breadCrumbSubject = $scope.filterSubjects[0];

				if ($scope.filterFields.length == 1) {
					$scope.breadCrumbField = $scope.filterFields[0];

					if ($scope.filterTopics.length == 1) {
						$scope.breadCrumbTopic = $scope.filterTopics[0];
					} else if ($scope.filterTopics.length > 1) {
						$scope.breadCrumbTopic = "multiple_topics";
					}

				} else if ($scope.filterFields.length > 1) {
					$scope.breadCrumbField = "multiple_fields";
				}

			} else if ($scope.filterSubjects.length > 1) {
				$scope.breadCrumbSubject = "multiple_subjects";
			}

		}

		$scope.getTagTitle = function(id) {

			switch(id) {
				case "multiple_subjects":
					return $sce.trustAsHtml("Physics&nbsp;&amp;&nbsp;Maths");
				case "multiple_fields":
					return $sce.trustAsHtml("Multiple Fields");
				case "multiple_topics":
					return $sce.trustAsHtml("Multiple Topics");
			}

			for (var i in tags) {
				if (tags[i].id == id)
					return $sce.trustAsHtml(tags[i].title);
			}
		}

		hashChanged();

		addFilterWatchers();

		buildBreadCrumb();

		$(window).on('hashchange', hashChanged);	
		$scope.$on('$stateChangeStart', function() {
			$(window).off('hashchange', hashChanged);
        });	

	}]

	return {
		PageController: PageController,
	};
})