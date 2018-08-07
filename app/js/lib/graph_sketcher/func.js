"use strict";
define(function(_require) {
    return {
        createPoint: function(x, y, c) {
            let obj = {};
            obj.ind = c;
            obj.x = x;
            obj.y = y;
            return obj;
        },

        createSymbol: function(text, x, y) {
            let obj = {};
            obj.text = text;
            obj.x = x;
            obj.y = y;
            return obj;
        },

        getDist: function(pt1, pt2) {
            return Math.sqrt(Math.pow(pt1.x - pt2.x, 2) + Math.pow(pt1.y - pt2.y, 2));
        }
    };
});
