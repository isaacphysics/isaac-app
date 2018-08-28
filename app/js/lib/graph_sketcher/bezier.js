define(['../math.js', '../../app/directives/graph_sketcher/GraphUtils.js'], function(m, graphUtils) {
    return {
        numOfPts: 100,

        lineStyle: function(pts) {

            let n = pts.length - 1;
            let comb = [];
            let r;
            for (let r = 0; r <= n; r += 1) {
                // from the other math library!!!! not the same as Math!!!!
                comb.push(m.combinations(n, r));
            }

            let step = 1 / this.numOfPts;
            let bezier = [];
            let u;
            
            let i;
            let tmp1;
            let tmp2;
            let tmp3;

            for (let i = 0; i < this.numOfPts; i += 1) {
                u = i * step;
                let sx = 0;
                let sy = 0;
                for (r = 0; r <= n; r += 1) {
                    tmp1 = Math.pow(u, r);
                    tmp2 = Math.pow(1 - u, n - r);
                    tmp3 = comb[r] * tmp1 * tmp2;
                    sx += tmp3 * pts[r].x;
                    sy += tmp3 * pts[r].y;
                }
                bezier.push(graphUtils.createPoint(sx, sy, i));
            }
            bezier.push(pts[pts.length - 1]);
            return bezier;
        }
    }
});
