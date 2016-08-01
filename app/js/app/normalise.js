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


function normalise_position(pts) {
	var maxY = 0, 
		maxX = 0;
	for (var i = 1; i < pts.length; i++) {
		maxY = Math.max(Math.abs(canvasHeight/2 - pts[i].y), maxY);
		maxX = Math.max(Math.abs(pts[i].x - canvasWidth/2), maxX);
	}
	
	var normalisedPts = [];
	for (var i = 0; i < pts.length; i++) {
		var nx = (pts[i].x - canvasWidth/2) / maxX;
		var ny = (pts[i].y - canvasHeight/2) / maxY;
		normalisedPts.push(createPoint(nx, ny));
	}

	return normalisedPts;
}

function normalise_shape(pts) {
	var maxY = pts[0].y, 
		minY = pts[0].y, 
		maxX = pts[0].x, 
		minX = pts[0].x;

	for (var i = 1; i < pts.length; i++) {
		maxY = Math.max(pts[i].y, maxY);
		minY = Math.min(pts[i].y, minY);
		maxX = Math.max(pts[i].x, maxX);
		minX = Math.min(pts[i].x, minX);
	}

	var normalisedPts = [];
	var rangeX = maxX - minX;
	var rangeY = maxY - minY;

	for (var i = 0; i < pts.length; i++) {
		var nx = (pts[i].x - minX) / rangeX;
		var ny = (pts[i].y - minY) / rangeY;
		normalisedPts.push(createPoint(nx, ny));
	}

	return normalisedPts;
}

function normalise_test(testPts, drawnPts, normalise) {
	var normDegree = 3;

	function findError(pts1, pts2) {
		var err = 0;
		for (var i = 0; i < pts1.length; i++) {
			err += Math.pow(getDist(pts1[i], pts2[i]), normDegree);
		}
	 	return Math.pow(err, 1 / normDegree) / pts1.length;
	}

	// if ((testPts[1].x - testPts[0].x) * (drawnPts[1].x - drawnPts[0].x) < 0)
	// 	drawnPts.reverse();

	var err1 = findError(normalise(testPts), normalise(drawnPts));
	testPtss.reverse();
	var err2 = findError(normalise(testPts), normalise(drawnPts));
	var err = Math.min(err1, err2);
	
	console.log(err);
}


function drawNormalisedShape(pts) {
	pts = normalise_shape(pts);
	for (var j = 0; j < pts.length; j++) {
		pts[j].x = pts[j].x * 200 + 200;
		pts[j].y = pts[j].y * 200 + 200; 
	}
	drawCurve(pts, [255, 255, 0]);
}

function drawNormalisedPosition(pts) {
	pts = normalise_position(pts);
	for (var j = 0; j < pts.length; j++) {
		pts[j].x = pts[j].x * 100 + 300;
		pts[j].y = pts[j].y * 100 + 300; 
	}
	drawCurve(pts, [255, 51, 51]);
}

















