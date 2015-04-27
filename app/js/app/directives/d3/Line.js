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
                    var data = [],
                        w = 500,
                        h = 300,
                        padding = 30,
                        color_hash = [
                            "#00bbf2",
                            "orange",
                            "red",
                        ]; 

                    var minX = Number.MAX_VALUE,
                        maxX = -Number.MAX_VALUE,
                        minY = Number.MAX_VALUE,
                        maxY = -Number.MAX_VALUE;

                    for(series in scope.data) {
                        var ds = [];
                        ds.color = color_hash[data.length];
                        ds.title = series;
                        for(key in scope.data[series]){
                            var x = Date.parse(key),
                                y = scope.data[series][key];

                            minX = Math.min(minX, x);
                            minY = Math.min(minY, y);

                            maxX = Math.max(maxX, x);
                            maxY = Math.max(maxY, y);

                            ds.push({
                                x: x, 
                                y: y,
                                color: ds.color,
                            });
                        }
                        ds.sort(function(a, b){return a.x > b.x ? 1 : (a.x < b.x ? -1 : 0)});
                        data.push(ds);
                    }

                    // Define axis ranges & scales        
                    var xScale = d3.time.scale()
                        .domain([minX, maxX])
                        .range([padding, w - padding * 2]);

                    var yScale = d3.scale.linear()
                        .domain([0, maxY])
                       .range([h - padding, padding]);


                    // Create SVG element
                    var svg = d3.select(element[0])
                        .append("svg")
                        .attr('class', 'd3-line')
                        .attr("width", '100%')
                        .attr("height", '100%')
                        .attr('viewBox','0 0 '+w+' '+h)
                        .attr('preserveAspectRatio','xMinYMin');

                    // Define lines
                    var line = d3.svg.line();
    

                    var pathContainers = svg.selectAll('g.line').data(data);
                    
                    pathContainers.enter().append('g')
                        .attr('class', 'd3-line-data')
                        .attr("style", function(d) {
                            return "fill: none; stroke:"+ d.color; 
                        });

                    pathContainers.selectAll('path')
                        .data(function (d) { return [d]; }) // continues the data from the pathContainer
                        .enter().append('path')
                            .attr('d', d3.svg.line()
                                .x(function (d) { return xScale(d.x); })
                                .y(function (d) { return yScale(d.y); })
                            );

                    // add circles
                    pathContainers.selectAll('circle')
                        .data(function (d) { return d; })
                        .enter().append('circle')
                        .attr('cx', function (d) { return xScale(d.x); })
                        .attr('cy', function (d) { return yScale(d.y); })
                        .attr('fill', function (d) { return d.color; })
                        .attr('stroke', function (d) { return d.color; })
                        .attr('stroke-width', 3)
                        .attr('r', 2);
      
                    //Define X axis
                    var xAxis = d3.svg.axis()
                        .scale(xScale)
                        .orient("bottom")
                        .ticks(5)
                        .tickFormat(d3.time.format("%b"));

                    //Define Y axis
                    var yAxis = d3.svg.axis()
                        .scale(yScale)
                        .orient("left")
                        .ticks(5);
       

                    //Add X axis
                    svg.append("g")
                    .attr("class", "axis")
                    .attr("transform", "translate(0," + (h - padding) + ")")
                    .call(xAxis);

                    //Add Y axis
                    svg.append("g")
                    .attr("class", "axis")
                    .attr("transform", "translate(" + padding + ",0)")
                    .call(yAxis);

                    // Add legend   
                    var legend = svg.append("g")
                      .attr("class", "legend")
                      .attr("x", w - 65)
                      .attr("y", 25)
                      .attr("height", 100)
                      .attr("width", 100);

                    legend.selectAll('g').data(data)
                      .enter()
                      .append('g')
                      .each(function(d, i) {
                        var g = d3.select(this);
                        g.append("rect")
                          .attr("x", w - 65)
                          .attr("y", i*25)
                          .attr("width", 10)
                          .attr("height", 10)
                          .style("fill", function (d) { return d.color; });
                        
                        g.append("text")
                          .attr("x", w - 50)
                          .attr("y", i * 25 + 8)
                          .attr("height",30)
                          .attr("width",100)
                          .text(function (d) { return d.title; });

                    });
                });
            
            }     
        }
    }
});