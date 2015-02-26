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
            restrict: 'E',
            link: function(scope, element, attrs) {
                
                var data = scope[attrs.data];

                alert(data);

                var dataset = {
                    apples: [53245, 28479, 19697, 24037, 40245],
                };

                var donutWidth = 70;

                var width = 360,
                    height = 360,
                    radius = Math.min(width, height) / 2;

                var color = d3.scale.category20();

                var pie = d3.layout.pie()
                    .sort(null);

                var arc = d3.svg.arc()
                    .innerRadius(radius - donutWidth)
                    .outerRadius(radius);

                var svg = d3.select(element[0])
                    .append("svg")
                    .attr("width", '100%')
                    .attr("height", '100%')
                    .attr('viewBox','0 0 '+Math.min(width,height)+' '+Math.min(width,height))
                    .attr('preserveAspectRatio','xMinYMin')
                    .append("g")
                    .attr("transform", "translate(" + Math.min(width,height) / 2 + "," + Math.min(width,height) / 2 + ")");

                var path = svg.selectAll("path")
                    .data(pie(dataset.apples))
                    .enter().append("path")
                    .attr("fill", function(d, i) { return color(i); })
                    .transition()
                    .ease("exp")
                    .duration(700)
                    .attrTween("d", tweenPie);

                function tweenPie(b) {
                    var i = d3.interpolate({startAngle: 1.1*Math.PI, endAngle: 1.1*Math.PI}, b);
                    return function(t) { return arc(i(t)); };
                }


                var legendRectSize = 18;
                var legendSpacing = 4;

                var legend = svg.selectAll('.legend')
                    .data(color.domain())
                    .enter()
                    .append('g')
                    .attr('class', 'legend')
                    .attr('transform', function(d, i) {
                        var height = legendRectSize + legendSpacing;
                        var offset =  height * color.domain().length / 2;
                        var horz = -2 * legendRectSize;
                        var vert = i * height - offset;
                        return 'translate(' + horz + ',' + vert + ')';
                    });

                    // Add colours for Key
                    legend.append('rect')
                        .attr('width', legendRectSize)
                        .attr('height', legendRectSize)
                        .style('fill', color)
                        .style('stroke', color);

                    // Set label for Key
                    legend.append('text')
                        .attr('x', legendRectSize + legendSpacing)
                        .attr('y', legendRectSize - legendSpacing)
                        .text(function(d, i) { return scope.data[i].name; });

            }
        }
    }
});