/**
 * Copyright 2014 Ian Davies
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

	var Api = function ApiConstructor($resource, server, $http) {

		var uriPrefix = server + "/api/1.2.3/api";

		this.pages = $resource(uriPrefix + "/pages/:id");

		this.pageFragments = $resource(uriPrefix + "/pages/fragments/:id");

		this.pods = $resource(uriPrefix + "/pages/pods");

		this.questionsPage = $resource(uriPrefix + "/pages/question_summary/top_boards_content");

		this.questionPages = $resource(uriPrefix + "/pages/questions/:id");

		this.conceptPages = $resource(uriPrefix + "/pages/concepts/:id");

		this.questionValidator = $resource(uriPrefix + "/questions/:id/answer", {}, {
			validate: {
				method: "POST",
			},
		});

		this.contactForm = $resource(uriPrefix + "/contact/", {}, {
			send: {
				method: "POST",
			},
		});

		this.gameBoards = $resource(uriPrefix + "/gameboards/:id", {id: "@id"}, {
			filter: {
				method: "GET",
				url: uriPrefix + "/gameboards",
			},
			wildcards: {
				method: "GET",
				url: uriPrefix + "/gameboards/wildcards",
				isArray: true 
			},
		});

		this.contentProblems = $resource(uriPrefix + "/admin/content_problems");

		this.currentUser = $resource(uriPrefix + "/users/current_user", {}, {
			'getProgress': {
				method: 'GET',
				url: uriPrefix + "/users/current_user/progress",
			},
		});

		this.user = $resource("", { }, {
			'getProgress': {
				method: 'GET',
				url: uriPrefix + "/users/:userId/progress",
			},
			'getEventsOverTime' : {
				method: 'GET',
				url: uriPrefix + "/users/:userId/event_data/over_time?from_date=:from_date&to_date=:to_date&events=:events"
			},
			'getEmailPreferences' : {
				method: 'GET',
				url: uriPrefix + "/users/email_preferences"
			},
		})

		this.authentication = $resource("", {}, {
			'getAuthRedirect': {
				method: 'GET',
				url: uriPrefix+"/auth/:provider/authenticate"
			},
			'getLinkRedirect': {
				method: 'GET',
				url: uriPrefix+"/auth/:provider/link",
			},
			'getAuthResult': {
				method: 'GET',
				url: uriPrefix+"/auth/:provider/callback",
			},
			'login': {
				method: 'POST',
				url: uriPrefix+"/auth/segue/authenticate",
			},
			'logout': {
				method: 'POST',
				url: uriPrefix+"/auth/logout",
			},
		});
		
		this.searchEndpoint = $resource(uriPrefix + "/search/:searchTerms?types=:types", {}, {
			'search': {
				method: 'GET', 
				isArray: false 
			},
		});

		this.adminUserSearch = $resource(uriPrefix + "/admin/users/:userId?email=:email", {}, {
			'search': {
				method: 'GET', 
				isArray: true 
			},
			'get' : {
				method: 'GET', 
				isArray: false 
			},
		});

		this.adminUserManagerChange = $resource("", {}, {
			'change_role' : {
				method : 'POST',
				isArray: true,
				url: uriPrefix+"/admin/users/change_role/:role",
				params: {role: "@role"}
			},
			'changeEmailVerificationStatus' : {
				method : 'POST',
				isArray: true,
				url: uriPrefix+"/admin/users/change_email_verification_status/:emailVerificationStatus",
				params: {emailVerificationStatus: '@emailVerificationStatus'},
			}
		});

		this.statisticsEndpoint = $resource(uriPrefix + "/admin/stats/", {}, {
			'get' : {
				method: 'GET', 
				isArray: false 
			},
			'getGameboardPopularity' : {
				method: 'GET',
				url: uriPrefix + "/gameboards/popular", 
				isArray: false 
			},
			'getSchoolPopularity' : {
				method: 'GET',
				url: uriPrefix + "/admin/stats/schools/", 
				isArray: true 
			},
			'getSchoolUsers' : {
				method: 'GET',
				url: uriPrefix + "/admin/users/schools/:id", 
				params: {id: '@id'},
			},
			'getEventsOverTime' : {
				method: 'GET',
				url: uriPrefix + "/admin/users/event_data/over_time?from_date=:from_date&to_date=:to_date&events=:events&bin_data=:bin_data"
			},
			'getUserLocations' : {
				method: 'GET',
				url: uriPrefix + "/admin/stats/users/last_locations?from_date=:from_date&to_date=:to_date", 
				isArray: true 
			},
			'getLogEventTypes' : {
				method: 'GET',
				url: uriPrefix + "/info/log_event_types",
			},			
		});

		this.adminDeleteUser = $resource(uriPrefix + "/admin/users/:userId", {}, {
			'delete' : {
				method: 'DELETE'
			},
		});

		this.groupManagementEndpoint = $resource(uriPrefix + "/groups/:id", {id: "@id"}, {
			'get' : {
				method: 'GET', 
				isArray: true 
			},
			'delete' :{
				method: 'DELETE',
				url: uriPrefix + "/groups/:id", 
				isArray: true
			},
			'getMembers' : {
				method: 'GET',
				url: uriPrefix + "/groups/:id/membership", 
				isArray: true 
			},
			'deleteMember' : {
				method: 'DELETE',
				url: uriPrefix + "/groups/:id/membership/:userId", 
				isArray: true 
			},			
			'getToken' : {
				method: 'GET',
				url: uriPrefix + "/authorisations/token/:id", 
				isArray: false 
			},		
		});

		this.authorisations = $resource(uriPrefix + "/authorisations/", {}, {
			'get' : {
				method: 'GET', 
				isArray: true 
			},
			'useToken' : {
				method: 'POST',
				url: uriPrefix + "/authorisations/use_token/:token",
				params: {token: '@token'}
			},			
			'revoke' : {
				method: 'DELETE',
				url: uriPrefix + "/authorisations/:id" 
			},			
			'getOthers' : {
				method: 'GET',
				url: uriPrefix + "/authorisations/other_users", 
				isArray: true 
			},
			'getTokenOwner' : {
				method: 'GET',
				url: uriPrefix + "/authorisations/token/:token/owner", 
				isArray: false 
			},				
		});	

		this.assignments = $resource(uriPrefix + "/assignments/", {}, {
			'getMyAssignments' : {
				method: 'GET', 
				isArray: true,
				params: {assignmentStatus: '@assignmentStatus'}
			},
			'getAssignmentsOwnedByMe' : {
				method: 'GET', 
				isArray: true,
				url: uriPrefix + "/assignments/assign", 
			},
			'getAssignedGroups' : {
				method: 'GET', 
				isArray: true,
				url: uriPrefix + "/assignments/assign/:gameId", 
				params: {gameId: '@gameId'}
			},					
			'assignBoard' : {
				method: 'POST',
				url: uriPrefix + "/assignments/assign/:gameId/:groupId",
				params: {gameId: '@gameId', groupId: '@groupId'}
			},			
			'unassignBoard' : {
				method: 'DELETE',
				url: uriPrefix + "/assignments/assign/:gameId/:groupId",
				params: {gameId: '@gameId', groupId: '@groupId'}
			},
			'getProgress': {
				method: 'GET',
				url: uriPrefix + "/assignments/assign/:assignmentId/progress",
				isArray: true,
			},
		});			

        this.events = $resource(uriPrefix + "/events/:id");

		this.eventBookings = $resource(uriPrefix + "/events/:eventId/bookings/:userId", {eventId: '@eventId', userId: '@userId'}, {
			'getAllBookings' : {
				url: uriPrefix + "/events/bookings",
				method: 'GET', 
			},
			'getBookings' : {
				url: uriPrefix + "/events/:eventId/bookings",
				method: 'GET', 
				isArray: true
			},
			'makeBooking' : {
				method: 'POST', 
				url: uriPrefix + "/events/:eventId/bookings/:userId"			
			},
			'deleteBooking' : {
				method: 'DELETE', 
				url: uriPrefix + "/events/:eventId/bookings/:userId"			
			},
		});	

		// allows the resource to be constructed with a promise that can be used to cancel a request
		this.getQuestionsResource = function(canceller) {
			return $resource(uriPrefix + "/pages/questions", {}, {
				'query': {
					method: 'GET', isArray: false, timeout: canceller.promise, params: {searchString:"@searchString", tags:"@tags", levels:"@levels", start_index:"@startIndex", limit:"@limit"}
				}
			})
		};

		this.getUnits = function() { return $http.get(uriPrefix + "/content/units").then(function (r) { return r.data; }); };

		var questionsPerPage = 10;
		var questionList = $resource(uriPrefix + "/pages/questions?searchString=:searchString&tags=:tags&start_index=:startIndex&limit=:limit", {}, {'query': {method: 'GET', isArray: false }});
		var conceptList = $resource(uriPrefix + "/pages/concepts?start_index=:startIndex&limit=:limit", {startIndex: 0, limit: 999}, {'query': {method: 'GET', isArray: false }});
		var gameBoardsList = $resource(uriPrefix + "/users/current_user/gameboards?start_index=:startIndex&sort=:sort:filter:limit", {}, {'query': {method: 'GET', isArray: false }});
		var deleteBoard = $resource(uriPrefix + "/users/current_user/gameboards/:id", {}, {'query': {method: 'DELETE'}});
		var saveBoard = $resource(uriPrefix + "/users/current_user/gameboards/:id", {}, {'query': {method: 'POST'}});
		var eventsList = $resource(uriPrefix + "/events");


		this.getQuestionList = function(page){
			return questionList.query({"startIndex" : page*questionsPerPage, "limit" : questionsPerPage});
		}

		this.userGameBoards = function(filter, sort, index, limit){
			return gameBoardsList.query({"filter" : (filter != null) ? '&show_only='+filter : '', "sort" : sort, "startIndex" : index, "limit" : (limit != null) ? '&limit='+limit : ''});
		}
		
		this.deleteGameBoard = function(id){
			return deleteBoard.query({"id" : id});
		}

		this.saveGameBoard = function(id) {
			return saveBoard.query({"id": id}, {});
		}
     
		this.removeLinkedAccount = function(provider) {
			return $http.delete(uriPrefix + "/auth/"+provider+"/link");
		}

		this.linkAccount = function(provider, target){
			$http.get(uriPrefix + "/auth/"+provider+"/link?redirect=http://" + target);
		}

		this.getConceptList = function(){
			return conceptList.query();
		}

		this.getEventsList = function(startIndex, limit, showActiveOnly, showInactiveOnly, tags) {
			return eventsList.get({start_index: startIndex, limit: limit, show_active_only: showActiveOnly, show_inactive_only: showInactiveOnly, tags: tags});
		}

		this.getImageUrl = function(path) {
			// check if the image source is a fully qualified link (suggesting it is external to the Isaac site)
			if(path.indexOf("http") > -1){
				return path;
			}
			else{
				return uriPrefix + "/images/" + path;
			}
		}

		this.admin = {
			synchroniseDatastores: function() {
				return $http.post(uriPrefix + "/admin/synchronise_datastores").then(function() {
					console.warn("Synchronising Datastores. The next page load will take a while.");
				});
			}
		};

		this.account = $resource(uriPrefix + "/users", {}, {
			saveSettings: {
				method: "POST",
			}
		});

		this.schools = $resource(uriPrefix + "/schools", {}, {
			'get': {
				method: 'GET', 
				isArray: false 
			},
			'getSchoolOther' : {
				url: uriPrefix + "/users/schools_other",
				method: 'GET', 
				isArray: true
			},
		})

		this.environment = $resource(uriPrefix + "/info/segue_environment");

		this.segueInfo = $resource(uriPrefix + "/search/:searchTerms?types=:types", {}, {
			"segueVersion": {
				method: "GET",
				url: uriPrefix + "/info/segue_version",
			},
			"cachedVersion": {
				method: "GET",
				url: uriPrefix + "/info/content_versions/cached",
			},
		});

		this.password = $resource(uriPrefix + "/users/resetpassword/:token", null, {
			reset: {
				method: "POST",
			},
		});

		this.emailVerification = $resource(uriPrefix + "/users/verifyemail/:userid/:email/:token", null, {
			verify: {
				method: "GET"
			},
		});

		this.verifyEmail = $resource(uriPrefix + "/users/verifyemail/:email", null, {
			requestEmailVerification: {
				method: "GET"
			},
		});

		this.email = $resource(uriPrefix + "", null, {
			get: {
				method: "GET",
				url: uriPrefix + "/email/viewinbrowser/:id",
				isArray:false
			},
			getPreferences: {
				method: "GET",
				url: uriPrefix + "/email/preferences",
				isArray:true
			},
			sendEmail : {
				method: "POST",
				url: uriPrefix + "/email/sendemail/:contentid/:emailtype",
			}, 
			sendEmailWithIds : {
				method: "POST",
				url: uriPrefix + "/email/sendemailwithuserids/:contentid/:emailtype",
				isArray:true
			},
			getQueueSize : {
				method: "GET",
				url: uriPrefix + "/email/queuesize",
			}
		});

		this.logger = $resource(uriPrefix + "/log", {}, {
			log : {
				method: "POST",
			},
		})

		this.contentVersion = $resource("", {}, {
			"get": {
				method: "GET",
				url: uriPrefix + "/info/content_versions/live_version",
			},
			"set": {
				method: "POST",
				url: uriPrefix + "/admin/live_version/:version",
			},
			"currentIndexQueue" : {
				method: "GET",
				url: uriPrefix + "/admin/content_index_queue",
			},
			"emptyIndexQueue" : {
				method: "DELETE",
				url: uriPrefix + "/admin/content_index_queue",
			}			
		});

		this.notifications = $resource(uriPrefix + "/notifications", {}, {
			"respond": {
				method: "POST",
				url: uriPrefix + "/notifications/:id/:response",
			}
		})
		
		this.getCSVDownloadLink = function(assignmentId) {
			return uriPrefix + "/assignments/assign/" + assignmentId + "/progress/download"
		}

		this.questionsAnswered = $resource(uriPrefix + "/stats/questions_answered/count");

	}

	return Api;
});