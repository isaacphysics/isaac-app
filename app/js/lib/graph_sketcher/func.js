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

function createPoint(x, y) {
	var obj = {};
	obj.x = x;
	obj.y = y;
	return obj;
}

function createSymbol(text, x, y) {
	var obj = {};
	obj.text = text;
	obj.x = x;
	obj.y = y;
	return obj;
}


function getDist(pt1, pt2) {
	return Math.sqrt(Math.pow(pt1.x - pt2.x, 2) + Math.pow(pt1.y - pt2.y, 2));
}






