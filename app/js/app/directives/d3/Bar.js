/**
 * Copyright 2015 Luke McLean
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
define([], function() {
    return function() {
        return {
            restrict: 'A',

            scope: {
                data: "="
            },

            link: function(scope, element, attrs) {
                    
                scope.$watch('data', function(){

                    var w = 960,
                        h = 500

                    // create canvas
                    var svg = d3.select(element[0])
                        .append("svg")
                        .attr("class", "chart")
                        .attr("width", '100%')
                        .attr("height", '100%')
                        .attr('viewBox','0 0 '+w+' '+h)
                        .attr('preserveAspectRatio','xMinYMin')
                        .append("svg:g")
                        .attr("transform", "translate(10,470)");

                    x = d3.scale.ordinal().rangeRoundBands([0, w-50])
                    y = d3.scale.linear().range([0, h-50])
                    z = d3.scale.ordinal().range(['#4fa446', '#7dc571', '#bbdda9']);

                    var matrix = [
                        [ 1,  5871, 8916, 2868],
                        [ 2, 10048, 2060, 6171],
                        [ 3, 16145, 8090, 8045],
                        [ 4,   990,  940, 6907]
                    ];

                    var remapped =["c1","c2","c3"].map(function(dat,i){
                        return matrix.map(function(d,ii){
                            return {x: ii, y: d[i+1] };
                        })
                    });
                    console.log(remapped)

                    var stacked = d3.layout.stack()(remapped)
                    console.log(stacked)

                    x.domain(stacked[0].map(function(d) { return d.x; }));
                    y.domain([0, d3.max(stacked[stacked.length - 1], function(d) { return d.y0 + d.y; })]);


                    // Add a group for each column.
                    var valgroup = svg.selectAll("g.valgroup")
                        .data(stacked)
                        .enter().append("svg:g")
                        .attr("class", "valgroup")
                        .style("fill", function(d, i) { return z(i); })
                        .style("stroke", function(d, i) { return d3.rgb(z(i)).darker(); });

                    // Add a rect for each date.
                    var rect = valgroup.selectAll("rect")
                        .data(function(d){return d;})
                        .enter().append("svg:rect")
                        .attr("x", function(d) { return x(d.x); })
                        .attr("y", function(d) { return -y(d.y0) - y(d.y); })
                        .attr("height", function(d) { return y(d.y); })
                        .attr("width", x.rangeBand());

                });
            
            }     
        }
    }
});