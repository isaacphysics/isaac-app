/*
Copyright 2016 Andrea Franceschini <andrea.franceschini@gmail.com>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/


///// <reference path="../../Typings/p5.d.ts" />
///// <reference path="../../Typings/underscore.d.ts" />

/* tslint:disable: no-unused-variable */
/* tslint:disable: comment-format */

import { Widget, Rect } from './Widget.ts'
import { Symbol } from './Symbol.ts'
import { BinaryOperation } from './BinaryOperation.ts';
import { Fraction } from './Fraction.ts';
import { Brackets } from './Brackets.ts';
import { DockingPoint } from './DockingPoint.ts';

// This is where the fun starts


// This is the "main" app with the update/render loop and all that jazz.
export
class MySketch {
	symbols: Array<Widget>;
	movingSymbol: Widget = null;
	initialTouch: p5.Vector = null;
	prevTouch: p5.Vector = null;

	xBox: Rect = null;
	mBox: Rect = null;

	baseFontSize = 120;
	font_it: p5.Font = null;
	font_up: p5.Font = null;

	visibleDockingPointTypes: Array<string> = [];
	activeDockingPoint: DockingPoint = null;

	private newExpressionCallback = null;

	constructor(private p, private scope, private width, private height) {
		this.p.preload = this.preload;
		this.p.setup = this.setup;
		this.p.draw = this.draw;
		this.p.touchStarted = this.touchStarted;
		this.p.touchMoved = this.touchMoved;
		this.p.touchEnded = this.touchEnded;
	}

	preload = () => {
		this.font_it = this.p.loadFont("/assets/STIXGeneral-Italic.otf");
		this.font_up = this.p.loadFont("/assets/STIXGeneral-Regular.otf");
	};

	setup = () => {
		this.xBox = this.font_it.textBounds("x", 0, 1000, this.baseFontSize);
		this.mBox = this.font_it.textBounds("M", 0, 1000, this.baseFontSize);

		this.symbols = [];
		this.p.createCanvas(this.width, this.height);

		this.prevTouch = this.p.createVector(0,0);

		// // FIXME This is for testing purposes only.
		// var subtreeObjects = JSON.parse('[{"type":"Symbol","position":{"x":185,"y":308},"expression":{"latex":"M−\\\\frac{x+j}{i} ","python":"M−((x+j)/(i))"},"children":{"right":{"type":"BinaryOperation","children":{"right":{"type":"Fraction","children":{"numerator":{"type":"Symbol","children":{"right":{"type":"BinaryOperation","children":{"right":{"type":"Symbol","properties":{"letter":"j"}}},"properties":{"operation":"+"}}},"properties":{"letter":"x"}},"denominator":{"type":"Symbol","properties":{"letter":"i"}}}}},"properties":{"operation":"−"}}},"properties":{"letter":"M"}}]');
		// _.each(subtreeObjects, subtreeObject => {
		// 	this.parseSubtreeObject(subtreeObject);
		// });
		this.parseSubtreeObject({
			type: 'Brackets',
			position: { x:300, y:308 },
			properties: { type: 'round' },
			children: {
				argument: {
					type: 'Symbol',
					position: { x:0, y:0 },
					properties: { letter: 'G' },
					children: {
						right: {
							type: 'Symbol',
							position: { x:0, y:0 },
							properties: { letter: 'q' }
						},
						superscript: {
							type: 'Symbol',
							position: { x:0, y:0 },
							properties: { letter: 'F' }
						}
					}
				},
				superscript: {
					type: 'Symbol',
					position: { x:0, y:0 },
					properties: { letter: 'j' }
				},
				right: {
					type: 'Symbol',
					position: { x:0, y:0 },
					properties: { letter: 'p' }
				}
			},
		});
		this.parseSubtreeObject({
			type: 'Brackets',
			position: { x:300, y:450 },
			properties: { type: 'round' }
		});
	};

	draw = () => {
	    this.p.clear();
		_.each(this.symbols, symbol => {
			symbol.draw();
		});
	};

	// TODO: Improve with different widget types
	spawn = (x, y, letter) => {
		if(letter == '\\frac{a}{b}') {
			var s = new Fraction(this.p, this);
			s.position.x = x;
			s.position.y = y;
			this.symbols.push(s);
		} else if(letter == '(x)') {
			var s = new Brackets(this.p, this, 'round');
			s.position.x = x;
			s.position.y = y;
			this.symbols.push(s);
		} else {
			var s = new Symbol(this.p, this, letter);
			s.position.x = x;
			s.position.y = y;
			this.symbols.push(s);
		}
	};

	parseSubtreeObject = (root: Object) => {
		if(root) {
			var w:Widget = this._parseSubtreeObject(root);
			w.position.x = root["position"]["x"];
			w.position.y = root["position"]["y"];
			this.symbols.push(w);
		}
	};

	_parseSubtreeObject = (node: Object): Widget => {
		var w: Widget = null;
		switch(node["type"]) {
			case "Symbol":
				w = new Symbol(this.p, this, node["properties"]["letter"]);
				break;
			case "BinaryOperation":
				w = new BinaryOperation(this.p, this, node["properties"]["operation"]);
				break;
			case "Fraction":
				w = new Fraction(this.p, this);
				break;
			case "Brackets":
				w = new Brackets(this.p, this, node["properties"]["type"]);
				break;
			default: // this would be a Widget...
				break;
		}
		if(node["children"]) {
			_.each(node["children"], (node, key) => {
				w.dockingPoints[key].child = this._parseSubtreeObject(node);
			});
		}
		return w;
	}

