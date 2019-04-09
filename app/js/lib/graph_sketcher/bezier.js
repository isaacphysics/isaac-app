define(['../../app/directives/graph_sketcher/GraphUtils.js'], function(graphUtils) {

    // See https://github.com/josdejong/mathjs/blob/v5.8.0/src/function/probability/product.js
    let product = function(i, n) {
        let half;
        if (n < i) {
            return 1;
        }
        if (n === i) {
            return n;
        }
        half = (n + i) >> 1 // divide (n + i) by 2 and truncate to integer
        return product(i, half) * product(half + 1, n);
    }

    // See https://github.com/josdejong/mathjs/blob/v5.8.0/src/function/probability/combinations.js
    let combinations = function(n, k) {
        let prodrange, nMinusk;

        if (n < 0 || k < 0) {
            throw new TypeError('Positive integer value expected in function combinations');
        }
        if (k > n) {
            throw new TypeError('k must be less than or equal to n');
        }

        nMinusk = n - k;

        if (k < nMinusk) {
            prodrange = product(nMinusk + 1, n);
            return prodrange / product(1, k);
        }
        prodrange = product(k + 1, n)
        return prodrange / product(1, nMinusk);
    }

    return {
        numOfPts: 100,

        lineStyle: function(pts) {

            let n = pts.length - 1;
            let comb = [];
            for (let r = 0; r <= n; r += 1) {
                comb.push(combinations(n, r));
            }

            let step = 1 / this.numOfPts;
            let bezier = [];
            let u;
            
            let tmp1;
            let tmp2;
            let tmp3;

            for (let i = 0; i < this.numOfPts; i += 1) {
                u = i * step;
                let sx = 0;
                let sy = 0;
                for (let r = 0; r <= n; r += 1) {
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
