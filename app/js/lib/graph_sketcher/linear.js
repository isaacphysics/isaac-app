define(function(require) {
  var f = require('./func.js');

    return {

        lineStyle: function(pts) {

            var q = pts.length - 1;
            // console.log(q);
            var lin = [];
            var sum_x = 0;
            var sum_y = 0;
            var sum_xy = 0;
            var sum_xx = 0;
            var count = 0;
            var X = 0;
            var Y = 0;

            for (i = 0; i < q; i += 1) {
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

            var m = (count*sum_xy - sum_x*sum_y) / (count*sum_xx - sum_x*sum_x);
            // console.log(m);
            var p = (sum_y/count) - (m*sum_x)/count;
            // console.log(b);

            // console.log(pts);

            for(i = 0; i < q; i += 1) {
                sx = pts[i].x;
                // console.log(sx);
                lin.push(f.createPoint(sx, m*sx + p));
                // console.log(i);
                // console.log(pts[i].x);
            }
            // lin.push(pts[pts.length - 1]);
            return lin;
        }
    }
});
