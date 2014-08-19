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

		this.authenticationEndpoint = server+"/api/auth";
		
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


		this.logout = function() {
			return $http.post(this.authenticationEndpoint + "/logout");
		};

		var questionsPerPage = 10;
		var questionList = $resource(server + "/api/pages/questions?start_index=:startIndex&limit=:limit", {}, {'query': {method: 'GET', isArray: false }});
		var conceptList = $resource(server + "/api/pages/concepts?start_index=:startIndex&limit=:limit", {startIndex: 0, limit: 999}, {'query': {method: 'GET', isArray: false }});
		var gameBoardsList = $resource(server + "/api/users/current_user/gameboards?start_index=:startIndex&sort=:sort:filter", {}, {'query': {method: 'GET', isArray: false }});


		this.getQuestionList = function(page){
			return questionList.query({"startIndex" : page*questionsPerPage, "limit" : questionsPerPage});
		}

		this.userGameBoards = function(filter, sort, index){
			return gameBoardsList.query({"filter" : (filter != null) ? '&show_only='+filter : '', "sort" : sort, "startIndex" : index});
		}
		
		this.deleteGameBoard = function(id){
     		$http.delete(server + "/api/users/current_user/gameboards/"+id);
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

		this.password = $resource(server + "/api/users/resetpassword", {}, {
			reset: {
				method: "POST",
			}
		});

	}

	return Api;
});