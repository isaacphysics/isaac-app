define([], function() {


	
	var Api = function ApiConstructor($resource, server) {

		this.pages = $resource(server + "/api/pages/:id");
		this.content = $resource(server + "/api/pages/:id"); // TODO: Use the actual content endpoint once it is written.
		
		var conceptsPerPage = 10;
		var conceptList = $resource(server + "/api/concepts?start_index=:startIndex&limit=:limit");

		this.getConceptList = function(page){
			//page = parseInt(page) -1;

			return conceptList.query({"startIndex" : page*conceptsPerPage, "limit" : conceptsPerPage});
		}

		this.getImageUrl = function(path) {
			return server + "/api/images/" + path;
		}

		this.admin = {
			synchroniseDatastores: function() {
				$.post(server + "/api/admin/synchronise_datastores").then(function() {
					console.warn("Synchronising Datastores. The next page load will take a while.");
				})
			}
		};
	}

	return Api;
});