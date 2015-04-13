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

		this.pages = $resource(server + "/api/pages/:id");

		this.pageFragments = $resource(server + "/api/pages/fragments/:id");

		this.pods = $resource(server + "/api/pages/pods");

		this.questionPages = $resource(server + "/api/pages/questions/:id");

		this.conceptPages = $resource(server + "/api/pages/concepts/:id");

		this.questionValidator = $resource(server + "/api/questions/:id/answer", {}, {
			validate: {
				method: "POST",
			}
		});

		this.contactForm = $resource(server + "/api/contact/", {}, {
			send: {
				method: "POST",
			}
		});

		this.gameBoards = $resource(server + "/api/gameboards/:id", {id: "@id"}, {
			filter: {
				method: "GET",
				url: server + "/api/gameboards",
			},
			wildcards: {
				method: "GET",
				url: server + "/api/gameboards/wildcards",
				isArray: true 
			}
		});

		this.contentProblems = $resource(server + "/api/admin/content_problems");

		this.currentUser = $resource(server + "/api/users/current_user", {}, {
			'getProgress': {
				method: 'GET',
				url: server + "/api/users/current_user/progress",
			},
		});

		this.user = $resource("", { }, {
			'getProgress': {
				method: 'GET',
				url: server + "/api/users/:userId/progress",
			}
		})

		this.authentication = $resource("", {}, {
			'getAuthRedirect': {
				method: 'GET',
				url: server+"/api/auth/:provider/authenticate"
			},
			'getLinkRedirect': {
				method: 'GET',
				url: server+"/api/auth/:provider/link",
			},
			'getAuthResult': {
				method: 'GET',
				url: server+"/api/auth/:provider/callback",
			},
			'login': {
				method: 'POST',
				url: server+"/api/auth/segue/authenticate",
			},
			'logout': {
				method: 'POST',
				url: server+"/api/auth/logout",
			}
		});
		
		this.searchEndpoint = $resource(server + "/api/search/:searchTerms?types=:types", {}, {
			'search': {
				method: 'GET', 
				isArray: false 
			}
		});

		this.adminUserSearch = $resource(server + "/api/admin/users/:userId?email=:email", {}, {
			'search': {
				method: 'GET', 
				isArray: true 
			},
			'get' : {
				method: 'GET', 
				isArray: false 
			}
		});

		this.statisticsEndpoint = $resource(server + "/api/admin/stats/", {}, {
			'get' : {
				method: 'GET', 
				isArray: false 
			},
			'getGameboardPopularity' : {
				method: 'GET',
				url: server + "/api/gameboards/popular", 
				isArray: false 
			},
			'getSchoolPopularity' : {
				method: 'GET',
				url: server + "/api/admin/stats/schools/", 
				isArray: true 
			},
			'getSchoolUsers' : {
				method: 'GET',
				url: server + "/api/admin/users/schools/:id", 
				params: {id: '@id'},
				isArray: true 
			}		
		});

		this.adminDeleteUser = $resource(server + "/api/admin/users/:userId", {}, {
			'delete' : {
				method: 'DELETE'
			}
		});

		this.groupManagementEndpoint = $resource(server + "/api/groups/:id", {id: "@id"}, {
			'get' : {
				method: 'GET', 
				isArray: true 
			},
			'getMembers' : {
				method: 'GET',
				url: server + "/api/groups/:id/membership", 
				isArray: true 
			},
			'deleteMember' : {
				method: 'DELETE',
				url: server + "/api/groups/:id/membership/:userId", 
				isArray: true 
			},			
			'getToken' : {
				method: 'GET',
				url: server + "/api/authorisations/token/:id", 
				isArray: false 
			}			
		});

		this.authorisations = $resource(server + "/api/authorisations/", {}, {
			'get' : {
				method: 'GET', 
				isArray: true 
			},
			'useToken' : {
				method: 'POST',
				url: server + "/api/authorisations/use_token/:token",
				params: {token: '@token'}
			},			
			'revoke' : {
				method: 'DELETE',
				url: server + "/api/authorisations/:id" 
			},			
			'getOthers' : {
				method: 'GET',
				url: server + "/api/authorisations/other_users", 
				isArray: true 
			}			
		});	

		this.assignments = $resource(server + "/api/assignments/", {}, {
			'getMyAssignments' : {
				method: 'GET', 
				isArray: true 
			},
			'getAssignmentsOwnedByMe' : {
				method: 'GET', 
				isArray: true,
				url: server + "/api/assignments/assign", 
			},
			'getAssignedGroups' : {
				method: 'GET', 
				isArray: true,
				url: server + "/api/assignments/assign/:gameId", 
				params: {gameId: '@gameId'}
			},					
			'assignBoard' : {
				method: 'POST',
				url: server + "/api/assignments/assign/:gameId/:groupId",
				params: {gameId: '@gameId', groupId: '@groupId'}
			},			
			'unassignBoard' : {
				method: 'DELETE',
				url: server + "/api/assignments/assign/:gameId/:groupId",
				params: {gameId: '@gameId', groupId: '@groupId'}
			},
			'getProgress': {
				method: 'GET',
				url: server + "/api/assignments/assign/:assignmentId/progress",
				isArray: true,
			}			
		});			

		this.events = $resource(server + "/api/events/:id");	

		// allows the resource to be constructed with a promise that can be used to cancel a request
		this.getQuestionsResource = function(canceller) {
			return $resource(server + "/api/pages/questions", {}, {
				'query': {
					method: 'GET', isArray: false, timeout: canceller.promise, params: {searchString:"@searchString", tags:"@tags", levels:"@levels", start_index:"@startIndex", limit:"@limit"}
				}
			})
		};

		this.getUnits = function() { return $http.get(server + "/api/content/units").then(function (r) { return r.data; }); };

		var questionsPerPage = 10;
		var questionList = $resource(server + "/api/pages/questions?searchString=:searchString&tags=:tags&start_index=:startIndex&limit=:limit", {}, {'query': {method: 'GET', isArray: false }});
		var conceptList = $resource(server + "/api/pages/concepts?start_index=:startIndex&limit=:limit", {startIndex: 0, limit: 999}, {'query': {method: 'GET', isArray: false }});
		var gameBoardsList = $resource(server + "/api/users/current_user/gameboards?start_index=:startIndex&sort=:sort:filter:limit", {}, {'query': {method: 'GET', isArray: false }});
		var deleteBoard = $resource(server + "/api/users/current_user/gameboards/:id", {}, {'query': {method: 'DELETE'}});
		var saveBoard = $resource(server + "/api/users/current_user/gameboards/:id", {}, {'query': {method: 'POST'}});
		var eventsList = $resource(server + "/api/events");


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
			return $http.delete(server + "/api/auth/"+provider+"/link");
		}

		this.linkAccount = function(provider, target){
			$http.get(server + "/api/auth/"+provider+"/link?redirect=http://" + target);
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
				return server + "/api/images/" + path;
			}
		}

		this.admin = {
			synchroniseDatastores: function() {
				return $http.post(server + "/api/admin/synchronise_datastores").then(function() {
					console.warn("Synchronising Datastores. The next page load will take a while.");
				});
			}
		};

		this.account = $resource(server + "/api/users", {}, {
			saveSettings: {
				method: "POST",
			}
		});

		this.schools = $resource(server + "/api/schools");

		this.environment = $resource(server + "/api/info/segue_environment");

		this.password = $resource(server + "/api/users/resetpassword/:token", null, {
			reset: {
				method: "POST",
			}
		});

		this.logger = $resource(server + "/api/log", {}, {
			log : {
				method: "POST",
			}
		})

		this.contentVersion = $resource("", {}, {
			"get": {
				method: "GET",
				url: server + "/api/info/content_versions/live_version",
			},
			"set": {
				method: "POST",
				url: server + "/api/admin/live_version/:version",
			}
		})


	}

	return Api;
});