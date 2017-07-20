/**
 * Copyright 2016 Ian Davies
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

	var SubjectConstructor = function() {

		if (document.location.host == "localhost:8000" || document.location.host.indexOf("isaacphysics") > -1) {
			var id = "physics";
		} else if (document.location.host == "localhost:8001" || document.location.host.indexOf("isaacchemistry") > -1) {
			var id = "chemistry";
		} else if (document.location.host == "localhost:8002" || document.location.host.indexOf("isaacbiology") > -1) {
			var id = "biology";
		} else {
			var id = "unknown";
		}

		var title = id[0].toUpperCase() + id.substring(1);

		return {
			id: id,
			title: title,
		};

	};

	return SubjectConstructor;
});