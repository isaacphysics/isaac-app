"use strict";
define(function(require) {
    var b = require("lib/graph_sketcher/bezier.js");

    return {
        createPoint: function(x, y) {
            var obj = {};
            obj.x = x;
            obj.y = y;
            return obj;
        },

        createSymbol: function(text, x, y) {
            var obj = {};
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
