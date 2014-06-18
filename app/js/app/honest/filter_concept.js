/**
 * Library to handle filter concept
 * Requires jQuery 
 */
define([ 'jquery', 'honest/utils'],
    function($) 
    { 
        /**
         * Initialise a new filter concept tracker
         * @param {Object} options - search:search callback, change:change callback
         * @returns {FilterConcept Object}
         */
        var FilterConcept = function(options)
        {
            options.search = options.search || function(callback) { callback([]);};
            options.change = options.change || function() {};
            this._selected = [];
            var _this = this;
            $("#concept-search-data").ruTrack($('#concept-input'), ['width']);
            $("#concept-search-data, #concept-results").empty();
            $('#concept-input').blur(function()
            {
                setTimeout(function(){$("#concept-search-data").empty();}, 250);
            });
            $('#concept-input').bind('keyup focus', function()
            {
                var val = $(this).val();
                if(val !== '')
                {
                    // Search
                    options.search(val, function(results)
                    {
                        var filtered = [];
                        // Remove selected results from list
                        for(var i = 0; i < results.length; i++)
                        {
                            var obj = results[i];
                            var ok = true;
                            for(var j = 0; j < _this._selected.length; j++)
                            {
                                if(_this._selected[j].name === obj.name && _this._selected[j].subject === obj.subject)
                                {
                                    ok = false;
                                    break;
                                }
                            }
                            if(ok)
                            {
                                filtered.push(obj);
                            }
                        }
                        results = filtered;
                        // Process results add to auto-complete
                        $("#concept-search-data").empty();
                        $.each(results, function(i, result)
                        {
                            $("#concept-search-data").append("<div data-item='"+i+"' class='concept-search-result "+result.subject+"'<div>"+result.name+"</div></div>");
                        });
                        // Click handler for add
                        $("#concept-search-data .concept-search-result").click(function()
                        {
                            // Get item
                            var i = parseInt($(this).attr('data-item'));
                            var item = results[i];
                            _this._selected.push(item);
                            $("#concept-results").append("<div data-item='"+(_this._selected.length - 1)+"' class='concept-search-result "+item.subject+"'><div>"+item.name+"</div></div>");
                            options.change(_this._selected);
                            $("#concept-search-data").empty();
                            // Remove click
                            $("#concept-results .concept-search-result").click(function()
                            {
                                var i = parseInt($(this).attr('data-item'));
                                _this._selected.splice(i, 1);
                                $(this).remove();
                                options.change(_this._selected);
                            });
                        });
                    });
                }
                else
                {
                    $("#concept-search").empty();
                }
            });
        };
        
        FilterConcept.prototype.selected = function()
        {
            return this._selected;
        };
        
        return FilterConcept;
    }
);
