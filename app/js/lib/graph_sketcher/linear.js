define(['./func.js'], function(f) {
    return {

        lineStyle: function(pts) {

            let q = pts.length - 1;
            // console.log(q);
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
                // console.log(X);
                Y = pts[i].y;
                // console.log(Y);
                sum_x += X;
                sum_y += Y;
                sum_xx += X*X;
                sum_xy += X*Y;
                count++;
            }

            let m = (count*sum_xy - sum_x*sum_y) / (count*sum_xx - sum_x*sum_x);
            // console.log(m);
            let p = (sum_y/count) - (m*sum_x)/count;
            // console.log(b);

            // console.log(pts);

            for (let i = 0; i < q; i += 1) {
                let sx = pts[i].x;
                // console.log(sx);
                lin.push(f.createPoint(sx, m * sx + p));
                // console.log(i);
                // console.log(pts[i].x);
            }
            // lin.push(pts[pts.length - 1]);
            return lin;
        }
    }
});
