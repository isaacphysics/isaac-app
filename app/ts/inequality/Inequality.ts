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


///// <reference path="../../typings/p5.d.ts" />
///// <reference path="../../typings/underscore.d.ts" />

/* tslint:disable: no-unused-variable */
/* tslint:disable: comment-format */

import { Widget, Rect } from './Widget.ts'
import { Symbol } from './Symbol.ts'
import { BinaryOperation } from './BinaryOperation.ts';
import { Fraction } from './Fraction.ts';
import { Brackets } from './Brackets.ts';
import { Radix } from './Radix.ts';
import { Number } from './Number.ts';
import { Function } from './Function.ts';
import { DockingPoint } from './DockingPoint.ts';

// This is where the fun starts


// This is the "main" app with the update/render loop and all that jazz.
export
class MySketch {
	symbols: Array<Widget>;
	movingSymbol: Widget = null;
	potentialSymbol: Widget = null;
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

	constructor(private p, private scope, private width, private height, private initialSymbolsToParse) {
		this.p.preload = this.preload;
		this.p.setup = this.setup;
		this.p.draw = this.draw;
		this.p.touchStarted = this.touchStarted;
		this.p.touchMoved = this.touchMoved;
		this.p.touchEnded = this.touchEnded;
		this.p.mouseMoved = this.mouseMoved;
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

        try {
            _.each(this.initialSymbolsToParse || [], s => {
                this.parseSubtreeObject(s);
            });
        } catch (e) {
            console.warn("Failed to load previous answer. Perhaps it was built with the old equation editor?", e);
        }



		this.centre();
	};

	draw = () => {
	    this.p.clear();
		_.each(this.symbols, symbol => {
			symbol.draw();
		});

        if (this.potentialSymbol) {
            this.potentialSymbol.draw();
        }
	};

	updatePotentialSymbol = (spec, x?, y?) => {
		// NB: This logic requires spec to be briefly set to null when switching between potential symbol types.
        if (spec) {
            if (!this.potentialSymbol) {
                this.potentialSymbol = this._parseSubtreeObject(spec);
                this.visibleDockingPointTypes = this.potentialSymbol.docksTo;
            }
            this.potentialSymbol.position.x = x - this.potentialSymbol.boundingBox().w*0.5;
            this.potentialSymbol.position.y = y;
			this.potentialSymbol.shakeIt();
            
            // Decide whether we should dock immediately

            _.some(this.symbols, (symbol: Widget) => {
                this.activeDockingPoint = null;

                symbol.highlight(false);
                if(symbol != null) {
                    // TODO: This is broken. Make sure we don't hit docking points of the wrong type
                    if (this.activeDockingPoint = symbol.dockingPointsHit(this.potentialSymbol)) {
                        // We have hit a docking point, short-circuit the rest of this loop, because we
                        // don't care if we hit another one.
                        this.activeDockingPoint.widget.highlight(true);
                        return true;
                    }
                }
            });

        } else {
            this.potentialSymbol = null;
            this.visibleDockingPointTypes = [];
        }
	};

    commitPotentialSymbol = () => {
        // Make sure we have an active docking point, and that the moving symbol can dock to it.
        if (this.activeDockingPoint != null && this.potentialSymbol.docksTo.indexOf(this.activeDockingPoint.type) > -1) {
            this.activeDockingPoint.child = this.potentialSymbol;
        } else {
            this.symbols.push(this.potentialSymbol);
        }

        this.updatePotentialSymbol(null);
		this.updateState();
    };

	parseSubtreeObject = (root: Object) => {
		if(root) {
			var w:Widget = this._parseSubtreeObject(root);
			w.position.x = root["position"]["x"];
			w.position.y = root["position"]["y"];
			this.symbols.push(w);
			w.shakeIt();
		}
	};

	_parseSubtreeObject = (node: Object, parseChildren = true): Widget => {
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
			case "Radix":
				w = new Radix(this.p, this);
				break;
            case "Number":
                w = new Number(this.p, this, node["properties"]["significand"], node["properties"]["exponent"]);
                break;
			case "Function":
				w = new Function(this.p, this, node["properties"]["name"], node["properties"]["upright"]);
				break;
			default: // this would be a Widget...
				break;
		}

		if(parseChildren) {
			_.each(node["children"] || [], (n, key) => {
				w.dockingPoints[key].child = this._parseSubtreeObject(n);
			});
		}

