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
define(["d3"], function(d3) {
    return function() {
        return {
            restrict: 'A',

            scope: {
                data: "=",
                type: "@",
            },

            link: function(scope, element, _attrs) {

                let dateFormat = d3.time.format("%b %Y");

                scope.$watch('data', function(newData){
                    if (!newData) {
                        return;
                    }
                    
                    let data = [],
                        w = 500,
                        h = 225,
                        padding = 55,
                        color_hash = [
                            "#b2e2f9",
                            "#3db2e7",
                            "#17668f",
                            "#0e212f"
                        ]; 

                    let minX = Number.MAX_VALUE,
                        maxX = -Number.MAX_VALUE,
                        minY = Number.MAX_VALUE,
                        maxY = -Number.MAX_VALUE;

                    for(let series in scope.data) {
                        let ds = [];
                        ds.color = color_hash[data.length];
                        ds.title = series;

                        for(key in scope.data[series]){
                            let x = Date.parse(key),
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

                        if(scope.type === 'area'){
                            ds.unshift({
                                x: minX, 
                                y: 0,
                                color: ds.color,
                            });
                            ds.push({
                                x: maxX, 
                                y: 0,
                                color: ds.color,
                            });
                        }

                        data.push(ds);
                    }

                    // Define axis ranges & scales        
                    let xScale = d3.time.scale()
                        .domain([minX, maxX]).nice(d3.time.year)
                        .range([padding, w - 30]);

                    let yScale = d3.scale.linear()
                        .domain([0, maxY])
                        .range([h - padding, 5]);

                    element.empty();
                    // Create SVG element
                    let svg = d3.select(element[0])
                        .append("svg")
                        .attr('class', 'd3-line')
                        .attr("width", '100%')
                        .attr("height", '100%')
                        .attr('viewBox','0 0 '+w+' '+h)
                        .attr('preserveAspectRatio','xMinYMin');

                    // Define lines
                    let line = d3.svg.line();
                    void line;

                    let pathContainers = svg.selectAll('g.line').data(data);
                    
                    pathContainers.enter().append('g')
                        .attr('class', 'd3-line-data')
                        .attr("style", function(d) {
                            if(scope.type === 'area'){
                                return "fill:"+d.color+"; stroke:"+ d.color; 
                            }
                            else{
                                return "fill: none; stroke:"+ d.color; 
                            }
                        });

                    pathContainers.selectAll('path')
                        .data(function (d) { return [d]; }) // continues the data from the pathContainer
                        .enter().append('path')
                            .attr('d', d3.svg.line()
                                .x(function (d) { return xScale(d.x); })
                                .y(function (d) { return yScale(d.y); })
                            );

                    // add circles for line graph
                    if (scope.type != 'area') {

                        let d3tooltip = d3.select("body").append("div")  
                            .attr("class", "d3-tooltip")               
                            .style("opacity", 0);

                        pathContainers.selectAll('circle')
                            .data(function (d) { return d; })
                            .enter().append('circle')
                            .attr('cx', function (d) { return xScale(d.x); })
                            .attr('cy', function (d) { return yScale(d.y); })
                            .attr('fill', function (d) { return d.color; })
                            .attr('stroke', function (d) { return d.color; })
                            .attr('stroke-width', 3)
                            .attr('r', 2)
                            .on("mouseover", function(d) {      
                                d3tooltip.transition()        
                                    .duration(200)      
                                    .style("opacity", .9);

                                d3tooltip.html(dateFormat(new Date(d.x)) + "<br><b>"+ d.y + "</b>")  
                                    .style("left", (d3.event.pageX) + "px")     
                                    .style("top", (d3.event.pageY - 28) + "px");    
                            })                  
                            .on("mouseout", function(_d) {       
                                d3tooltip.transition()        
                                    .duration(500)      
                                    .style("opacity", 0);   
                            });
                    }
      
                    //Define X axis
                    let xAxis = d3.svg.axis()
                        .scale(xScale)
                        .orient("bottom")
                        .ticks(6)
                        .tickSize(-h).tickSubdivide(true)
                        .tickFormat(dateFormat);

                    //Define Y axis
                    let yAxis = d3.svg.axis()
                        .scale(yScale)
                        .orient("left")
                        .ticks(5);
       

                    //Add X axis
                    svg.append("g")
                    .attr("class", "x-axis")
                    .attr("transform", "translate(0," + (h - padding) + ")")
                    .call(xAxis);

                    //Add Y axis
                    svg.append("g")
                    .attr("class", "y-axis")
                    .attr("transform", "translate(" + padding + ",0)")
                    .call(yAxis);


                    // Add key
                    let key = d3.select(element[0]).append("ul")
                        .attr("class", "d3-plot-key");

                    key.selectAll("li")
                        .data(data)
                        .enter().append("li")
                        .html(function (d) { return d.title + ' <span style="background-color:'+d.color+'"></span>';});
                });
            
            }     
        }
    }
});