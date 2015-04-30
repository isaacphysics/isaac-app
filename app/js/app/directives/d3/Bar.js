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

                    var w = 500,
                        h = 500

                    // create canvas
                    var svg = d3.select(element[0])
                        .append("svg")
                        .attr("class", "d3-bar")
                        .attr("width", '100%')
                        .attr("height", '100%')
                        .attr('viewBox','0 0 '+w+' '+h)
                        .attr('preserveAspectRatio','xMinYMin')
                        .append("svg:g")
                        .attr("transform", "translate(50, 460)");

                    x = d3.scale.ordinal().rangeRoundBands([0, w-50])
                    y = d3.scale.linear().range([0, h-50])
                    z = d3.scale.ordinal().range(['#4fa446', '#7dc571', '#bbdda9']);

                    var matrix = [
                        [ 1, 2, 4, 2.5],
                        [ 2, 8, 1, 0],
                        [ 3, 3, 6, 8],
                        [ 4, 1,  3, 1]
                    ];

                    var remapped =["c1","c2","c3"].map(function(dat,i){
                        return matrix.map(function(d,ii){
                            return {x: ii, y: d[i+1] };
                        })
                    });

                    var stacked = d3.layout.stack()(remapped)

                    x.domain(stacked[0].map(function(d) { return d.x; }));
                    y.domain([0, d3.max(stacked[stacked.length - 1], function(d) { return d.y0 + d.y; })]);


                    // Add a group for each column.
                    var valgroup = svg.selectAll("g.valgroup")
                        .data(stacked)
                        .enter().append("g")
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


                    var xAxis = d3.svg.axis()
                        .scale(x)
                        .orient("bottom");

                    var yAxis = d3.svg.axis()
                        .scale(y)
                        .orient("left");
       

                    svg.append("g")
                        .attr("class", "x-axis")
                        .attr("transform", "translate(0, 10)")
                        .call(xAxis);

                    svg.append("g")
                        .attr("class", "y-axis")
                        .attr("transform", "translate(-20, -450)")
                        .call(yAxis);

                    // add next and previous
                    d3.select(element[0]).append("div").attr("class", "d3-bar-prev"); 
                    d3.select(element[0]).append("div").attr("class", "d3-bar-next");

                    // Add total count
                    var total = d3.select(element[0]).append("p")
                        .attr("class", "d3-bar-total")
                        .html('6 month total: <strong>45 hours</strong>');

                    // Add key
                    var key = d3.select(element[0]).append("ul")
                        .attr("class", "d3-bar-key");

                    key.selectAll("li")
                        .data(stacked)
                        .enter().append("li")
                        .html(function(d, i) { return '<span style="background-color:'+z(i)+'"></span> Title';});

                });
            
            }     
        }
    }
});