import { Widget } from './Widget.ts';

/** A class to encapsulate all the info on docking points */
export class DockingPoint {

    private _child: Widget = null;

    public constructor(public widget: Widget, public position: p5.Vector, public scale: number, public type: string, public name: string) {

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
}