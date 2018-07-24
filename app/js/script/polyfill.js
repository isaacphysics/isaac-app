// jQuery Pollyfill for Foundation and other dependencies which require an older version of jQuery
jQuery.fn.load = function(callback){ $(window).on("load", callback) };
jQuery.fn.andSelf = jQuery.fn.addBack;