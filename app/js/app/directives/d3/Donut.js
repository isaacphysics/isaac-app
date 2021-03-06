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
                data: "="
            },

            link: function(scope, element, attrs) {

                let updateDonut = function() {

                    element.empty();

                    let allZero = true;

                    for (let i = 0; i < scope.data.length; i++) {
                        if (scope.data[i].val != 0) {
                            allZero = false;
                            break;
                        }
                    }

                    if (allZero) {
                        element.append("<div class='text-center'><i>No Data</i></div>");
                        return;
                    }


                    let range = ['#4d9e34', '#66b045', '#87c064', '#a6ce87', '#c6deaa', '#d8e8c2']; // default colours
                    let label_range = ['#000000', '#000000', '#000000', '#000000', '#ffffff', '#ffffff']

                    // switch colours
                    switch(scope.$parent.$eval(attrs.colorPalette)) {
                        case 'subjects':
                            range = ['#944cbe', '#009acd', '#ef3e36'];
                            label_range = ['#ffffff', '#ffffff', '#ffffff']
                            break;
                        case 'physics':
                            range = [];
                            label_range = [];
                            for (let i = 0; i < scope.data.length; i++) {
                                range.push("hsl(276, 31%, " + (90 - 80*i/scope.data.length) + "%)");
                                label_range.push("hsl(0, 0%, " + (100*Math.round(i/scope.data.length + 0.3)) + "%)");
                            }
                            break;
                        case 'maths':
                            range = [];
                            label_range = [];
                            for (let i = 0; i < scope.data.length; i++) {
                                range.push("hsl(197, 79%, " + (90 - 80*i/scope.data.length) + "%)");
                                label_range.push("hsl(0, 0%, " + (100*Math.round(i/scope.data.length  + 0.3)) + "%)");
                            }
                            break;
                        case 'levels':
                            range = [];
                            for (let i = 0; i < scope.data.length; i++) {
                                range.push("hsl(106, 50%, " + (90-80*i/scope.data.length) + "%)");
                            }
                            break;
                    }

                    let width = 360,
                        height = 360,
                        radius = Math.min(width, height) / 2,
                        donutWidth = 70;

                    let color = d3.scale.ordinal()
                        .range(range);

                    let label_colour =  d3.scale.ordinal()
                        .range(label_range);

                    let pie = d3.layout.pie()
                        .sort(null)
                        .value(function (d) {
                            return d.val;
                        });

                    let arc = d3.svg.arc()
                        .innerRadius(radius - donutWidth)
                        .outerRadius(radius);

                    // Add svg
                    let svg = d3.select(element[0])
                        .append("svg")
                        .attr('class', 'd3-donut')
                        .attr('width', '100%')
                        .attr('height', '100%')
                        .attr('viewBox','0 0 '+Math.min(width,height)+' '+Math.min(width,height))
                        .attr('preserveAspectRatio','xMinYMin')
                        .append('g')
                        .attr('transform', 'translate(' + Math.min(width,height) / 2 + ',' + Math.min(width,height) / 2 + ')');

                    function tweenPie(b) {
                        let i = d3.interpolate({startAngle: 1.1*Math.PI, endAngle: 1.1*Math.PI}, b);
                        return function(t) { return arc(i(t)); };
                    }

                    let path = svg.selectAll('path')
                        .data(pie(scope.data))
                        .enter().append('g')
                        .attr("class", "arc")
                        .append("path")
                        .attr("fill", function(d, i) { return color(i); })
                        .transition()
                        .ease('exp')
                        .duration(700)
                        .attrTween('d', tweenPie);
                    void path;

                    let arcs = svg.selectAll("g.arc");
                    arcs.append("text")
                        .attr("class", "arc-label")
                        .attr("fill", function(d, i) { return label_colour(i); })
                        .attr("transform", function(d) {
                            return "translate(" + arc.centroid(d) + ")";
                        })
                        .attr("text-anchor", "middle")
                        .text(function(d) {
                            if (d.value > 0) {
                                return d.value;
                            }
                        });
                    arcs.append("title").text(function(d, i) {
                        let title = scope.data[i].label + ": ";
                        title = title + Math.round(100*(d.endAngle-d.startAngle)/(2*Math.PI)) + "%";
                        return title;
                    });


                    // Settings for Key 
                    let keySpacing = 7,
                        keyRectSize = 22;

                    let key = svg.selectAll('.legend')
                        .data(color.domain())
                        .enter()
                        .append('g')
                        .attr('class', 'key')
                        .attr('transform', function(d, i) {
                            let legendHeight = keyRectSize + keySpacing;
                            let offset =  legendHeight * color.domain().length / 2;
                            let horz = -2 * keyRectSize;
                            let vert = i * legendHeight - offset;
                            return 'translate(' + horz + ',' + vert + ')';
                        });

                        // Add colours for Key
                        key.append('rect')
                            .attr('width', keyRectSize)
                            .attr('height', keyRectSize)
                            .style('fill', color)
                            .style('stroke', color);

                        // Set label for Key
                        key.append('text')
                            .attr('x', keyRectSize + keySpacing)
                            .attr('y', keyRectSize - keySpacing)
                            .text(function(d, i) { return scope.data[i].label; });
                }

                scope.$watch("data", function(newData, _oldData) {
                    if (newData) {
                        updateDonut();
                    }
                });
            }
        }
    }
});