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

// offer support for front-end and back-end. 
// auxiliary functions used in both sides.

function getDist(pt1, pt2) {
	return Math.sqrt(Math.pow(pt1.x - pt2.x, 2) + Math.pow(pt1.y - pt2.y, 2));
}

function findInterceptX(pts) {
	if (pts.length == 0) return [];

	var intercepts = [];

	if (pts[0].y == canvasHeight/2) intercepts.push(pts[0]);
	for (var i = 1; i < pts.length; i++) {
		if (pts[i].y == canvasHeight/2) {
			intercepts.push(createPoint(pts[i].x, pts[i].y));
			continue;
		}

		if ((pts[i-1].y - canvasHeight/2) * (pts[i].y - canvasHeight/2) < 0) {
			var dx = pts[i].x - pts[i-1].x;
			var dy = pts[i].y - pts[i-1].y;
			var grad = dy/dx;
			var esti = pts[i-1].x + (1 / grad) * (canvasHeight/2 - pts[i-1].y);
			intercepts.push(createPoint(esti, canvasHeight/2));
		}
	}

	return intercepts;
}

function findInterceptY(pts) {
	if (pts.length == 0) return [];

	var intercepts = [];

	if (pts[0].x == canvasWidth/2) intercepts.push(pts[0]);
	for (var i = 1; i < pts.length; i++) {
		if (pts[i].x == canvasWidth/2) {
			intercepts.push(createPoint(pts[i].x, pts[i].y));
			continue;
		}

		if ((pts[i-1].x - canvasWidth/2) * (pts[i].x - canvasWidth/2) < 0) {
			var dx = pts[i].x - pts[i-1].x;
			var dy = pts[i].y - pts[i-1].y;
			var grad = dy/dx;
			var esti = pts[i-1].y + grad * (canvasWidth/2 - pts[i-1].x);
			intercepts.push(createPoint(canvasWidth/2, esti));
		}
	}

	return intercepts;
}

function findMaxima(pts) {
	if (pts.length == 0) return [];

	var maxima = [];

	var grad = [];
	for (var i = 0; i < pts.length - 1; i++) {
		var dx = pts[i+1].x - pts[i].x;
		var dy = pts[i+1].y - pts[i].y;
		grad.push(dy/dx);
	}

	for (var i = 1; i < grad.length; i++) {
		if (grad[i-1] != NaN && grad[i] != NaN) {
			if (grad[i] * grad[i-1] < 0 && (pts[i].x - pts[i-1].x) * (pts[i+1].x - pts[i].x) > 0) {

				var l = i-1;
				while (l >= 0 && getDist(pts[l], pts[i]) < 15) l--;
				if (l < 0) continue;
				var dy = pts[i].y - pts[l].y;
				var dx = pts[i].x - pts[l].x;
				var grad1 = dy/dx;

				var r = i+1;
				while (r < pts.length && getDist(pts[r], pts[i]) < 15) r++;
				if (r >= pts.length) continue;
				var dy = pts[r].y - pts[i].y;
				var dx = pts[r].x - pts[i].x;
				var grad2 = dy/dx;

				if (Math.abs(grad1) > 0.03 && Math.abs(grad2) > 0.03) {
					if ((pts[i].x > pts[i-1].x && grad1 < 0 && grad2 > 0) || (pts[i].x < pts[i-1].x && grad1 > 0 && grad2 < 0)) {
						maxima.push(createPoint(pts[i].x, pts[i].y));
					} 
				}
			}
		}
	}

	return maxima;
}

function findMinima(pts) {
	if (pts.length == 0) return [];

	var minima = [];

	var grad = [];
	for (var i = 0; i < pts.length - 1; i++) {
		var dx = pts[i+1].x - pts[i].x;
		var dy = pts[i+1].y - pts[i].y;
		grad.push(dy/dx);
	}

	for (var i = 1; i < grad.length; i++) {
		if (grad[i-1] != NaN && grad[i] != NaN) {
			if (grad[i] * grad[i-1] < 0 && (pts[i].x - pts[i-1].x) * (pts[i+1].x - pts[i].x) > 0) {

				var l = i-1;
				while (l >= 0 && getDist(pts[l], pts[i]) < 15) l--;
				if (l < 0) continue;
				var dy = pts[i].y - pts[l].y;
				var dx = pts[i].x - pts[l].x;
				var grad1 = dy/dx;

				var r = i+1;
				while (r < pts.length && getDist(pts[r], pts[i]) < 15) r++;
				if (r >= pts.length) continue;
				var dy = pts[r].y - pts[i].y;
				var dx = pts[r].x - pts[i].x;
				var grad2 = dy/dx;

				if (Math.abs(grad1) > 0.03 && Math.abs(grad2) > 0.03) {
					if ((pts[i].x > pts[i-1].x && grad1 > 0 && grad2 < 0) || (pts[i].x < pts[i-1].x && grad1 < 0 && grad2 > 0)) {
						minima.push(createPoint(pts[i].x, pts[i].y));
					} 
				}
			}
		}
	}

	return minima;
}




