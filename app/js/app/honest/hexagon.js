/**
 * Library to render a series of hexagons from arbitrary data
 * Requires jQuery and D3
 */
define([ 'jquery','lib/honest/d3.min'],
    function($, d3) 
    {  
        // NOTE this could be encapsulated further (into a Class) but all use cases
        // not yet clear. It doesn't make any functional difference.
        return {
            
            /**
             * Calculate all the vital information about a Hexagon
             * @param {Number} _width Width of hexagon
             * @param {Number} _aspect How much to scale the sides
             * @param {Object} _offset Offset from origin {x,y}
             * @returns {Object} Hexagon definition
             */
            calculateHexagon: function(_width, _aspect, _offset)
            {
                var _offset = _offset || {x:0,y:0};
                // Side length
                var _side = (_width * Math.sqrt(3) / 4) * _aspect;
                // Gap betwwen rows
                var _gap = (_width / 4) * _aspect;
                // Height of hexagon
                var _height = _side + ((_width / 2) * _aspect);
                // Hexagon lines for D3 line generator
                var _hexagon = [{x : _width / 2, y : 0}, 
                                {x : 0,          y : _gap},
                                {x : 0,          y : _gap + _side},
                                {x : _width / 2, y : _height},
                                {x : _width,     y : _gap + _side},
                                {x : _width,     y : _gap},
                                {x : _width / 2, y : 0}];
                for(var i = 0; i < 7; i++)
                {
                    _hexagon[i].x += _offset.x;
                    _hexagon[i].y += _offset.y;
                }
                return {side:_side, gap:_gap, height:_height, hexagon:_hexagon};
            },
            
            /**
             * Calculate all the vital information about the hexagons we are plotting
             * @param {String} where Selector string
             * @param {Number} _pad Width between hexagons
             * @param {Number} _width Width of hexagon
             * @param {Number} _aspect How much to scale the sides
             * @param {Array} items Items to render
             * @param {Boolean} equalRows - do we have the same number of hexagons in each row?
             * @returns {Object} Hexagons definition
             */           
            calculateHexagons : function(where, _pad, _width, _aspect, items, equalRows)
            {
                if (where.length == 0)
                    return;

                // Internal page width function
                var pageWidth = function()
                {
                    return where.width();
                };
                
                // Work our hexagon variables
                var _hexagon = this.calculateHexagon(_width, _aspect);
                // Side length
                var _side = _hexagon.side;
                // Gap betwwen rows
                var _gap = _hexagon.gap;
                // Height of hexagon
                var _height = _hexagon.height;
                // Hexagon lines for D3 line generator
                var hexagon = _hexagon.hexagon;
                
                if(equalRows)
                {
                    // Maximum number of columns
                    var _maxCols = Math.max(1, Math.ceil(pageWidth() / (_width + _pad)) - 1); // Ensure _maxCols is at least 1
                    // Minimum number of columns
                    var _minCols = _maxCols;
                }
                else
                {
                    // Maximum number of columns
                    _maxCols = Math.max(1, Math.floor(pageWidth() / (_width + _pad))); // Ensure _maxCols is at least 1
                    // Minimum number of columns
                    _minCols = _maxCols === 1 ? 1 : _maxCols - 1;
                }
                var _rows = 0, _count = 0;
                var _wrapHeight = 0;
                // Determine total height and number of rows
                while(_count < items)
                {
                    _rows++;
                    _count += (_count % 2 === 0) ? _maxCols : _minCols;
                }

                // Centre hexagons horizontally
                if(!equalRows)
                {
                    var centre = (_maxCols === 1) ? (pageWidth() + (_pad * 2) - (_width * 1.5)) / 2 : (pageWidth() +(_pad * 2) - (_width * _maxCols)) / 2;
                    if(centre < 0)
                    {
                        centre = 0;
                    }
                }
                else
                {
                    centre = 0;
                }
                     
               // Return all Hexagon info
               return {
                   pad: _pad,
                   width: _width,
                   aspect: _aspect,
                   side: _side,
                   gap: _gap,
                   height: _height,
                   wrapHeight: _wrapHeight + 2,
                   wrapWidth: pageWidth(),
                   min: _minCols,
                   max: _maxCols,
                   rows: _rows,
                   hexagon: hexagon,
                   centre: centre
               };
            },

            /**
             * Given a Hexagon 'hex/ set all items in the correct position
             * @param {Object from calculateHexagons} hex Hexagon info
             * @param {Array} items Items to render
             */
            setPositions : function(hex, items)
            {
                hex.wrapHeight = 0;
               // Update positions into questions
                var row = 0, col = 0, x = hex.centre, y = 0, full_row = false;
                for(var i = 0, len = items.length; i < len; i++)
                {
                    full_row = false;
                    items[i].x = x;
                    items[i].y = y;
                    // Increment
                    col++; x += hex.width + hex.pad;
                    // New row?
                    if(col >= (row % 2 === 0 ? hex.max : hex.min))
                    {
                        row++;
                        // Update X & Y
                        y += hex.height + hex.pad - hex.gap;
                        // X depends on even or odd
	                    // Note: row is 0 based, therefore in 3 rows, the 2nd (middle row) is odd
                        x = (row % 2 === 0 ? hex.centre : hex.centre + ((hex.width + hex.pad) / 2));
                        // Are we the last hexagon on a new row with minWidth > 1?
                        if(i === len - 2 && hex.min > 1)
                        {
	                        x = (hex.wrapWidth / 2) - (hex.width / 2) + (hex.pad * (1 + Math.floor(hex.max / 2)));

	                        if (col % 2 !== 0) {
		                        // Shift the hexagon leftwards to align with the row above if there are an odd number of
		                        // heaxgons above
		                        x -= (hex.width / 2) + hex.pad;
	                        }
                        }
                        col = 0;
                        full_row = true;
                    }
                    hex.wrapHeight = y;
                }  
                hex.wrapHeight += full_row ? hex.gap : hex.height;
            },
            
            /**
             * Draw hexagons
             * @param {String} where Selector string
             * @param {Object} hex Hexagon definintion
             * @param {Array} items Items to render
             * @param {String} divClass Class to assign to wrapper DIV
             * @param {function} divItems Allow caller to render specific DIV contents, should 
             * return what it was passed.
             * @param {function} pathAttrs Allow caller to set specific attribtues on rendered Hexagon,
             * should return what it was passed.
             * @param {function} svgItems Allow caller to add to SVG, e.g. patterns, should return
             * what it was passed.
             */
            drawHexagons : function(where, hex, items, divClass, divItems, pathAttrs, svgItems)
            {
                // Clear target
                where.empty();
                console.log("VERSION", d3.version);
                
                // Create D3 enter for each item
                var plot = d3.select(where[0]).selectAll("a")
                        .data(items).enter();
                
                // Create div for each item and position
                var obj = {};
                obj[divClass] = true;
                var plotdiv = plot.append("a")
                            .classed(obj)
                            .style('top', function(d) { return d.y+'px'; })
                            .style('left', function(d) { return d.x+'px'; })
                            .style('position', 'absolute')
                            .style('z-index', '1')
                            .style('width', hex.width + 'px')
                            .style('height', hex.height + 'px');

               // Basic D3 Line function
               var lineFunction = d3.svg.line()
                                 .x(function(d) { return d.x; })
                                 .y(function(d) { return d.y; })
                                 .interpolate("linear");   

                var hexplot = plotdiv.append('div')
                            .style('top', 0)
                            .style('left', 0)
                            .style('position', 'absolute')
                            .style('z-index', '-10')
                            .style('width', hex.width + 'px')
                            .style('height', (Math.ceil(hex.height)) + 'px')
                            .append('svg')

                var hexpath = hexplot.append("path")
                                .attr("d", lineFunction(hex.hexagon));
               
               // Call user supplied function to add specific items to SVG 
               hexplot = svgItems(hexplot);
               hexplot.attr("viewBox", "0 0 " + hex.width + " " + (Math.ceil(hex.height)));

               // Call user supplied function to add specific attributes to the Hexagon
               hexpath = pathAttrs(hexpath);         


               // Call user supplied function to add other items
               plotdiv = divItems(plotdiv);
               

/*                         
               // Create and position SVG canvas for each Hexagon
               var hexplot = plot.append('div')
                            .style('top', function(d) { return d.y+'px'; })
                            .style('left', function(d) { return d.x+'px'; })
                            .style('position', 'absolute')
                            .style('z-index', '0')
                            .style('width', hex.width + 'px')
                            .style('height', (Math.ceil(hex.height)) + 'px')
                            .append('svg');

               // Call user supplied function to add specific items to SVG 
               hexplot = svgItems(hexplot);
               hexplot.attr("viewBox", "0 0 " + hex.width + " " + (Math.ceil(hex.height)));
               
               // Plot Hexagon
               var hexPath = hexplot.append("path")
                                .attr("d", lineFunction(hex.hexagon));
                        
*/
            },
            
            /**
             * Calculate and position all hexagons for the supplied items
             * @param {String} where Selector string
             * @param {Number} _pad Width between hexagons
             * @param {Number} _width Width of hexagon
             * @param {Number} _aspect How much to scale the sides
             * @param {Array} items Items to render
             * @param {Boolean} equalRows - do we have the same number of hexagons in each row?
             * @returns {Object} Hexagon definition
             */ 
            calculateAndPositionHexagons : function(where, _pad, _width, _aspect, items, equalRows)
            {
                // Calculate
                var hex = this.calculateHexagons(where, _pad, _width, _aspect, items.length, equalRows);
                this.setPositions(hex, items);
                // Position and wrapper height
                where.height(hex.wrapHeight);
                // Return Hexagon info
                return hex;
            }
        };
    }
);
