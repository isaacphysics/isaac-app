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


// Given a set of data points, generate bezier curve.

var numOfPts = 100;

function genericBezier(pts) {

	var n = pts.length - 1;
	var comb = [];
	for (var r = 0; r <= n; r++) {
		comb.push(math.combinations(n, r));
	}

	var step = 1 / numOfPts;
	var bezier = [];

	for (var i = 0; i < numOfPts; i++) {
		var u = i * step;
		var sx = 0, sy = 0;
		for (var r = 0; r <= n; r++) {
			var tmp1 = Math.pow(u, r);
			var tmp2 = Math.pow(1-u, n-r);
			var tmp3 = comb[r] * tmp1 * tmp2;
			sx += tmp3 * pts[r].x;
			sy += tmp3 * pts[r].y;
		}
		bezier.push(createPoint(sx, sy));
	}
	bezier.push(pts[pts.length - 1]);

	return bezier;
}