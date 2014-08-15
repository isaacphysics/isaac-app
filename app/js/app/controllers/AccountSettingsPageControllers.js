define([], function() {

	var PageController = ['$scope', 'auth', 'api', '$stateParams', function($scope, auth, api, $stateParams) {

		$scope.user = auth.getUser();

		$scope.save = function() {
			api.account.saveSettings($scope.user);
		}

		$scope.globalFlags.noSearch = true;

		$scope.dob = {
			days: function(){
				var i =1,
					days = [];

				while(i <= 31){
					days.push(i++);
				}
				return days;
			},
			months: function(){
				var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
				return months;
			},
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
		
	}]

	return {
		PageController: PageController,
	};
})