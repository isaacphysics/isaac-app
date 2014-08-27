define([], function() {


	var Api = function ApiConstructor($resource, server, $http) {

		this.pages = $resource(server + "/api/pages/:id");

		this.pageFragments = $resource(server + "/api/pages/fragments/:id");

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
			}
		});

		this.contentProblems = $resource(server + "/api/admin/content_problems");

		this.currentUser = $resource(server + "/api/users/current_user");

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

		this.loginEndpoint = $resource(this.authenticationEndpoint + "/segue/authenticate", {}, {
			login: {
				method: "POST",
			}
		});

		this.getUnits = function() { return $http.get(server + "/api/content/units").then(function (r) { return r.data; }); };


		var questionsPerPage = 10;
		var questionList = $resource(server + "/api/pages/questions?start_index=:startIndex&limit=:limit", {}, {'query': {method: 'GET', isArray: false }});
		var conceptList = $resource(server + "/api/pages/concepts?start_index=:startIndex&limit=:limit", {startIndex: 0, limit: 999}, {'query': {method: 'GET', isArray: false }});
		var gameBoardsList = $resource(server + "/api/users/current_user/gameboards?start_index=:startIndex&sort=:sort:filter:limit", {}, {'query': {method: 'GET', isArray: false }});
		var deleteBoard = $resource(server + "/api/users/current_user/gameboards/:id", {}, {'query': {method: 'DELETE'}});

		this.getQuestionList = function(page){
			return questionList.query({"startIndex" : page*questionsPerPage, "limit" : questionsPerPage});
		}

		this.userGameBoards = function(filter, sort, index, limit){
			return gameBoardsList.query({"filter" : (filter != null) ? '&show_only='+filter : '', "sort" : sort, "startIndex" : index, "limit" : (limit != null) ? '&limit='+limit : ''});
		}
		
		this.deleteGameBoard = function(id){
			return deleteBoard.query({"id" : id});
		}
     
		this.removeLinkedAccount = function(provider) {
			$http.delete(server + "/api/auth/"+provider+"/link");
		}

		this.linkAccount = function(provider, target){
			$http.get(server + "/api/auth/"+provider+"/link?redirect=http://" + target);
		}

		this.getConceptList = function(){
			return conceptList.query();
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
				$.post(server + "/api/admin/synchronise_datastores").then(function() {
					console.warn("Synchronising Datastores. The next page load will take a while.");
				})
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

	}

	return Api;
});