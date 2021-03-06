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

	// TODO: Implement a more robust persistence API.
	// Perhaps use something like https://github.com/grevory/angular-local-storage
	
	return ['$window', function PersistenceConstructor($window) {

		this.save = function save(key, value) {
			try {
				$window.localStorage.setItem(key, value);
				return true;
			} catch (e) {
				console.error("Failed to save to local storage. This might be a browser restriction.", e);
				return false;
			}
		}

		this.load = function load(key) {
			try {
				return $window.localStorage.getItem(key);
			} catch (e) {
				console.error("Failed to read from local storage. This might be a browser restriction.", e);
				return null;
			}
		}

		this.remove = function remove(key) {
			try {
				return $window.localStorage.removeItem(key);
				return true;
			} catch (e) {
				console.error("Failed to remove from local storage. This might be a browser restriction.", e);
				return false;
			}
		}

		this.clear = function clear() {
			try {
				return $window.localStorage.clear();
				return true;
			} catch (e) {
				console.error("Failed to clear local storage. This might be a browser restriction.", e);
				return false;
			}
		}

		this.session = {
			save: function sessionSave(key, value) {
				try {
					$window.sessionStorage.setItem(key, value);
					return true;
				} catch (e) {
					console.error("Failed to save to session storage. This might be a browser restriction.", e);
					return false;
				}
			},

			load: function sessionLoad(key, _value) {
				try {
					return $window.sessionStorage.getItem(key);
				} catch (e) {
					console.error("Failed to read from session storage. This might be a browser restriction.", e);
					return null;
				}
			},

			remove: function sessionRemove(key) {
				try {
					return $window.sessionStorage.removeItem(key);
					return true;
				} catch (e) {
					console.error("Failed to remove from session storage. This might be a browser restriction.", e);
					return false;
				}
			},

			clear: function clear() {
				try {
					return $window.sessionStorage.clear();
					return true;
				} catch (e) {
					console.error("Failed to clear session storage. This might be a browser restriction.", e);
					return false;
				}
			},
		};

	}];

});