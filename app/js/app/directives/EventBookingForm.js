/**
 * Copyright 2015 Stephen Cummins
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at
 * 		http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
define([], function() {


	return ["api", "$rootScope", function(api, $rootScope) {

		return {
			scope: true,

 			restrict: "A",
			
			templateUrl: "/partials/event_booking_form.html",

			link: function(scope, element, attrs) {

				scope.editingSelf = scope.targetUser._id == scope.user._id

				scope.makeBooking = function(eventId, userId, additionalInformation){

					if (!scope.editingSelf) {
						// route used by event managers to force book users on to an event (with minimal validation)
						api.eventBookings.makeBooking({"eventId": eventId, "userId" : userId}, additionalInformation).$promise.then(function(booking){
							$rootScope.modals.eventBookingModal.hide()
							$rootScope.showToast($rootScope.toastTypes.Success, booking.bookingStatus + " Booking Created", "The user now has a " + booking.bookingStatus + " booking");
							scope.callback();
						})
						.catch(function(e){
			                    console.log("error:" + e)
			                    $rootScope.showToast($rootScope.toastTypes.Failure, "Event Booking Failed", "With error message: (" + e.status + ") "+ e.status + ") "+ e.data.errorMessage != undefined ? e.data.errorMessage : "");
			            });
					} else {
						// user process

					}
					
				}
			}
		};
	}];
});
