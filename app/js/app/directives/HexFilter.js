define(["app/honest/hex_filter"], function(HexFilter) {


	return ["$state", function($state) {

		return {

			scope: {
				subjects: "=",
				fields: "=",
				topics: "=",
			},

			restrict: "A",

			templateUrl: "/partials/hex_filter.html",

			link: function(scope, element, attrs) {

				var config = 
				[
				  {title:"Maths", active:true, subject:'maths', percent:65, enabled:false, symbol:'maths', id:"maths",
				      children:
				      [
				        {title:"Geometry", active:true, subject:'maths', percent:35, enabled:false, symbol:'geometry', id:"geometry",
				            children:
				            [
				                {title:"Vectors", active:true, subject:'maths', percent:0, enabled:false, symbol:'mechanics', id:"vectors"},
				                {title:"Trigonometry", active:true, subject:'maths', percent:100, enabled:false, symbol:'mechanics', id:"trig"},
				                {title:"Greek", active:true, subject:'maths', percent:0, enabled:false, symbol:'mechanics', id:"greek"},
				                {title:"Symmetry", active:true, subject:'maths', percent:5, enabled:false, symbol:'mechanics', id:"symmetry"}
				            ]},
				        {title:"Calculus", active:true, subject:'maths', percent:10, enabled:false, symbol:'calculus', id:"calculus",
				            children:
				            [
				            ]},
				       	{title:"Algebra", active:true, subject:'maths', percent:0, enabled:false, symbol:'algebra', id:"algebra",
							children:
							[
							]},
				       	{title:"Functions", active:true, subject:'maths', percent:0, enabled:false, symbol:'functions', id:"functions",
				            children:
				            [
				            ]},
				       	{title:"Probability", active:true, subject:'maths', percent:0, enabled:false, symbol:'maths', id:"probability",
				            children:
				            [    
				            ]}
				      ]
				  },
				  {title:"Physics", active:true, subject:'physics', percent:25, enabled:true, symbol:'mechanics', id:"physics",
				      children:
				      [
				          {title:"Mechanics", active:true, subject:'physics', percent:35, enabled:true, symbol:'mechanics', id:"mechanics",
				            children:
				            [
				                {title:"Statics", active:true, subject:'physics', percent:0, enabled:false, symbol:'mechanics', id:"statics",},
				                {title:"Dynamics", active:true, subject:'physics', percent:100, enabled:true, symbol:'mechanics', id:"dynamics",},
				                {title:"SHM", active:true, subject:'physics', percent:0, enabled:false, symbol:'mechanics', id:"shm",},
				                {title:"Angular Motion", active:true, subject:'physics', percent:5, enabled:false, symbol:'mechanics', id:"angular_motion",},
				                {title:"Circular Motion", active:true, subject:'physics', percent:0, enabled:true, symbol:'mechanics', id:"circular_motion",},
				                {title:"Kinematics", active:true, subject:'physics', percent:0, enabled:false, symbol:'mechanics', id:"kinematics",}
				            ]},
							{title:"Waves", active:false, subject:'physics', percent:0, enabled:false, symbol:'mechanics', id:"waves",
								children:
								[
								]},
							{title:"Fields", active:false, subject:'physics', percent:0, enabled:false, symbol:'mechanics', id:"fields",
								children:
								[
								]},
							{title:"Electric Circuits", active:false, subject:'physics', percent:0, enabled:false, symbol:'mechanics', id:"circuits",
								children:
								[
								]},
				      ]
				  }
				];

			    var hexFilter = new HexFilter(element, {
			        // Replace with real function to get state
			        get: function(callback) {
			        	callback(config);
			        },

			        // Does nothing - replace as required
			        change:function(items)
			        {
			        	var selectedItems = [[],[],[]];

			        	function walk(depth, obj) {
			        		if (obj.enabled) {
			        			selectedItems[depth].push(obj.id);
			        		}

			        		if (obj.children) {
				        		$.each(obj.children, function(i, child) {
				        			walk(depth + 1, child);
				        		});
				        	}
			        	}
			        	walk(0,config[0]);
			        	walk(0,config[1]);
			        	
			        	var subjects = selectedItems[0];
			        	var fields = selectedItems[1];
			        	var topics = selectedItems[2];

			        	scope.subjects.length = 0;
			        	scope.fields.length = 0;
			        	scope.topics.length = 0;

			        	Array.prototype.push.apply(scope.subjects,subjects);
			        	if (subjects.length < 2)
			        		Array.prototype.push.apply(scope.fields,fields);
			        	if (subjects.length < 2 && fields.length < 2)
			        		Array.prototype.push.apply(scope.topics,topics);

			        	// TODO: Fix the error that this causes when executed while $digest is currently in progress.
					  	scope.$apply();
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

			    // TODO: Update config when scope.subjects, scope.fields, scope.topics change.
			}
		};
	}]

});