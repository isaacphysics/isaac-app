define([], function() {

	var PageController = ['$scope', 'auth', 'api', '$stateParams', function($scope, auth, api, $stateParams) {

		$scope.user = auth.getUser();

		// Remove search
		$scope.globalFlags.noSearch = true;

		// Create date of birth select options
		$scope.dob = {
			days: function(){
				var i =1,
					days = [];

				while(i <= 31){
					days.push(i++);
				}
				return days;
			},
			months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
			years: function(){
				var currentYear = new Date().getFullYear(),
					years = [],
					startYear = 1900;

				while(startYear <= currentYear){
					years.push(startYear++);
				}
				return years.reverse();
			}
		}
		$scope.save = function() {
			var valid = new Date(1990, 10, 30).getMonth() == 10;
			alert(valid);
			$scope.user.dateOfBirth = '10101990'
			api.account.saveSettings($scope.user);
		}

	}]

	return {
		PageController: PageController,
	};
})