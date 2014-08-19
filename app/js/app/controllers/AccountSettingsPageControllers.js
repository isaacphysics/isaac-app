define([], function() {

	var PageController = ['$scope', 'auth', 'api', '$stateParams', function($scope, auth, api, $stateParams) {
		// Create date of birth select options
		$scope.datePicker = {
			days: [],
			months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
			years: []
		};

		// Populate days
		for (var i = 1; i <= 31; i++) {
			$scope.datePicker.days.push(i);
		}

		// Populate years
		var currentYear = new Date().getFullYear();
		for (var i = currentYear; i > 1900; i--) {
			$scope.datePicker.years.push(i);
		}

		$scope.dob = {};

		auth.getUser().$promise.then(function(user) {
			$scope.user = user;
			if ($scope.user.dateOfBirth != null) {
				var date = new Date($scope.user.dateOfBirth);
				$scope.dob.day = date.getDate();
				$scope.dob.month = $scope.datePicker.months[date.getMonth()];
				$scope.dob.year = date.getFullYear();
			}
		});

		// Watch for changes to the DOB selection
		$scope.$watchCollection('dob', function() {
			if ($scope.user == null) {
				// User object hasn't been initialised yet
				return;
			}

			var dob = new Date($scope.dob.year, $scope.datePicker.months.indexOf($scope.dob.month), $scope.dob.day);
			if (!isNaN(dob.getTime())) {
				$scope.user.dateOfBirth = dob.getTime();
			}
		});

		// Remove search
		$scope.globalFlags.noSearch = true;

		$scope.save = function() {
			api.account.saveSettings($scope.user);
		}

	}]

	return {
		PageController: PageController,
	};
})