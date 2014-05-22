define([], function() {
	
	var Api = function ApiConstructor($resource, server) {

		this.pages = $resource(server + "/isaac/api/pages/:id");
	}

	return Api;
});