define(['../../app/directives/graph_sketcher/GraphUtils.js'], function(graphUtils) {
    return {

        lineStyle: function(pts) {

            let q = pts.length - 1;
            let lin = [];
            let sum_x = 0;
            let sum_y = 0;
            let sum_xy = 0;
            let sum_xx = 0;
            let count = 0;
            let X = 0;
            let Y = 0;

            for (let i = 0; i < q; i += 1) {
                X = pts[i].x;
                Y = pts[i].y;
                sum_x += X;
                sum_y += Y;
                sum_xx += X*X;
                sum_xy += X*Y;
                count++;
            }

            let m = (count*sum_xy - sum_x*sum_y) / (count*sum_xx - sum_x*sum_x);

            let p = (sum_y/count) - (m*sum_x)/count;

            for (let i = 0; i < q; i += 1) {
                let sx = pts[i].x;
                lin.push(graphUtils.createPoint(sx, m * sx + p));
            }
            return lin;
        }
    }
});
