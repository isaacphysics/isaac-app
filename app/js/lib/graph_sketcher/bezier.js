define(['require'], function(require) {
    return {
        numOfPts: 100,

        genericBezier: function(pts) {

            var n = pts.length - 1;
            var comb = [];
            var r;
            for (r = 0; r <= n; r += 1) {
                // from the other math library!!!! not the same as Math!!!!
                //comb.push(math.combinations(n, r));
            }

            var step = 1 / numOfPts;
            var bezier = [];
            var u;
            var sx = 0;
            var sy = 0;
            var i;
            var tmp1;
            var tmp2;
            var tmp3;

            for (i = 0; i < numOfPts; i += 1) {
                u = i * step;
                for (r = 0; r <= n; r += 1) {
                    tmp1 = Math.pow(u, r);
                    tmp2 = Math.pow(1 - u, n - r);
                    tmp3 = comb[r] * tmp1 * tmp2;
                    sx += tmp3 * pts[r].x;
                    sy += tmp3 * pts[r].y;
                }
                // createPoint from point.js
                //bezier.push(createPoint(sx, sy));
            }
            bezier.push(pts[pts.length - 1]);

            return bezier;
        }
    };
});
