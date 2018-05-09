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

///// <reference path="../../typings/p5.d" />
///// <reference path="../../typings/lodash.d" />

/* tslint:disable: no-unused-variable */
/* tslint:disable: comment-format */

import { Widget } from './Widget';

/** A class to encapsulate all the info on docking points */
export class DockingPoint {

    private _child: Widget = null;

    public constructor(public widget: Widget, public position: p5.Vector, public scale: number, public type: Array<string>, public name: string) {

    }

    /** Sets a child Widget to this docking point properly (aka, also shakes it). */
    set child(child) {
        this._child = child;
        if (null != child) {
            this._child.dockedTo = this.name;
            this._child.parentWidget = this.widget;
            this._child.shakeIt();
        }
    }

    /** Gets this docking points' Widget. */
    get child() {
        return this._child;
    }

    get absolutePosition(): p5.Vector {
        return p5.Vector.add(this.widget.absolutePosition, this.position);
    }
}