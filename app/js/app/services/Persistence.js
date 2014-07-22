define([], function() {

	// TODO: Implement a more robust persistence API.
	// Perhaps use something like https://github.com/grevory/angular-local-storage
	
	return ['$window', function PersistenceConstructor($window) {

		this.save = function save(key, value) {
			$window.localStorage[key] = value;
		}

		this.load = function load(key) {
			return $window.localStorage[key];
		}

		this.session = {
			save: function sessionSave(key, value) {
				$window.sessionStorage[key] = value;
			},

			load: function sessionLoad(key, value) {
				return $window.sessionStorage[key];
			},
		};

	}];

});