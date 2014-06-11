/**
 * Library to render a series of hexagons from arbitrary data
 * Requires jQuery and D3
 */
define([ 'jquery','d3'],
    function($, d3) 
    {  
        // NOTE this could be encapsulated further (into a Class) but all use cases
        // not yet clear. It doesn't make any functional difference.
        return {
            /**
             * Calculate all the vital information about the hexagons we are plotting
             * @param {String} where Selector string
             * @param {Number} _pad Width between hexagons
             * @param {Number} _width Width of hexagon
             * @param {Number} _aspect How much to scale the sides
             * @param {Array} items Items to render
             * @returns {Object} Hexagon definition
             */           
            calculateHexagons : function(where, _pad, _width, _aspect, items)
            {
                // Internal page width function
                var pageWidth = function()
                {
                    return $(where).width();
                };
                
                // Work our hexagon variables
                // Side length
                var _side = (_width * Math.sqrt(3) / 4) * _aspect;
                // Gap betwwen rows
                var _gap = (_width / 4) * _aspect;
                // Height of hexagon
                var _height = _side + ((_width / 2) * _aspect);
                // Maximum number of columns
                var _maxCols = Math.floor(pageWidth() / (_width + _pad));
                // Minimum number of columns
                var _minCols = _maxCols === 1 ? 1 : _maxCols - 1;
                var _rows = 0, _count = 0;
                var _wrapHeight = 0;
                // Determine total height and number of rows
                while(_count < items)
                {
                    _rows++;
                    _count += (_count % 2 === 0) ? _maxCols : _minCols;
                }

                // Centre hexagons horizontally
                var centre = (_maxCols === _minCols) ? (pageWidth() + (_pad * 2) - (_width * 1.5)) / 2 : (pageWidth() +(_pad * 2) - (_width * _maxCols)) / 2;
                if(centre < 0)
                {
                    centre = 0;
                }

                // Hexagon lines for D3 line generator
                var hexagon = [{x : _width / 2, y : 0}, 
                               {x : 0,          y : _gap},
                               {x : 0,          y : _gap + _side},
                               {x : _width / 2, y : _height},
                               {x : _width,     y : _gap + _side},
                               {x : _width,     y : _gap},
                               {x : _width / 2, y : 0}];
                     
               // Return all Hexagon info
               return {
                   pad: _pad,
                   width: _width,
                   aspect: _aspect,
                   side: _side,
                   gap: _gap,
                   height: _height,
                   wrapHeight: _wrapHeight,
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
                        x = (row % 2 === 0 ? hex.centre : hex.centre + ((hex.width + hex.pad) / 2));
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
                $(where).empty();
                
                // Create D3 enter for each item
                var plot = d3.select(where).selectAll("div")
                        .data(items).enter();
                
                // Create div for each item and position
                var obj = {};
                obj[divClass] = true;
                var plotdiv = plot.append("div")
                            .classed(obj)
                            .style('top', function(d) { return d.y+'px'; })
                            .style('left', function(d) { return d.x+'px'; })
                            .style('position', 'absolute')
                            .style('z-index', '1')
                            .style('width', hex.width + 'px')
                            .style('height', hex.height + 'px');
               
               // Call user supplied function to add other items
               plotdiv = divItems(plotdiv);
               
               // Basic D3 Line function
               var lineFunction = d3.svg.line()
                                 .x(function(d) { return d.x; })
                                 .y(function(d) { return d.y; })
                                 .interpolate("linear");   
                         
               // Create and position SVG canvas for each Hexagon
               var hexplot = plot.append('svg')
                            .style('top', function(d) { return d.y+'px'; })
                            .style('left', function(d) { return d.x+'px'; })
                            .style('position', 'absolute')
                            .style('z-index', '0')
                            .style('width', hex.width + 'px')
                            .style('height', hex.height + 'px');
               
               // Call user supplied function to add specific items to SVG 
               hexplot = svgItems(hexplot);
                    
               // Plot Hexagon
               var hexPath = hexplot.append("path")
                                .attr("d", lineFunction(hex.hexagon));
                        
               // Call user supplied function to add specific attributes to the Hexagon
               hexPath = pathAttrs(hexPath);          
            },
            
            /**
             * Calculate and position all hexagons for the supplied items
             * @param {String} where Selector string
             * @param {Number} _pad Width between hexagons
             * @param {Number} _width Width of hexagon
             * @param {Number} _aspect How much to scale the sides
             * @param {Array} items Items to render
             * @returns {Object} Hexagon definition
             */ 
            calculateAndPositionHexagons : function(where, _pad, _width, _aspect, items)
            {
                // Calculate
                var hex = this.calculateHexagons(where, _pad, _width, _aspect, items.length);
                this.setPositions(hex, items);
                // Position and wrapper height
                $(where).height(hex.wrapHeight);
                // Return Hexagon info
                return hex;
            }
        };
    }
);
