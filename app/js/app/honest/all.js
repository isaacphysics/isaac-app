define("all",
    [ 'jquery',
      'modernizr',
      'foundation.core',
      'fastclick',
      'responsive_video',
      'foundation.tables',
      'dropdown',
      'answer_reveal',
      'desktop_search',
      'scroll_to',
      'visible',
      'mathjax'],
    /** 
    * Global initialisation
    * @params from require
    * @exports all
    * @version 1.0
    */
    function($, Modernizr, Foundation, FastClick, rv) 
    {   
        
        // Make all videos responsive
        rv.updateAll();
        
        // Global foundation initialisation
        $(document).foundation({
            // Queries for retina images for data interchange
            interchange:
            {
                named_queries :
                {
                    small_retina :  'only screen and (min-width: 1px) and (-webkit-min-device-pixel-ratio: 2),'+
                                    'only screen and (min-width: 1px) and (min--moz-device-pixel-ratio: 2),'+
                                    'only screen and (min-width: 1px) and (-o-min-device-pixel-ratio: 2/1),'+
                                    'only screen and (min-width: 1px) and (min-device-pixel-ratio: 2),'+
                                    'only screen and (min-width: 1px) and (min-resolution: 192dpi),'+
                                    'only screen and (min-width: 1px) and (min-resolution: 2dppx)',
                    medium_retina : 'only screen and (min-width: 641px) and (-webkit-min-device-pixel-ratio: 2),'+
                                    'only screen and (min-width: 641px) and (min--moz-device-pixel-ratio: 2),'+
                                    'only screen and (min-width: 641px) and (-o-min-device-pixel-ratio: 2/1),'+
                                    'only screen and (min-width: 641px) and (min-device-pixel-ratio: 2),'+
                                    'only screen and (min-width: 641px) and (min-resolution: 192dpi),'+
                                    'only screen and (min-width: 641px) and (min-resolution: 2dppx)',
                    large_retina :  'only screen and (min-width: 1024px) and (-webkit-min-device-pixel-ratio: 2),'+
                                    'only screen and (min-width: 1024px) and (min--moz-device-pixel-ratio: 2),'+
                                    'only screen and (min-width: 1024px) and (-o-min-device-pixel-ratio: 2/1),'+
                                    'only screen and (min-width: 1024px) and (min-device-pixel-ratio: 2),'+
                                    'only screen and (min-width: 1024px) and (min-resolution: 192dpi),'+
                                    'only screen and (min-width: 1024px) and (min-resolution: 2dppx)'
                }
            }
        });
        
        // Global jQuery
        $(function()
        {
            // Fix ups for iOS
            if((navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i)))
            {
                $('.accordion.ru_accordion dd a.ru_accordion_titlebar .ru_accordion_title').addClass('iphone');
                $('.ru-answer-orbit .ru-answer-orbit-content p').addClass('iphone');
            }
            
            // Fix up for Firefox scroll to
            if (navigator.userAgent.match(/firefox/i))
            {
                $('html').css({overflow:'hidden', height:'100%'});
                $('body').css({overflow:'auto', height:'100%'});
            }
            
            // Safari - accordion titles
            if (navigator.userAgent.search("Safari") >= 0 && navigator.userAgent.search("Chrome") < 0)
            {
                $('.accordion.ru_accordion dd a.ru_accordion_titlebar .ru_accordion_title').addClass('safari');
            }
            
            // Fast click
            FastClick.attach(document.body);
            
            // Mobile login drop down
            $("#mobile-login").click(function(e)
            {
                e.preventDefault();
                $("#mobile-login-form").ruDropDownToggle(this);
            });
            
            // Mobile search drop down
            $("#mobile-search").click(function(e)
            {
                e.preventDefault();
                $("#mobile-search-form").ruDropDownToggle(this);
            });
            
            // Resize slider on tab change (copes with resize when slider tab not visible)
            var sliderResize = function()
            {
                $(".bxslider").each(function()
                {
                    var slider = $(this).data('slider');
                    slider.reloadSlider();
                    var orbit = $(this).closest('.ru-answer-orbit');
                    var item = parseInt($('.ru-answer-orbit-bullets>.active', orbit).attr('data-target'));
                    slider.goToSlide(item);
                });
                // Also - remove iphone override on p carousel text as it is not needed after a change of tab
//                if((navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i)))
//                {
//                    $('.ru-answer-orbit .ru-answer-orbit-content p').removeClass('iphone');
//                }
            };
            
            // Force resize of vidoes on tab change and accordion change
            $(document).foundation(
            {
                tab:{
                    callback : function (tab)
                    {
                        rv.forceResize();
                        sliderResize();
                    }
                }
            }); 
            $(".ru_accordion_titlebar").click(function()
            {
                rv.forceResize();
                sliderResize();
                var clicked_title = this;
                setTimeout(function()
                {
                    // If clicked title bar is not in view - scroll to it
                    if(!$(clicked_title).visible(false))
                    {
                        // Are we on mobile - if so add header height
                        var offset = $('.ru-mobile-header').css('display') === 'block' ? 41 : 0;
                        // Scroll
                        if (navigator.userAgent.match(/firefox/i))
                        {   
                            // FF offset and scroll location are different
                            $('body').scrollTo((-$(clicked_title).offset().top) - $(clicked_title).height());
                        }
                        else
                        {
                            $('body').scrollTo($(clicked_title).offset().top - offset);
                        }
                    }
                }, 0);
            });
            
            // Toggle hide / show of share links
            $(".ru_share").click(function()
            {
                if($(".ru_share_link").width() === 258)
                {
                    $(".ru_share_link").animate({width:0}, {duration:400});
                }
                else
                {
                    $(".ru_share_link").animate({width:260}, {duration:400});
                }
            });
            
            // Image zoom
            $('.ru-mobile-expand div').click(function(e)
            {
                e.preventDefault();
                var url = $(this).parent().find('img').attr('src');
                 window.location.href = url;
            });
            
            // Bug Herd - let jQuery initialise then do it (prevent hold up as much as possible)
            (function(d, t)
            {
                    var bh = d.createElement(t), s = d.getElementsByTagName(t)[0];
                    bh.type = 'text/javascript';
                    bh.src = '//www.bugherd.com/sidebarv2.js?apikey=jcmyostzxmzcsgvrthtvfa';
                    s.parentNode.insertBefore(bh, s);
            })(document, 'script');
            
        });
        
        // Return for pages to do specific things as they wish
        return { $:$, rv:rv};
    }
);


