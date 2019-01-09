/**
 * jQuery extensions for:
 * (a) Tracking properties of a given element
 * (b) Tracking position of a given element
 */
define([ 'jquery'],
    function($) 
    {  
        $(function()
        {
            $.fn.extend(
            {
               /**
                * Allow the specified controls to track the CSS of a given control
                * @param {JQuery Object} control
                * @param {Object} options
                * @returns {Array}
                */
               ruTrack: function(control, options)
               {
                   return this.each(function()
                   {
                       let _this = this;
                       var width = 9999999;
                       var set = function(target, $control, _options)
                       {
                           let $target = $(target);
                           var css = {};
                           $.each(_options, function(i, option)
                           {
                               var value = $control.css(option);
                               // Fix up for Safari width bug
                               if(navigator.userAgent.search("Safari") >= 0 && navigator.userAgent.search("Chrome") < 0 && option === 'width')
                               {
                                   if($('html').width() < width)
                                   {
                                       value = parseInt(value) - (parseInt($control.css('padding-left')) + parseInt($control.css('padding-right')));
                                   }
                                   width = $('html').width();
                               }
                               css[option] = value;
                           });
                           $target.css(css);
                       };
                       set(_this, $(control), options);
                       $(window).bind('resize', function() {set(_this, $(control), options)});
                   });   
               },
                /**
                * Allow the specified controls to follow a given control
                * @param {JQuery Object} control
                * @param {Object} options
                * @returns {Array}
                */
               ruFollow: function(control, options) {
                   options.top    = options.top    || 0;
                   options.bottom = options.bottom || 0;
                   options.left   = options.left   || 0;
                   options.right  = options.right  || 0;
                   
                   return this.each(function()
                   {
                       var set = function()
                       {
                           // Not required yet - so unimplemented
                           throw "Not implemented";
                       };
                      
                       set();
                       $(window).bind('resize', set);
                   });
               }        
            });
        });
    }
);