		return w;
	};

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

        this.scope.selectedSymbols.length = 0;
        if (this.movingSymbol) {
            this.scope.selectedSymbols.push(this.movingSymbol);
        }
        this.scope.$digest();

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

			// TODO NOT DELETE the following commented section.
			// var sbox = this.movingSymbol.subtreeBoundingBox();
			// var spos = this.movingSymbol.getAbsolutePosition();
			// var dx = this.p.touchX - this.prevTouch.x;
			// var dy = this.p.touchY - this.prevTouch.y;
			// var left =   spos.x + sbox.x;
			// var right =  spos.x + sbox.x + sbox.w;
			// var top =    spos.y + sbox.y;
			// var bottom = spos.y + sbox.y + sbox.h;
            //
			// if((dx < 0 && left <= 0) || (dx > 0 && right >= this.width)) {
			// 	dx = 0;
			// }
			// if((dy < 0 && top <= 0) || (dy > 0 && bottom >= this.height)) {
			// 	dy = 0;
			// }
			// var d = this.p.createVector(dx, dy);
			
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
                    // TODO: This is broken. Make sure we don't hit docking points of the wrong type
					symbol.highlight(false);
					if (this.activeDockingPoint = symbol.dockingPointsHit(this.movingSymbol)) {
						// We have hit a docking point, short-circuit the rest of this loop, because we
						// don't care if we hit another one.
                        this.activeDockingPoint.widget.highlight(true);
						return true;
					}
				}
			});

            this.scope.notifySymbolDrag(this.p.touchX, this.p.touchY);
		}
	};

	touchEnded = () => {
		// TODO Maybe integrate something like the number of events or the timestamp? Timestamp would be neat.
		if(this.initialTouch && p5.Vector.dist(this.initialTouch, this.p.createVector(this.p.touchX, this.p.touchY)) < 2) {
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

                if (this.scope.trashActive) {
                    this.symbols = _.without(this.symbols, this.movingSymbol);
                }
                this.scope.selectedSymbols.length = 0;
                this.scope.$digest();
			}

			this.updateState();

			this.movingSymbol = null;
			this.activeDockingPoint = null;
			this.visibleDockingPointTypes = [];
		}

		this.initialTouch = null;

		var symbolWithMostChildren = null;
		var mostChildren = 0;
		_.each(this.symbols, symbol => {
			console.log(symbol.id + " -> " + symbol.getExpression("python"));
			var numChildren = symbol.getTotalSymbolCount();
			if (numChildren > mostChildren) {
				mostChildren = numChildren;
				symbolWithMostChildren = symbol;
			}
		});

		_.each(this.symbols, symbol => {
			if(symbol != symbolWithMostChildren) {
				symbol.isMainExpression = false;
			} else {
				symbol.isMainExpression = true;
			}
		});

        if (symbolWithMostChildren) {
		  console.log("MATHML: " + symbolWithMostChildren.getExpression("mathml"));
        }
	};

	mouseMoved = () => {
		var p = this.p.createVector(this.p.mouseX, this.p.mouseY);
		_.each(this.symbols, symbol => {
			symbol.highlight(false);
			var hitSymbol = symbol.hit(p);
			if(hitSymbol) {
				hitSymbol.highlight(true);
			}
		});
	};

	flattenExpression = (w : Widget) => {
		var stack : Array<Widget> = [w];
		var list = [];
		while(stack.length > 0) {
			var e = stack.shift();
			list.push(e.token());
			var children = e.getChildren();
			stack = stack.concat(children);
		}
		return _.reject(_.uniq(list), i => { return i == ''; });
	};

	updateState = () => {
		var symbolWithMostChildren = null;
		var mostChildren = 0;
		_.each(this.symbols, symbol => {
			console.log(symbol.id + " -> " + symbol.getExpression("python"));
			var numChildren = symbol.getTotalSymbolCount();
			if (numChildren > mostChildren) {
				mostChildren = numChildren;
				symbolWithMostChildren = symbol;
			}
		});

		if (symbolWithMostChildren != null) {
			this.scope.newEditorState({
				result: {
					"tex": symbolWithMostChildren.getExpression("latex").trim(),
					"python": symbolWithMostChildren.getExpression("python").trim(),
					"mathml": '<math xmlns="http://www.w3.org/1998/Math/MathML">' + symbolWithMostChildren.getExpression("mathml").trim() + '</math>',
					"uniqueSymbols": this.flattenExpression(symbolWithMostChildren).join(', ')
				},
				symbols: _.map(this.symbols, s => s.subtreeObject())
			});
		} else {
			this.scope.newEditorState({
				result: null,
				symbols: [],
			})
		}
	};

	getExpressionObjects = () => {
		var subtreeObjects = [];
		_.each(this.symbols, symbol => {
			subtreeObjects.push(symbol.subtreeObject());
		});
		return subtreeObjects;
	};

	centre = () => {
		var top = this.height/2;
		_.each(this.symbols, (symbol, i) => {
			var sbox = symbol.subtreeBoundingBox();
			symbol.position = this.p.createVector(this.width/2 - sbox.center.x, top + sbox.center.y);
			top += sbox.h;
			symbol.shakeIt();
		});
	};
}

