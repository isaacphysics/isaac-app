define([], function() {


	
	var Api = function ApiConstructor($resource, server) {

		this.pages = $resource(server + "/isaac/api/pages/:id");
		this.content = $resource(server + "/isaac/api/pages/:id"); // TODO: Use the actual content endpoint once it is written.

	}

	return Api;
});