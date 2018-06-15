/**
 * Library to handle difficulty filter
 * Requires jQuery 
 */
define([ 'jquery', './hexagon', 'd3'],
    function($, hexagon, d3) 
    { 
        /**
         * Initialise a new difficulty filter
         * @param {Object} options - get:get current settings callback, change:change callback
         * @returns {FilterConcept Object}
         */
        var Difficulty = function(element, options)
        {
            var us = this;
            options.get    = options.get    || function(callback) { callback([]);};
            options.change = options.change || function() {};
            // Constants
            var _pad = 4;
            var _width = 68;
            var _aspect = 1.2;
           
            us.plotHexagons = function(state)
            {
                // Calculate Hexagon info
                var hex = hexagon.calculateAndPositionHexagons(element.find('#difficulty-hexagons'), _pad, _width, _aspect, state, true);
                
                // Plot
                hexagon.drawHexagons(element.find("#difficulty-hexagons"), hex, state, "ru-diff-hex", function(plotdiv)
                {
                    plotdiv.each(function(d){
                        $(this).attr("href", "javascript:void(0)");

                        $(this).click(function(e) {
                            e.preventDefault();
                            // Change state if needed
                            for(var i = 0; i < state.length; i++)
                            {
                                if(state[i].level === parseInt($('path', $(this)).attr('data-level')) && state[i].enabled)
                                {
                                    state[i].selected = !state[i].selected;
                                }
                            }
                            // Plot and call change callback
                            us.plotHexagons(state);
                            options.change(state);
                        })
                    })
                    // Title
                    plotdiv.append('div').text(function(d) { return d.level; }).each(function(d) 
                    {
                        var klass = 'diff-hex-disabled';
                        if(d.enabled)
                        {
                            klass = d.selected ? 'diff-hex-selected' : 'diff-hex-unselected';
                        }
                        $(this).attr('class',klass);
                    });
                    
                     // Level indicator
                    plotdiv.append('div').each(function(d)
                    {
                        if(!d.selected)
                        {
                            $(this).addClass('ru-diff-hex-level-'+d.level); 
                        }
                    });
                    return plotdiv;
                },
                function(hexPath)
                {
                    // Fill in appropriately by means of CSS class for :hover
                    hexPath.each(function(d)
                    {
                        var klass = 'diff-hex-disabled';
                        if(d.enabled)
                        {
                            klass = d.selected ? 'diff-hex-selected' : 'diff-hex-unselected';
                        }
                        $(this).attr('class',klass).attr('data-level', d.level);
                    }); 
                    return hexPath;
                },
                function(svg)
                {
                    // No specific SVG functions
                    return svg;
                });
                
            };
            options.get(function(state)
            {
                us.plotHexagons(state);
            });
            
            
        };
        
        return Difficulty;
    }
);
