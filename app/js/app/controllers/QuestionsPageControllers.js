/**
 * Copyright 2015 James Sharkey & Ian Davies
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

	var PageController = ['$scope', 'api', function($scope, api) {
		
		$scope.featuredQuestions = [{
			subtitle: "Mechanics",
			title: "A Toboggan",
			href: "/a",
			level: 3
		}, {
			subtitle: "Still Mechanics",
			title: "Another Toboggan",
			href: "/b",
			level: 4
		}]

		$scope.topBoards = [{
			subtitle: "Mechanics",
			title: "Fasttrack Revision Practice",
		}, {
			subtitle: "Core",
			title: "Fasttrack Core Revision",
		}]

		$scope.extraordinaryQuestions = [{
			subtitle: "Extraordinary Questions",
			title: "Estimating force in rugby tackles",
			level: 6
		}, {
			subtitle: "Extraordinary Questions",
			title: "A Falling Chain",
			level: 0
		}]



	}];

	return {
		PageController: PageController
	};
});