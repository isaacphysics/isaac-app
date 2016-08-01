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

// provide interactive elements beyond the canvas, including buttons and selects.

function drawButton() {
	var upper = 20;
	var bottom = 680;

	var buttonTest = createButton("test");
	buttonTest.position(450, upper);
	buttonTest.mousePressed(function() {
		var params = 'data=' + JSON.stringify(encodeData()),
		url = "http://localhost:5000/test",
		xhr = new XMLHttpRequest();

		xhr.open("POST", url, true);
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200) {
				var data = JSON.parse(xhr.responseText);
				console.log(data);
				alert(data['isCorrect'] + ": " + data['errCause']);
			}
		}
		xhr.send(params);
	});

	var buttonTestcase = createButton("show test case");
	buttonTestcase.position(50, bottom);
	buttonTestcase.mousePressed(function () {
		var url = '/json/test.json';
		var xhr = new XMLHttpRequest();
		xhr.open("GET", url, true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200) {
				var data = JSON.parse(xhr.responseText);
				decodeData(data);

				var freeSymbols = data.freeSymbols;
				var curves = data.curves;

				drawCurves(curves);
				drawSymbols(freeSymbols, 0);
			}
		}
		xhr.send();
	});

	var buttonDrawnCase = createButton("show drawn case");
	buttonDrawnCase.position(150, bottom);
	buttonDrawnCase.mousePressed(function () {
		var url = '/json/drawn.json';
		var xhr = new XMLHttpRequest();
		xhr.open("GET", url, true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200) {
				var data = JSON.parse(xhr.responseText);
				decodeData(data);

				var freeSymbols = data.freeSymbols;
				var curves = data.curves;

				drawCurves(curves);
				drawSymbols(freeSymbols, 0);
			}
		}
		xhr.send();
	});


	var buttonShape = createButton("custom");
	buttonShape.position(50, upper);
	buttonShape.mousePressed( function() {
		//
	});


	// redo and undo is essentially the reverse of each other.

	var buttonUndo = createButton("undo");
	buttonUndo.position(500, upper);
	buttonUndo.mousePressed(function() {
		if (checkPointsUndo.length == 0) return;

		var checkPointRedo = {};
		checkPointRedo.freeSymbolsJSON = JSON.stringify(freeSymbols);
		checkPointRedo.curvesJSON = JSON.stringify(curves);
		checkPointsRedo.push(checkPointRedo);

		var checkPointUndo = checkPointsUndo.pop();
		freeSymbols = JSON.parse(checkPointUndo.freeSymbolsJSON);
		curves = JSON.parse(checkPointUndo.curvesJSON);
		clickedKnot = null;
		
		drawBackground();
		drawCurves(curves);
		drawSymbols(freeSymbols);
	});

	var buttonRedo = createButton("redo");
	buttonRedo.position(550, upper);
	buttonRedo.mousePressed(function() {
		if (checkPointsRedo.length == 0) return;

		var checkPointUndo = {};
		checkPointUndo.freeSymbolsJSON = JSON.stringify(freeSymbols);
		checkPointUndo.curvesJSON = JSON.stringify(curves);
		checkPointsUndo.push(checkPointUndo);

		var checkPointRedo = checkPointsRedo.pop();
		freeSymbols = JSON.parse(checkPointRedo.freeSymbolsJSON);
		curves = JSON.parse(checkPointRedo.curvesJSON);
		clickedKnot = null;
		
		drawBackground();
		drawCurves(curves);
		drawSymbols(freeSymbols);
	});

	var buttonClear = createButton('clear');
	buttonClear.position(600, upper);
	buttonClear.mousePressed(function() {
		curves = [];
		clickedKnot = null;

		checkPointsUndo = [];
		checkPointsRedo = [];

		drawBackground();
		restore();
		refreshFreeSymbols();
		drawSymbols(freeSymbols);
	});

	var buttonPrintTest = createButton("print test case");
	buttonPrintTest.position(450, bottom);
	buttonPrintTest.mousePressed(function() {
		var data = encodeData();
		var params = "data=" + JSON.stringify(data);

		var url = '/print_test';
		var xhr = new XMLHttpRequest();
		xhr.open("GET", url + "?" + params, true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200) {
				alert(xhr.responseText);
			}
		}
		xhr.send();
	});

	var buttonPrintDrawn = createButton("print drawn case");
	buttonPrintDrawn.position(550, bottom);
	buttonPrintDrawn.mousePressed(function() {
		var data = encodeData();
		var params = "data=" + JSON.stringify(data);

		var url = '/print_drawn';
		var xhr = new XMLHttpRequest();
		xhr.open("GET", url + "?" + params, true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200) {
				alert(xhr.responseText);
			}
		}
		xhr.send();
	});
}



