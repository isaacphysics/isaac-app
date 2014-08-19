define([], function() {

	var PageController = ['$scope', 'auth', 'api', '$stateParams', function($scope, auth, api, $stateParams) {
		// Grab these for setting date later
		var dobDay = document.getElementById('dob-day'),
			dobMonth = document.getElementById('dob-month'),
			dobYear = document.getElementById('dob-year');

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
			// Retrieve dob
			var dobDayValue = dobDay.options[dobDay.selectedIndex].value,
				dobMonthValue = ++dobMonth.options[dobMonth.selectedIndex].value,
				dobYearValue = dobYear.options[dobYear.selectedIndex].value;

			// Set dob before posting to the API
			$scope.user.dateOfBirth = dobDayValue+dobMonthValue+dobYearValue;
			api.account.saveSettings($scope.user);
		}

	}]

	return {
		PageController: PageController,
	};
})