define([], function() {


	
	var Api = function ApiConstructor($resource, server) {

		this.pages = $resource(server + "/isaac/api/pages/:id");
		this.content = $resource(server + "/isaac/api/pages/:id"); // TODO: Use the actual content endpoint once it is written.

		this.getImageUrl = function(path) {
			return server + "/isaac/api/images/" + path;
		}

		this.admin = {
			synchroniseDatastores: function() {
				$.post(server + "/isaac/admin/synchronise_datastores").then(function() {
					console.warn("Synchronising Datastores. The next page load will take a while.");
				})
			}
		};
	}

	return Api;
});