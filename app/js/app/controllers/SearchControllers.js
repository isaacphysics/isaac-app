define([], function() {
	var defaultSearchOptions = {query: "", typesToInclude: [], includeConcepts: true, includeQuestions: true};

	var doSearch = function(api, query, typesToInclude, $location) {
		if (query != null) {
			var response = api.searchEndpoint.search({searchTerms: query, types: typesToInclude});
			$location.replace();
			$location.search({query: query, types: typesToInclude.join(",")})
			return response;			
		}
	}

	var changeTypeState = function(modelName, typeName, api, query, typesToInclude, $location) {
		var index = typesToInclude.indexOf(typeName);
		if(modelName && index == -1){
			typesToInclude.push(typeName);
		} else if(!modelName && index != -1){
			typesToInclude.splice(index, 1);
		}
	}

	var PageController = ['$scope', '$state', '$timeout', '$location', '$rootScope', 'api', 'query', 'types', 'pageIndex', function($scope, $state, $timeout, $location, $rootScope, api, query, types, pageIndex) {
		var conceptPage = "isaacConceptPage";
		var questionPage = "isaacQuestionPage";

		$rootScope.globalFlags.siteSearchOpen = false;
		
		// initialise scope
		$scope.models = defaultSearchOptions;
		$scope.models.query = query;
		$scope.models.typesToInclude = types;
		
		// Initialise model booleans with input from router (type)
		if ($scope.models.typesToInclude.length > 0){
			$scope.models.includeConcepts = ($scope.models.typesToInclude.indexOf(conceptPage) != -1 ? true : false);
			$scope.models.includeQuestions =  ($scope.models.typesToInclude.indexOf(questionPage) != -1 ? true : false);
		} else {
			if ($scope.models.includeConcepts) {
				$scope.models.typesToInclude.push(conceptPage);
			}
			if ($scope.models.includeQuestions) {
				$scope.models.typesToInclude.push(questionPage);
			}
		}

		var timer = null;
		$scope.$watch('models.query', function() { 
	        if (timer) {
	        	$timeout.cancel(timer);
	        	timer = null;
	        }

	        timer = $timeout(function() {
	            $scope.response = doSearch(api, $scope.models.query, $scope.models.typesToInclude, $location);
	        }, 500);
		});

		$scope.$watch('models.includeConcepts', function(newVal, oldVal) {
			if (newVal === oldVal) return;
			 changeTypeState($scope.models.includeConcepts, conceptPage, api, $scope.models.query, $scope.models.typesToInclude, $location)
			 $scope.response = doSearch(api, $scope.models.query, $scope.models.typesToInclude, $location)
		});

		$scope.$watch('models.includeQuestions', function(newVal, oldVal) {
			if (newVal === oldVal) return;
			changeTypeState($scope.models.includeQuestions, questionPage, api, $scope.models.query, $scope.models.typesToInclude, $location)
			$scope.response = doSearch(api, $scope.models.query, $scope.models.typesToInclude, $location)
		});
		// goes to a state depending on the summary object that we get given. TODO: maybe put this some where more useful.
		$scope.goToState = function(summaryObject) {
			if (summaryObject.type === conceptPage) {
				$state.go("concept", {id: summaryObject.id});
			} else if (summaryObject.type === questionPage) {
				$state.go("question", {id: summaryObject.id});
			}
		}
	}]

	var GlobalSearchController = ['$scope', '$state', '$timeout', '$location', '$rootScope', 'api', function($scope, $state, $timeout, $location, $rootScope, api) {
		var conceptPage = "isaacConceptPage";
		var questionPage = "isaacQuestionPage";

		// initialise scope
		$scope.models = defaultSearchOptions;

		$scope.$watch('models.includeConcepts', function(newVal, oldVal) {
			if (newVal === oldVal) return;
			$scope.response = changeTypeState($scope.models.includeConcepts, conceptPage, api, $scope.models.query, $scope.models.typesToInclude, $location);
		});

		$scope.$watch('models.includeQuestions', function(newVal, oldVal) {
			if (newVal === oldVal) return;
			$scope.response = changeTypeState($scope.models.includeQuestions, questionPage, api, $scope.models.query, $scope.models.typesToInclude, $location);
		});

		$scope.triggerSearch = function() {
			$rootScope.globalFlags.siteSearchOpen = false;
			if(!$state.includes('searchResults')) {
				$state.go('searchResults', {query: $scope.models.query, types: $scope.models.typesToInclude});
			}
		}
	}];

	return {
		PageController: PageController,
		GlobalSearchController: GlobalSearchController,
	};
})