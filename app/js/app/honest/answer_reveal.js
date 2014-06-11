/**
 * jQuery code to enable all answer reveal panels
 */
define(['jquery'],
    function($) 
    {  
        $(function()
        {
            var hide = function(item)
            {
                $(item).next("div").hide();
                $(item).removeClass('revealed');
                $(item).text("Show Answer");
            };
            
            var show = function(item)
            {
                $(item).next("div").show();
                $(item).addClass('revealed');
                $(item).text("Hide Answer");
            };
            
           // If 'show answer' clicked - reveal answer
           $(".ru_answer_reveal div:first-child").click(function()
           {
               if($(this).hasClass('revealed'))
               {
                   hide(this);
               }
               else
               {
                   show(this);
               }
               
           });
           // If close clicked - hide answer
           $(".ru_answer_close").click(function()
           {
               hide($(this).parent().parent().find(".revealed"));
           });
        });
    }
);