	// Executive (and possibly temporary) decision: we are moving one symbol at a time (meaning: no multi-touch)
	// Native ptouchX and ptouchY are not accurate because they are based on the "previous frame".
	touchStarted = () => {
		// These are used to correctly detect clicks and taps.
		this.initialTouch = this.p.createVector(this.p.touchX, this.p.touchY);

		this.movingSymbol = null;
		var index = -1;
		var movingSymbolDocksTo: Array<string> = [];
		_.some(this.symbols, (symbol, i) => {
			// .hit() propagates down the hierarchy
			var hitSymbol = symbol.hit(this.p.createVector(this.p.touchX, this.p.touchY));
			if(hitSymbol != null) {
				// If we hit that symbol, then mark it as moving
				this.movingSymbol = hitSymbol;
				index = i;
				this.prevTouch = this.p.createVector(this.p.touchX, this.p.touchY);

				// Remove symbol from the hierarchy, place it back with the roots.
				if(hitSymbol.parentWidget != null) {
					this.symbols.push(hitSymbol);
					hitSymbol.scale = 1.0;
                    hitSymbol.position = hitSymbol.getAbsolutePosition();
					hitSymbol.removeFromParent();
				}

				// Get the points it docks to, we'll use them later
				movingSymbolDocksTo = this.movingSymbol.docksTo;

				// Array.some requires this to break out of the loop.
				return true;
			}
		});

		// Put the moving symbol on top (bottom?) of the list (this only works with roots,
		// and may not be necessary at all, but eye candy, right?)
		if(index > -1) {
			var e = this.symbols.splice(index, 1)[0];
			this.symbols.push(e);
			index = -1;
		}

		// Tell the other symbols to show only these points. Achievement unlocked: Usability!
        this.visibleDockingPointTypes = movingSymbolDocksTo;

		// FIXME if you can. This is quite the hack.
		this.touchMoved();
	};

	touchMoved = () => {
		if(this.movingSymbol != null) {
			var d = this.p.createVector(this.p.touchX - this.prevTouch.x, this.p.touchY - this.prevTouch.y);
			this.movingSymbol.position.add(d);
			this.prevTouch.x = this.p.touchX;
			this.prevTouch.y = this.p.touchY;

			// Check if we are moving close to a docking point, and highlight it even more.
			_.some(this.symbols, (symbol: Widget) => {
				this.activeDockingPoint = null;

				// This is the point where the mouse/touch is.
				var touchPoint = this.p.createVector(this.p.touchX, this.p.touchY);
				// This is less refined than doing the proximity detection thing, but works much better (#4)
				if(symbol != null && symbol.id != this.movingSymbol.id) {
					if (this.activeDockingPoint = symbol.dockingPointsHit(this.movingSymbol)) {
						// We have hit a docking point, short-circuit the rest of this loop, because we
						// don't care if we hit another one.
						return true;
					}
				}
			});
		}
	};

	touchEnded = () => {
		// TODO Maybe integrate something like the number of events or the timestamp? Timestamp would be neat.
		if(p5.Vector.dist(this.initialTouch, this.p.createVector(this.p.touchX, this.p.touchY)) < 2) {
			// Click
			// Close the menu when touching the canvas
			this.scope.$broadcast("closeMenus");
			this.scope.selectedSymbols.length = 0;
			this.scope.selectionHandleFlags.symbolModMenuOpen = false;

			this.scope.dragMode = "selectionBox";
			$(".selection-box").css({
				left: -10,
				top: -10,
				width: 0,
				height: 0
			});
		} else {
			if (this.movingSymbol != null) {
				// When touches end, mark the symbol as not moving.
				this.prevTouch = null;

				// Make sure we have an active docking point, and that the moving symbol can dock to it.
				if (this.activeDockingPoint != null && this.movingSymbol.docksTo.indexOf(this.activeDockingPoint.type) > -1) {
					this.symbols = _.without(this.symbols, this.movingSymbol);
					this.activeDockingPoint.child = this.movingSymbol;
				}
			}
			_.each(this.symbols, symbol => {
				console.log(symbol.id + " -> " + symbol.getExpression("latex"));
				this.scope.newExpressionCallback(symbol.getExpression("latex").replace(/−/g, "-"));

				// Pass the LaTeX expression for rendering in the input box
				this.scope.state.inequalityResult = symbol.getExpression("latex").replace(/−/g, "-");
				// Store the subtree object for restoring when opening the editor
				this.scope.state.symbols = symbol.subtreeObject();
			});

			this.movingSymbol = null;
			this.activeDockingPoint = null;
			this.visibleDockingPointTypes = [];
		}

		this.initialTouch = null;
	};

	getExpressionObjects = () => {
		var subtreeObjects = [];
		_.each(this.symbols, symbol => {
			subtreeObjects.push(symbol.subtreeObject());
		});
		return subtreeObjects;
	}
}

