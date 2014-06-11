/**
 * jQuery code to reveal desktop search and hide again
 */
define([ 'jquery'],
    function($) 
    {  
        $(function()
        {
            // Is the border for the desktop arrow showing?
            var _hasArrow = false;
            var show = function()
            {
                // Hide arrow block if visible
                _hasArrow = $('.ru-desktop-panel').hasClass('ru-panel-arrow-block');
                $('.ru-desktop-panel').removeClass('ru-panel-arrow-block');
                // Hide any '<'
                $(".ru-panel-arrow").hide();
                // Hide search button and existing panel content
                $(".ru-desktop-panel-content, .ru-desktop-panel-search").hide();
                // Remove previous search content and append clean content
                $(".ru-desktop-search").appendTo(".ru-desktop-panel");
                // Disable Z-index on title bar
                $(".ru-desktop-nav-item-inner.active").addClass("ru-desktop-menu-noz-active");
                // Show close button
                $(".ru-desktop-panel-search-close").show();
                
            };
            
            var hide = function()
            {
                // Hide close button
                $(".ru-desktop-panel-search-close").hide();
                // Disable Z-index on title bar
                $(".ru-desktop-nav-item-inner.active").removeClass("ru-desktop-menu-noz-active");
                // Remove search content
                $(".ru-desktop-search").appendTo(".ru-desktop-panel-search");
                // Show search button and existing panel content
                $(".ru-desktop-panel-content, .ru-desktop-panel-search").show();
                // Show any '<'
                $(".ru-panel-arrow").show();
                // Show arrow block if needed
                if(_hasArrow)
                {
                    $('.ru-desktop-panel').addClass('ru-panel-arrow-block');
                }
            };
            
            // Show search
            $(".ru-desktop-panel-search a").click(function(e)
            {
                e.preventDefault();
                show();
            });
            
            // Hide search
            $(".ru-desktop-panel-search-close").click(function(e)
            {
                e.preventDefault();
                hide();
            });
        });
    }
);
