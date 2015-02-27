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

                var data = scope[attrs.data], // get data
                    range = ['#d8e8c2', '#c6deaa', '#a6ce87', '#87c064', '#66b045', '#4d9e34']; // default colours

                // switch colours
                switch($(element[0]).attr('colorPalette')) {
                    case 'subjects':
                        range = ['#6c388c', '#189ace'];
                        break;
                    case 'fields':
                        range = ['#c5b2d7', '#9570af', '#7f529d', '#6c388c', '#a3d9ee'];
                        break;
                }

                var width = 360,
                    height = 360,
                    radius = Math.min(width, height) / 2,
                    donutWidth = 70;

                var color = d3.scale.ordinal()
                    .range(range);

                var pie = d3.layout.pie()
                    .sort(null)
                    .value(function (d) {
                        return d.val;
                    });


                var arc = d3.svg.arc()
                    .innerRadius(radius - donutWidth)
                    .outerRadius(radius);

                // Add svg
                var svg = d3.select(element[0])
                    .append("svg")
                    .attr('class', 'd3-donut')
                    .attr('width', '100%')
                    .attr('height', '100%')
                    .attr('viewBox','0 0 '+Math.min(width,height)+' '+Math.min(width,height))
                    .attr('preserveAspectRatio','xMinYMin')
                    .append('g')
                    .attr('transform', 'translate(' + Math.min(width,height) / 2 + ',' + Math.min(width,height) / 2 + ')');

                var path = svg.selectAll('path')
                    .data(pie(data))
                    .enter().append('path')
                    .attr("fill", function(d, i) { return color(i); })
                    .transition()
                    .ease('exp')
                    .duration(700)
                    .attrTween('d', tweenPie);

                function tweenPie(b) {
                    var i = d3.interpolate({startAngle: 1.1*Math.PI, endAngle: 1.1*Math.PI}, b);
                    return function(t) { return arc(i(t)); };
                }

                var keySpacing = 7,
                    keyRectSize = 22;

                var key = svg.selectAll('.legend')
                    .data(color.domain())
                    .enter()
                    .append('g')
                    .attr('class', 'key')
                    .attr('transform', function(d, i) {
                        var height = keyRectSize + keySpacing;
                        var offset =  height * color.domain().length / 2;
                        var horz = -2 * keyRectSize;
                        var vert = i * height - offset;
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
                        .text(function(d, i) { return data[i].label; });

            }
        }
    }
});