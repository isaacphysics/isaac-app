/**
 * Library to handle Hex Filter
 * Requires jQuery 
 */
define([ 'jquery', './hexagon', 'd3'],
    function($, hexagon, d3) 
    { 
        /**
         * Initialise a new Hex Filter
         * @param {Object} options - get:get current options callback, change:change callback
         * @returns {HexFilter Object}
         */
        var HexFilter = function(element, options)
        {
            this._element = element;
            // Parse options
            this.options =  {};
            this.options.get    = options.get    || function(callback) { callback([]);};
            this.change = options.change || function() {};
            var us = this;
            // Filter
            this.filter = [];
            // Last filter level to show
            this.endLevel = 3;
            // Visible filters
            this.visible = [];
            // Selected filters
            this.selected = [];
            // Are we disaplying vertically or horizontally
            this.isVertical = false;
            // Constants
            // Number of dots vertically on desktop
            this._deskVertical = 6;
            // Number of dots horizontally on desktop
            this._deskHoriz = 8;
            // Dot gap
            this._dotGap = 11.5;
            // Dot radius
            this._dotRadius = 3.5;
            // Hexagon width
            this._width = 72;
            // Hexagon aspect ratio
            this._aspect = 1.2;
            // Get basic hexagon info so we know the height upfront
            this._hexagon = hexagon.calculateHexagon(this._width, this._aspect);
            this._height = this._hexagon.height;
            // Circle positions for desktop
            this._deskParentPos = [0, 8, 16, 24, 32, 40];
            this._deskChildPos = [0, 4, 12, 20, 28, 36];
            // Circle positions for mobile
            this._mobParentPos = [3, 11, 19, 27, 35, 43];
            this._mobChildPos = [3, 11, 19, 27, 35, 43];
            // Get filter and display
            options.get(function(_filter)
            {
                us.filter = _filter;
                us.ReDraw();
            }); 
        };
       /**
        * Create an SVG DOM element in the correct NS
        * @param {String} tagName
        * @returns {JQuery DOM Element}
        */ 
        var svgEl = function(tagName)
        {
            return $(document.createElementNS("http://www.w3.org/2000/svg", tagName));
        };

        /**
         * Determine which filter hexagons are visible and what the highest
         * displayed level is
         */
        HexFilter.prototype._determineVisibility = function()
        {
            var us = this;
            // Reset last level shown and visible items
            us.endLevel = 3;
            us.visible = [];
            /**
             * Find currenly selected items to determine what to show
             * and what the last visible level is
             */
            var _findSelected = function(items)
            {
                var selected = 0;
                $.each(items, function(i, item)
                {
                    // Push current item
                    us.visible.push(item);
                    // Selected - so also plot all children
                    if(item.selected)
                    {
                        selected++;
                        if(item.hasOwnProperty('children'))
                        {
                            _findSelected(item.children);
                        }
                    }
                    // If more than 1 selected at this level - don't show children
                    if(selected > 1)
                    {
                        us.endLevel = items[0].level;
                    }
                });
            };
            _findSelected(us.filter);
        };

        /**
         * Plot the filter
         */
        HexFilter.prototype._plotFilter = function()
        {
            var us = this;
            
            /**
             * Plot connecting circles for desktop or mobile
             */
            var _circles = function(items, vertical)
            {

                // If the current item has no children - return
                if(items.length == 0 || !items[0].hasOwnProperty('children'))
                {
                    return;
                }
                // Determine the current child and parent levels and check
                // they should be shown
                var parentLevel = items[0].level;
                var childLevel = parentLevel + 1;
                if(us.endLevel <= parentLevel)
                {
                    return;
                }
                // Determine selection extents (what circles to plot)
                var firstSelectedChild = -1;
                var lastSelectedChild = -1;
                var selectedParent = -1;
                var childCount = -1;
                // Child object and subject
                var child = null;
                var subject = null;
                // Get the extents based on parent position and children count and selections
                for(var i = 0; i < items.length; i++)
                {
                    if(items[i].selected)
                    {
                        selectedParent = i;
                        subject = items[i].subject;
                        child = items[i].children;
                        childCount = child.length;
                        // Determine extent of selected children     
                        for(var j = 0; j < child.length; j++)
                        {
                            if(child[j].selected)
                            {
                                if(firstSelectedChild === -1)
                                {
                                    firstSelectedChild = j;
                                }
                                lastSelectedChild = j;
                            }
                            
                        }
                    }
                }
                // If no parent selected - don't draw any lines to children
                if(selectedParent === -1)
                {
                    return;
                }
                
                // Vertical lines
                if(vertical)
                {
                    // Do top level items
                    if(parentLevel === 1)
                    {
                        var circles = (selectedParent * 11);
                        var startX = us._dotGap * 3;
                        var startY = us._dotGap * 7.5;
                        for(var i = 0; i <= circles; i++)
                        {
                            us._element.find("#hexfilter-svg").append(svgEl("circle").attr({'cx':((startX + (us._dotGap * i)) + us._dotRadius - 1), 
                                                                             'cy':(startY + us._dotRadius - 1), 
                                                                             'r':us._dotRadius}).attr('class',subject));
                        }
                        us._element.find("#hexfilter-svg").append(svgEl("circle").attr({'cx':(startX + us._dotRadius - 1), 
                                                                             'cy':(startY + us._dotGap + us._dotRadius - 1), 
                                                                             'r':us._dotRadius}).attr('class',subject));
                    }
                    var minCircle = (parentLevel === 1) ? 0 : 3;
                    var maxCircle = (us._mobParentPos[selectedParent] > us._mobChildPos[childCount - 1]) ? us._mobParentPos[selectedParent] : us._mobChildPos[childCount - 1];
                    // Get max and min rendered 'coloured' circles joining selections
                    if(lastSelectedChild !== -1)
                    {
                        if(parentLevel === 2)
                        {
                            var maxColourCircle =  (us._mobParentPos[selectedParent] > us._mobChildPos[lastSelectedChild]) ? us._mobParentPos[selectedParent] : us._mobChildPos[lastSelectedChild];
                        }
                        else
                        {
                            maxColourCircle = us._mobChildPos[lastSelectedChild];
                        }
                    }
                    else
                    {
                        maxColourCircle = 0;
                    }
                    if(firstSelectedChild !== -1)
                    {
                        if(parentLevel === 2)
                        {
                            var minColourCircle = (us._mobParentPos[selectedParent] < us._mobChildPos[firstSelectedChild]) ? us._mobParentPos[selectedParent] : us._mobChildPos[firstSelectedChild];
                        }
                        else
                        {
                            minColourCircle = 0;
                        }
                    }
                    else
                    {
                        minColourCircle = 999;
                    }
                     // Plot 'drop across' from parent
                    if(parentLevel === 2)
                    {
                       
                        var startX = 12 * us._dotGap;
                        var startY = (us._dotGap * 12.5) + (selectedParent * us._dotGap * 8);
                        us._element.find("#hexfilter-svg").append(svgEl("circle").attr({'cx':(startX + us._dotRadius - 1), 'cy':(startY + us._dotRadius - 1), 'r':us._dotRadius}).attr('class',subject));
                    }
                    // Plot 'vertical' circles
                    var startY = (9.5 + minCircle) * us._dotGap;
                    var startX = (parentLevel === 1) ? (us._dotGap * 3) : (us._dotGap * 13); 
                    for(var i = minCircle; i <= maxCircle; i++, startY = startY + us._dotGap)
                    {
                        var klass = subject;
                        if(i < minColourCircle || i > maxColourCircle)
                        {
                            klass = 'grey';
                        }
                        us._element.find("#hexfilter-svg").append(svgEl("circle").attr({'cx':(startX + us._dotRadius - 1), 'cy':(startY + us._dotRadius - 1), 'r':us._dotRadius}).attr('class',klass));
                    }
                    
                    // Plot drop across to children from vertical
                    for(var i = 0; i < child.length; i++)
                    {
                        var klass = (child[i].selected) ? subject : 'grey';
                        var startX = (parentLevel === 1) ? (us._dotGap * 4) : (us._dotGap * 14);
                        var startY =  (us._dotGap * 12.5) + (i * us._dotGap * 8);
                        us._element.find("#hexfilter-svg").append(svgEl("circle").attr({'cx':(startX + us._dotRadius - 1), 'cy':(startY + us._dotRadius - 1), 'r':us._dotRadius}).attr('class',klass));

                    }
                }
                
                // Horizontal Lines
                else
                {
                    // Extent of 'line' and coloured portion
                    // Get max and min rendered circles
                    var minCircle = 0;
                    var maxCircle = (us._deskParentPos[selectedParent] > us._deskChildPos[childCount - 1]) ? us._deskParentPos[selectedParent] : us._deskChildPos[childCount - 1];
                    // Get max and min rendered 'coloured' circles joining selections
                    if(lastSelectedChild !== -1)
                    {
                        var maxColourCircle =  (us._deskParentPos[selectedParent] > us._deskChildPos[lastSelectedChild]) ? us._deskParentPos[selectedParent] : us._deskChildPos[lastSelectedChild];
                    }
                    else
                    {
                        maxColourCircle = 0;
                    }
                    if(firstSelectedChild !== -1)
                    {
                        var minColourCircle = (us._deskParentPos[selectedParent] < us._deskChildPos[firstSelectedChild]) ? us._deskParentPos[selectedParent] : us._deskChildPos[firstSelectedChild];
                    }
                    else
                    {
                        minColourCircle = 999;
                    }
                    // Plot 'drop down' from parent
                    var startX = (3 + us._deskParentPos[selectedParent]) * us._dotGap;
                    var startY = (parentLevel- 1) * (us._height + (us._dotGap * us._deskVertical)) + (us._dotGap * 3 / 4) + us._height;
                    for(var i = 0; i < 2; i++, startY = startY + us._dotGap)
                    {
                        us._element.find("#hexfilter-svg").append(svgEl("circle").attr({'cx':(startX + us._dotRadius - 1), 'cy':(startY + us._dotRadius - 1), 'r':us._dotRadius}).attr('class',subject));
                    }
                    // Plot 'horizontal' circles
                    var startX = (3 + minCircle) * us._dotGap;
                    for(var i = minCircle; i <= maxCircle; i++, startX = startX + us._dotGap)
                    {
                        var klass = subject;
                        if(i < minColourCircle || i > maxColourCircle)
                        {
                            klass = 'grey';
                        }
                        us._element.find("#hexfilter-svg").append(svgEl("circle").attr({'cx':(startX + us._dotRadius - 1), 'cy':(startY + us._dotRadius - 1), 'r':us._dotRadius}).attr('class',klass));
                    }
                    startY += us._dotGap;

                    // Plot drop downs to children from horizotal
                    for(var i = 0; i < child.length; i++)
                    {
                        var klass = (child[i].selected) ? subject : 'grey';
                        if(i === 0)
                        {
                            var startX = (3 + minCircle) * us._dotGap;
                            var dropY = startY;
                            for(var j = 0; j < 2; j++, dropY = dropY + us._dotGap)
                            {
                                us._element.find("#hexfilter-svg").append(svgEl("circle").attr({'cx':(startX + us._dotRadius - 1), 'cy':(dropY + us._dotRadius - 1), 'r':us._dotRadius}).attr('class',klass));
                            }
                        }
                        else
                        {
                            var startX = ((3 + us._deskChildPos[i]) * us._dotGap) + (us._dotGap * 0.6);
                            var dropY = startY - (us._dotGap * 0.1);
                            for(var j = 0; j < 3; j++, dropY = dropY + (us._dotGap * 0.9), startX = startX + (us._dotGap * 0.6))
                            {
                                us._element.find("#hexfilter-svg").append(svgEl("circle").attr({'cx':(startX + us._dotRadius - 1), 'cy':(dropY + us._dotRadius - 1), 'r':us._dotRadius}).attr('class',klass));
                            }
                        }
                    }
                }
                // Plot horizontal lines for next row down
                _circles(child, vertical);
            };
            
            // CLear
            us._element.find("#hexfilter-text, #hexfilter-svg").empty();
            // Work out exactly which items we are plotting
            // by walking tree and finding 'selected' items
            this._determineVisibility();
            
            // Text
            var select = d3.select(us._element.find('#hexfilter-text')[0]).selectAll("path")
            .data(this.visible).enter();
            var divs = select.append("div");
            // Inner content of divs
            divs.each(function(d,i)
            {
                // Set base size and classes
                $(this).addClass('ru-hex-filter-back-'+d.symbol)
                        .css({'top':(d.position.y)+'px', left:(d.position.x)+'px', width:(us._width)+'px', height:(us._height)+'px'})
                        .attr({'data-item':i})
                        .addClass('ru-hex-filter-item')
                        .addClass(d.selected ? 'enabled' : 'disabled')
                        .addClass(d.enabled ? '' : 'inactive')
                        .addClass(d.level > us.endLevel ? ' hide' : '');
                if(d.enabled)
                {
                    $(this).attr('tabindex', '0');
                    $(this).bind('keydown', function(e)
                    {
                        if(e.which === 13)
                        {
                            var selectedItem = us.visible[parseInt($(this).attr('data-item'))];
                            if(selectedItem.enabled)
                            {
                                selectedItem.selected = !selectedItem.selected;
                                us.ReDraw();
                            }
                        }
                    });
                }
                // Name
                var item = us._element.find('[data-item='+i+']');

                // A name is small if any word > 10
                var small = false;
                var split = d.title.split(' ');
                for(var i = 0; i < split.length; i++)
                {
                    if(split[i].length > 10)
                    {
                        small = true;
                        break;
                    }
                }
                // Add title
                $(item).append("<div width='100%' class='ru-hex-filter-name "
                        +(d.enabled ? '' : ' inactive ')
                        +(small ? 'ru-hex-filter-name-small' : '')
                        +"'><p>"+d.title+"</p>"+
                        (d.comingSoon ? '<p class="ru-hex-filter-inactive-text">Coming Soon</p>' : '')
                        +"</div>");

                if (d.warning) {
                    $(item).append("<div tabindex='0' title='" + d.warning + "' class='hex-filter-warning'></div>");
                }

                /*
                // Add percentage
                $(item).append("<div class='ru-hex-filter-circle "+
                        (d.percent === 0 ? 'ru-hex-filter-circle-zero' : (d.percent === 100 ? 'ru-hex-filter-circle-hundred' : ''))+
                        "'><div><p>"+(d.percent === 100 ? '' : d.percent+'%')+"</p></div></div>");
                */
            });
            
            // Hexagons
            var _hexagons = d3.select(us._element.find('#hexfilter-svg')[0]).selectAll("path")
                        .data(this.visible).enter();
            // Basic D3 Line function
            var lineFunction = d3.svg.line()
                             .x(function(d) { return d.x; })
                             .y(function(d) { return d.y; })
                             .interpolate("linear");   
            // PLot hexagons and plot click handler
            _hexagons.append("path")
                .attr("d", function(d)
                {
                    var hex = hexagon.calculateHexagon(us._width, us._aspect, {x:d.position.x+1, y:d.position.y});
                    return lineFunction(hex.hexagon);
                }).attr("class", function(d)
                {
                    return d.subject+' '+
                            (d.selected ? 'enabled' : 'disabled')+' '+
                            (d.enabled ? '' : 'inactive')+
                            (d.level > us.endLevel ? ' hide' : '');
                }).attr('data-item', function(d, i)
                {
                    return i;
                }).each(function(d)
                {
                    $(this).click(function()
                    {
                        var selectedItem = us.visible[parseInt($(this).attr('data-item'))];
                        if(selectedItem.enabled)
                        {
                            selectedItem.selected = !selectedItem.selected;
                            us.ReDraw();
                        }
                    });
                });
            // Circles
            _circles(this.filter, this.isVertical);
        };
        
        /**
         * Position hexagons for horizontal case
         */
        HexFilter.prototype._calculateHorizontalPositions = function()
        {
            var us = this;
            // Position children recursively
            var setPositions = function(items)
            {
                $.each(items, function(i, item)
                {
                    var y = (item.level - 1) * (us._height + (us._dotGap * us._deskVertical));
                    var x = i * (us._dotGap * us._deskHoriz);
                    item.position = {x:x,y:y};
                    if(item.hasOwnProperty('children'))
                    {
                        setPositions(item.children);
                    }
                });
            };
            setPositions(this.filter);
        };
        
        /**
         * Position hexagons for vertical case
         */
        HexFilter.prototype._calculateVerticalPositions = function()
        {
            var us = this;
            // Position children recursively
            var setPositions = function(items)
            {
                $.each(items, function(i, item)
                {
                    // First level is different
                    if(item.level === 1)
                    {
                        var y = 0;
                        var x = i * (us._dotGap * 11);
                    }
                    else
                    {
                        y = ((i + 1) * (us._dotGap * 8)) + us._dotGap;
                        x = (item.level === 2) ? (us._dotGap * 5) : (us._dotGap * 15);
                    }
                    item.position = {x:x,y:y};
                    if(item.hasOwnProperty('children'))
                    {
                        setPositions(item.children);
                    }
                });
            };
            setPositions(this.filter);  
        };

        /**
         * Process the raw data to add level, parent references
         * @param {Number} level
         * @param {Array} items
         * @param {Object} parent
         */
        HexFilter.prototype._addLevelsAndParents = function(level, items, parent)
        {
            var us = this;
            $.each(items, function(i, item)
            {
                item.level = level;
                item.parent = parent;
                if(item.hasOwnProperty('children'))
                {
                    us._addLevelsAndParents(level + 1, item.children, item);
                }
            });
        };

        /**
         * Process filter to determine what to show where and to indicate selected items
         * to user code
         */
        HexFilter.prototype._processFilter = function()
        {
            // Add in 'level' and positions
            this._addLevelsAndParents(1, this.filter, null);
            // Calculate positions
            if(this.isVertical)
            {
               this._calculateVerticalPositions();
            }
            else
            {
               this._calculateHorizontalPositions();
            }
        };
        
        /**
         * Set filter as vertical or horizontal
         * @param {Boolean} vertical
         */
        HexFilter.prototype.EnableVertical = function(vertical)
        {
            this.isVertical = vertical;
        };
        
        /**
         * Set the selection and call selection callback
         */
        HexFilter.prototype._setSelected = function()
        {
            // Clear currently selected
            var us = this;
            us.selected = [];
            $.each(us.visible, function()
            {
                if(this.enabled && this.level <= us.endLevel)
                {
                    us.selected.push(this);
                }
            });
            this.change(us.selected);
        };
        
        /**
         * Re process and redraw the filter, calls selection call back
         * on completion if required
         */
        HexFilter.prototype.ReDraw = function(dontRaiseSelect)
        {
            this._processFilter();
            this._plotFilter();
            if(!dontRaiseSelect)
            {
                this._setSelected();
            }
        };
        
        return HexFilter;
    }
);
