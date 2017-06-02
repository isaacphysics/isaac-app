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
///// <reference path="../../typings/lodash.d.ts" />

/* tslint:disable: no-unused-variable */
/* tslint:disable: comment-format */

import { Widget, Rect } from './Widget.ts'
import { Symbol } from './Symbol.ts'
import { BinaryOperation } from './BinaryOperation.ts';
import { Fraction } from './Fraction.ts';
import { Brackets } from './Brackets.ts';
import { Radix } from './Radix.ts';
import { Num } from './Num.ts';
import { Fn } from './Fn.ts';
import { DockingPoint } from './DockingPoint.ts';
import { Relation } from './Relation.ts';
import { ChemicalElement } from './ChemicalElement.ts';
import { StateSymbol } from './StateSymbol.ts';
import { Particle } from './Particle.ts';

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

    baseFontSize = 50;
    font_it: p5.Font = null;
    font_up: p5.Font = null;

    visibleDockingPointTypes: Array<string> = [];
    activeDockingPoint: DockingPoint = null;

    private newExpressionCallback = null;

    constructor(private p, public scope, private width, private height, private initialSymbolsToParse) {
        this.p.preload = this.preload;
        this.p.setup = this.setup;
        this.p.draw = this.draw;
        this.p.mousePressed = this.touchStarted;
        this.p.mouseMoved = this.touchMoved;
        this.p.mouseReleased = this.touchEnded;
        this.p.windowResized = this.windowResized;
    }

    preload = () => {
        this.font_it = this.p.loadFont("/assets/STIXGeneral-Italic.ttf");
        this.font_up = this.p.loadFont("/assets/STIXGeneral-Regular.ttf");
    };

    loadTestCase = (s) => {
        this.symbols = [];
        this.initialSymbolsToParse = s;
        try {
            _.each(this.initialSymbolsToParse || [], s => {
                this.parseSubtreeObject(s);
            });
        } catch (e) {
            console.warn("Failed to load test case.", e);
        }

        this.centre(true);

        _this.scope.log.initialState = [];


        this.symbols.forEach(function(e) {
            _this.scope.log.initialState.push(e.subtreeObject(true, true));
        });
    }
    setup = () => {
        this.xBox = this.font_it.textBounds("x", 0, 1000, this.baseFontSize);
        this.mBox = this.font_it.textBounds("M", 0, 1000, this.baseFontSize);

        this.symbols = [];

        this.p.createCanvas(this.width, this.height);

        this.prevTouch = this.p.createVector(0, 0);

        try {
            _.each(this.initialSymbolsToParse || [], s => {
                this.parseSubtreeObject(s);
            });
        } catch (e) {
            console.warn("Failed to load previous answer. Perhaps it was built with the old equation editor?", e);
        }

        this.centre(true);

        _this.scope.log.initialState = [];


        this.symbols.forEach(function(e) {
            _this.scope.log.initialState.push(e.subtreeObject(true, true));
        });

    };

    windowResized = () => {
        console.log(this.p.windowWidth, this.p.windowHeight);
        this.p.resizeCanvas(this.p.windowWidth, this.p.windowHeight);
    }

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
                this.scope.log.actions.push({
                    event: "DRAG_POTENTIAL_SYMBOL",
                    symbol: this.potentialSymbol.subtreeObject(false, true, true),
                    timestamp: Date.now()
                });
                this.visibleDockingPointTypes = this.potentialSymbol.docksTo;
            }
            this.potentialSymbol.position.x = x - this.potentialSymbol.boundingBox().w * 0.5;
            this.potentialSymbol.position.y = y;
            this.potentialSymbol.shakeIt();

            // Decide whether we should dock immediately

            _.some(this.symbols, (symbol: Widget) => {
                this.activeDockingPoint = null;

                symbol.highlight(false);
                if (symbol != null) {
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
            this.scope.log.actions.push({
                event: "DOCK_POTENTIAL_SYMBOL",
                symbol: this.potentialSymbol.subtreeObject(false, true, true),
                parent: this.potentialSymbol.parentWidget.subtreeObject(false, true, true),
                dockingPoint: this.activeDockingPoint.name,
                timestamp: Date.now()
            });
        } else if (this.potentialSymbol != null) {
            this.symbols.push(this.potentialSymbol);
            this.scope.log.actions.push({
                event: "DROP_POTENTIAL_SYMBOL",
                symbol: this.potentialSymbol.subtreeObject(false, true, true),
                timestamp: Date.now()
            });
        }

        this.updatePotentialSymbol(null);
        this.updateState();
    };

    parseSubtreeObject = (root: Object) => {

        if (root) {
            var w: Widget = this._parseSubtreeObject(root);
            w.position.x = root["position"]["x"];
            w.position.y = root["position"]["y"];
            this.symbols.push(w);
            w.shakeIt();
        }
        this.updateState();
    };

    _parseSubtreeObject = (node: Object, parseChildren = true): Widget => {
        var w: Widget = null;
        switch (node["type"]) {
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
                w = new Brackets(this.p, this, node["properties"]["type"], node["properties"]["mode"]);
                break;
            case "Radix":
                w = new Radix(this.p, this);
                break;
            case "Num":
                w = new Num(this.p, this, node["properties"]["significand"], node["properties"]["exponent"]);
                break;
            case "Fn":
                w = new Fn(this.p, this, node["properties"]["name"], node["properties"]["custom"], node["properties"]["allowSubscript"], node["properties"]["innerSuperscript"]);
                break;
            case "Relation":
                w = new Relation(this.p, this, node["properties"]["relation"]);
                break;
            case "StateSymbol":
                w = new StateSymbol(this.p, this, node["properties"]["state"]);
                break;
            case "ChemicalElement":
                w = new ChemicalElement(this.p, this, node["properties"]["element"]);
                break;
            case "Particle":
                w = new Particle(this.p, this, node["properties"]["particle"], node["properties"]["type"]);
                break;
            default: // this would be a Widget...
                break;

        }
        if (parseChildren) {
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

        // ~~~ Note that touchX and touchY are incorrect when using touch. Ironically.
        // Note that, in 0.5.5, they removed touchX/Y, then they "fixed" them in 0.5.6, and now I don't even know
        // what I'm doing anymore...
        var tx = this.p.touches.length > 0 ? (<p5.Vector>this.p.touches[0]).x : this.p.mouseX;
        var ty = this.p.touches.length > 0 ? (<p5.Vector>this.p.touches[0]).y : this.p.mouseY;

        this.initialTouch = this.p.createVector(tx, ty);

        this.movingSymbol = null;
        var index = -1;
        var movingSymbolDocksTo: Array<string> = [];
        _.some(this.symbols, (symbol, i) => {
            // .hit() propagates down the hierarchy
            var hitSymbol = symbol.hit(this.p.createVector(tx, ty));
            if (hitSymbol != null) {
                // If we hit that symbol, then mark it as moving
                this.movingSymbol = hitSymbol;
                this.scope.log.actions.push({
                    event: "DRAG_START",
                    symbol: this.movingSymbol.subtreeObject(false, true, true),
                    timestamp: Date.now()
                });
                index = i;
                this.prevTouch = this.p.createVector(tx, ty);

                // Remove symbol from the hierarchy, place it back with the roots.
                if (hitSymbol.parentWidget != null) {
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
        if (index > -1) {
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

        this.mouseMoved();
        var tx = this.p.touches.length > 0 ? (<p5.Vector>this.p.touches[0]).x : this.p.mouseX;
        var ty = this.p.touches.length > 0 ? (<p5.Vector>this.p.touches[0]).y : this.p.mouseY;

        if (this.movingSymbol != null) {
            var d = this.p.createVector(tx - this.prevTouch.x, ty - this.prevTouch.y);

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
            // FIXME GO AHEAD PUNK, MAKE MY DAY
            this.prevTouch.x = <number>tx;
            this.prevTouch.y = <number>ty;

            // Check if we are moving close to a docking point, and highlight it even more.
            _.some(this.symbols, (symbol: Widget) => {
                this.activeDockingPoint = null;

                // This is the point where the mouse/touch is.
                var touchPoint = this.p.createVector(tx, ty);
                // This is less refined than doing the proximity detection thing, but works much better (#4)
                if (symbol != null && symbol.id != this.movingSymbol.id) {
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

            this.scope.notifySymbolDrag(tx, ty);
        }
    };

    touchEnded = () => {

        // TODO Maybe integrate something like the number of events or the timestamp? Timestamp would be neat.
        // if (null != this.initialTouch && p5.Vector.dist(this.initialTouch, this.p.createVector(this.p.mouseX, this.p.mouseY)) < 2) {
        //     // Click
        //     // Close the menu when touching the canvas
        //     this.scope.$broadcast("closeMenus");
        //     this.scope.selectedSymbols.length = 0;
        //     this.scope.selectionHandleFlags.symbolModMenuOpen = false;
        //
        //     this.scope.dragMode = "selectionBox";
        //     $(".selection-box").css({
        //         left: -10,
        //         top: -10,
        //         width: 0,
        //         height: 0
        //     });
        // }

        if (this.movingSymbol != null) {
            // When touches end, mark the symbol as not moving.
            this.prevTouch = null;

            // Make sure we have an active docking point, and that the moving symbol can dock to it.
            if (this.activeDockingPoint != null && this.movingSymbol.docksTo.indexOf(this.activeDockingPoint.type) > -1) {
                this.symbols = _.without(this.symbols, this.movingSymbol);
                this.activeDockingPoint.child = this.movingSymbol;
                this.scope.log.actions.push({
                    event: "DOCK_SYMBOL",
                    symbol: this.movingSymbol.subtreeObject(false, true, true),
                    parent: this.movingSymbol.parentWidget.subtreeObject(false, true, true),
                    dockingPoint: this.activeDockingPoint.name,
                    timestamp: Date.now()
                });
            } else if (this.scope.trashActive) {
                this.scope.log.actions.push({
                    event: "TRASH_SYMBOL",
                    symbol: this.movingSymbol.subtreeObject(false, true, true),
                    timestamp: Date.now()
                });
                this.symbols = _.without(this.symbols, this.movingSymbol);
            } else {
                this.scope.log.actions.push({
                    event: "DROP_SYMBOL",
                    symbol: this.movingSymbol.subtreeObject(false, true, true),
                    timestamp: Date.now()
                });
            }
            this.scope.selectedSymbols.length = 0;
            this.scope.$digest();
        }

        this.updateState();

        this.movingSymbol = null;
        this.activeDockingPoint = null;
        this.visibleDockingPointTypes = [];

        this.initialTouch = null;

        var symbolWithMostChildren = null;
        var mostChildren = 0;
        _.each(this.symbols, symbol => {
            var numChildren = symbol.getTotalSymbolCount();
            if (numChildren > mostChildren) {
                mostChildren = numChildren;
                symbolWithMostChildren = symbol;
            }
        });

        _.each(this.symbols, symbol => {
            if (symbol != symbolWithMostChildren) {
                symbol.isMainExpression = false;
            } else {
                symbol.isMainExpression = true;
            }
        });
        this.updateState();
    };

    mouseMoved = () => {
        var p = this.p.createVector(this.p.mouseX, this.p.mouseY);
        _.each(this.symbols, symbol => {
            symbol.highlight(false);
            var hitSymbol = symbol.hit(p);
            if (hitSymbol) {
                hitSymbol.highlight(true);
            }
        });
    };

    flattenExpression = (w: Widget) => {
        var stack: Array<Widget> = [w];
        var list = [];
        while (stack.length > 0) {
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
            //console.log(symbol.id + " -> " + symbol.getExpression("python"));
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
                    "mhchem": symbolWithMostChildren.getExpression("mhchem").trim(),
                    "python": symbolWithMostChildren.getExpression("python").trim(),
                    "mathml": '<math xmlns="http://www.w3.org/1998/Math/MathML">' + symbolWithMostChildren.getExpression("mathml").trim() + '</math>',
                    // removes everything that is not truthy, so this should avoid empty strings.
                    "uniqueSymbols": _.remove(this.flattenExpression(symbolWithMostChildren), e => { return e } ).join(', ')
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

    centre = (init = false) => {
        var top = this.height / 2;
        _.each(this.symbols, (symbol, i) => {
            var sbox = symbol.subtreeBoundingBox();
            symbol.position = this.p.createVector(this.width / 2 - sbox.center.x, top + sbox.center.y);
            top += sbox.h;
            symbol.shakeIt();
        });
        if (!init) {
            this.scope.log.actions.push({
                event: "CENTRE_SYMBOLS",
                timestamp: Date.now()
            });
        }
    };
}
