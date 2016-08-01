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


function clone(obj) {
	var json = JSON.stringify(obj);
	return JSON.parse(json);
}

function encodeData() {

	if (canvasWidth > 5000 || canvasWidth <= 0) {
		alert("Invalid canvasWidth.");
		return;
	}

	if (canvasHeight > 5000 || canvasHeight <= 0) {
		alert("Invalid canvasHeight.");
		return;
	}

	var data = {};
	data.descriptor = "";
	data.canvasWidth = canvasWidth;
	data.canvasHeight = canvasHeight;

	
	var clonedCurves = clone(curves);
	
	// sort segments according to their left most points.
	function compare(curve1, curve2) {
		function findMinX(pts) {
			if (pts.length == 0) return 0;
			var min = canvasWidth;
			for (var i = 0; i < pts.length; i++) 
				min = Math.min(min, pts[i].x);
			return min;
		}

		var min1 = findMinX(curve1.pts);
		var min2 = findMinX(curve2.pts);
		if (min1 < min2) return -1
		else if (min1 == min2) return 0
		else return 1;
	}
	clonedCurves.sort(compare);


	for (var i = 0; i < clonedCurves.length; i++) {
		var pts = clonedCurves[i].pts;
		for (var j = 0; j < pts.length; j++) {
			pts[j].x = (pts[j].x - canvasWidth/2) / canvasWidth;
			pts[j].y = (canvasHeight/2 - pts[j].y) / canvasHeight;
		}

		var interX = clonedCurves[i].interX;
		for (var j = 0; j < interX.length; j++) {
			var knot = interX[j];
			knot.x = (knot.x - canvasWidth/2) / canvasWidth;
			knot.y = (canvasHeight/2 - knot.y) / canvasHeight;
			if (knot.symbol != undefined) {
				var symbol = knot.symbol;
				symbol.x = (symbol.x - canvasWidth/2) / canvasWidth;
				symbol.y = (canvasHeight/2 - symbol.y) / canvasHeight;
			}
		}

		var interY = clonedCurves[i].interY;
		for (var j = 0; j < interY.length; j++) {
			var knot = interY[j];
			knot.x = (knot.x - canvasWidth/2) / canvasWidth;
			knot.y = (canvasHeight/2 - knot.y) / canvasHeight;
			if (knot.symbol != undefined) {
				var symbol = knot.symbol;
				symbol.x = (symbol.x - canvasWidth/2) / canvasWidth;
				symbol.y = (canvasHeight/2 - symbol.y) / canvasHeight;
			}
		}

		var maxima = clonedCurves[i].maxima;
		for (var j = 0; j < maxima.length; j++) {
			var knot = maxima[j];
			knot.x = (knot.x - canvasWidth/2) / canvasWidth;
			knot.y = (canvasHeight/2 - knot.y) / canvasHeight;
			if (knot.symbol != undefined) {
				var symbol = knot.symbol;
				symbol.x = (symbol.x - canvasWidth/2) / canvasWidth;
				symbol.y = (canvasHeight/2 - symbol.y) / canvasHeight;
			}
		}

		var minima = clonedCurves[i].minima;
		for (var j = 0; j < minima.length; j++) {
			var knot = minima[j];
			knot.x = (knot.x - canvasWidth/2) / canvasWidth;
			knot.y = (canvasHeight/2 - knot.y) / canvasHeight;
			if (knot.symbol != undefined) {
				var symbol = knot.symbol;
				symbol.x = (symbol.x - canvasWidth/2) / canvasWidth;
				symbol.y = (canvasHeight/2 - symbol.y) / canvasHeight;
			}
		}
	}

	data.curves = clonedCurves;

	var clonedFreeSymbols = clone(freeSymbols);
	for (var i = 0; i < clonedFreeSymbols.length; i++) {
		var symbol = clonedFreeSymbols[i];
		symbol.x = (symbol.x - canvasWidth/2) / canvasWidth;
		symbol.y = (canvasHeight/2 - symbol.y) / canvasHeight;
	}
	data.freeSymbols = clonedFreeSymbols;

	return data;
}

function decodeData(data) {

	var curves = data.curves;
	for (var i = 0; i < curves.length; i++) {
		var pts = curves[i].pts;
		for (var j = 0; j < pts.length; j++) {
			pts[j].x = pts[j].x * canvasWidth + canvasWidth/2;
			pts[j].y = canvasHeight/2 - pts[j].y * canvasHeight;
		}


		// 4 duplicated codes

		var interX = curves[i].interX;
		for (var j = 0; j < interX.length; j++) {
			var knot = interX[j];
			knot.x = knot.x * canvasWidth + canvasWidth/2;
			knot.y = canvasHeight/2 - knot.y * canvasHeight;
			if (knot.symbol != undefined) {
				var symbol = knot.symbol;
				symbol.x = symbol.x * canvasWidth + canvasWidth/2;
				symbol.y = canvasHeight/2 - symbol.y * canvasHeight;
			}
		}

		var interY = curves[i].interY;
		for (var j = 0; j < interY.length; j++) {
			var knot = interY[j];
			knot.x = knot.x * canvasWidth + canvasWidth/2;
			knot.y = canvasHeight/2 - knot.y * canvasHeight;
			if (knot.symbol != undefined) {
				var symbol = knot.symbol;
				symbol.x = symbol.x * canvasWidth + canvasWidth/2;
				symbol.y = canvasHeight/2 - symbol.y * canvasHeight;
			}
		}


		var maxima = curves[i].maxima;
		for (var j = 0; j < maxima.length; j++) {
			var knot = maxima[j];
			knot.x = knot.x * canvasWidth + canvasWidth/2;
			knot.y = canvasHeight/2 - knot.y * canvasHeight;
			if (knot.symbol != undefined) {
				var symbol = knot.symbol;
				symbol.x = symbol.x * canvasWidth + canvasWidth/2;
				symbol.y = canvasHeight/2 - symbol.y * canvasHeight;
			}
		}


		var minima = curves[i].minima;
		for (var j = 0; j < minima.length; j++) {
			var knot = minima[j];
			knot.x = knot.x * canvasWidth + canvasWidth/2;
			knot.y = canvasHeight/2 - knot.y * canvasHeight;
			if (knot.symbol != undefined) {
				var symbol = knot.symbol;
				symbol.x = symbol.x * canvasWidth + canvasWidth/2;
				symbol.y = canvasHeight/2 - symbol.y * canvasHeight;
			}
		}
	}

	var freeSymbols = data.freeSymbols;
	for (var j = 0; j < freeSymbols.length; j++) {
		freeSymbols[j].x = freeSymbols[j].x * canvasWidth + canvasWidth/2;
		freeSymbols[j].y = canvasHeight/2 - freeSymbols[j].y * canvasHeight;
	}


}