/**
 * jQuery extensions for mobile top of the screen drop downs, for use in conjunction with
 * css/_mobilemenus.scss
 */
define([ 'jquery'],
    function($) 
    {  
        $(function()
        {
            $.fn.extend(
            {
               /**
                * Toggle the visibilty (with animation) of the first element provided
                * @returns chained JQuery objects
                */
               ruDropDownToggle: function(control)
               {
                   return this.each(function()
                   {
                       // If shown - hide
                       if($(this).hasClass('ru-drop-show'))
                       {
                           $(this).ruDropDownHide(control);
                       }
                       // Else show
                       else
                       {
                           $(this).ruDropDownShow(control);
                       }
                       return false;
                   });   
               },
               /**
                * Hide (with animation) the first element provided
                * @returns chained JQuery objects
                */
               ruDropDownHide: function(_control)
               {
                   return this.each(function()
                   {
                       // To hide - add hide animation class and remove show animation class
                       $(this).addClass('ru-drop-hide').removeClass('ru-drop-show');
                       $('.ru-mobile-down').removeClass('ru-mobile-up');
                       // Once
                       return false;
                   });
               },
               /**
                * Show (with animation) the first element provided, it will
                * also hide any existing shown items (with animation)
                * @returns chained JQuery objects
                */
               ruDropDownShow: function(control)
               {
                   return this.each(function()
                   {
                       // Get list of thinfs shown
                       var shown = $(".ru-drop-show");
                       var toShow = this;
                       // If anything is shown, hide first, then after a delay show
                       // what we want to show
                       if(shown.length > 0)
                       {
                           $(shown).ruDropDownHide(control);
                           setTimeout(function()
                           {
                               $(toShow).ruDropDownShow(control);
                           }, 600);
                       }
                       // Else - just show it
                       else
                       {
                           $(toShow).addClass('ru-drop-show').removeClass('ru-drop-hide');
                           $('.ru-mobile-down', control).addClass('ru-mobile-up');
                       }
                       return false;
                   });
               }        
            });
        });
    }
);
