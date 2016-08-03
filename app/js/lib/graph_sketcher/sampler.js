/**
 * Copyright 2016 Junwei Yuan
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Given a set of data points, sample a subset of points such that there is about constant space interval between two adjacent points.
define(function(require) {
    return {
        sampleInterval: 10,

        sample: function(pts) {
            var sampled = [];
            sampled.push(pts[0]);
            var i = 0;
            var j = 0;
            while (i < pts.length) {
                // func.getDist
                while (j < pts.length && getDist(pts[i], pts[j]) < sampleInterval) {
                    j += 1;
                }

                if (j < pts.length) {
                    sampled.push(pts[j]);
                }

                i = j;
            }
            sampled.push(pts[pts.length - 1]);
            return sampled;
        }
    };
});
