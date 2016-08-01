/**
 * Copyright 2016 Junwei Yuan
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Given a set of data points, sample a subset of points such that there is about constant space interval between two adjacent points.
var sampleSpaceInterval = 10;

function sample(pts) {
	var sampled = []; 
	sampled.push(pts[0]);
	var i = 0;
	var j = 0;
	while (i < pts.length) {
		while (j < pts.length && getDist(pts[i], pts[j]) < sampleSpaceInterval) j++;
		if (j < pts.length) sampled.push(pts[j]);
		i = j;
	}
	sampled.push(pts[pts.length - 1]);
	return sampled;
}