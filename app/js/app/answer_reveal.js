/**
 * jQuery code to enable all answer reveal panels
 */
define(['jquery'],
    function($) 
    {  
        $(function()
        {
           // If 'show answer' clicked - reveal answer
           $(".ru_answer_reveal div:first-child").click(function()
           {
               $(this).next("div").show();
           });
           // If close clicked - hide answer
           $(".ru_answer_close").click(function()
           {
               $(this).parent().hide();
           });
        });
    }
);
