define(["app/honest/hex_filter"], function(HexFilter) {


	return ["$state", function($state) {

		return {

			scope: {
				config: "=hexFilter",
			},

			restrict: "A",

			templateUrl: "/partials/hex_filter.html",

			link: function(scope, element, attrs) {

			    var hexFilter = new HexFilter(element, {
			        // Replace with real function to get state
			        get: function(callback) {
			        	callback(scope.config);
			        },

			        // Does nothing - replace as required
			        change:function(items)
			        {

			        }
			    });

			    var hexFilterResize = function()
			    {
			        hexFilter.EnableVertical(element.find('#hexfilter-large').css('display') === 'none');
			        hexFilter.ReDraw(true);
			        element.height(element.find('#hexfilter-large').css('display') === 'none' ? 680 : 400);
			    };

				hexFilterResize(element);

			    // Resize handling for Hex Filter
			    $(window).bind("resize", function() {
			    	hexFilterResize();
			    });

			    scope.$watch("config", function() {
			    	hexFilterResize();
			    })
			}
		};
	}]

});