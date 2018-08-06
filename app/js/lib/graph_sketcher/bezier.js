define(function(require) {
  var m = require('../math.js');
  var f = require('./func.js');

    return {
        numOfPts: 100,

        lineStyle: function(pts) {

            var n = pts.length - 1;
            var comb = [];
            var r;
            for (r = 0; r <= n; r += 1) {
                // from the other math library!!!! not the same as Math!!!!
                comb.push(m.combinations(n, r));
            }

            var step = 1 / this.numOfPts;
            var bezier = [];
            var u;
            
            var i;
            var tmp1;
            var tmp2;
            var tmp3;

            for (i = 0; i < this.numOfPts; i += 1) {
                u = i * step;
                var sx = 0;
                var sy = 0;
                for (r = 0; r <= n; r += 1) {
                    tmp1 = Math.pow(u, r);
                    tmp2 = Math.pow(1 - u, n - r);
                    tmp3 = comb[r] * tmp1 * tmp2;
                    sx += tmp3 * pts[r].x;
                    sy += tmp3 * pts[r].y;
                }
                // createPoint from point.js
                bezier.push(f.createPoint(sx, sy, i));
            }
            bezier.push(pts[pts.length - 1]);
            return bezier;
        }
    }
});
