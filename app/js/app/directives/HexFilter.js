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

				// This is the internal state object, from which the filter is drawn. Externally, this directive is driven from (and provides)
				// the subjects, fields and topics attributes.
				var config = 
				[
				  {title:"Maths", active:true, subject:'maths', percent:65, enabled:true, symbol:'maths', id:"maths",
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
				  {title:"Physics", active:true, subject:'physics', percent:25, enabled:false, symbol:'mechanics', id:"physics",
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
			        change: function() { }
			    });

	        	// Set this after the hexFilter is constructed so that it doesn't try to change the attributes on initialisation.
			    hexFilter.change = function(items) {
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

			  		scope.$apply();
		        }

			    var hexFilterResize = function()
			    {
			        hexFilter.EnableVertical(element.find('#hexfilter-large').css('display') === 'none');
			        hexFilter.ReDraw(true);
			        element.height(element.find('#hexfilter-large').css('display') === 'none' ? 700 : 450);
			    };

				hexFilterResize(element);

			    // Resize handling for Hex Filter
			    $(window).bind("resize", hexFilterResize);

			    var configChanged = function() {

	    			var visit = function(obj, callback, level) {
	    				if (!level) 
	    					level = 0;

	    				callback(obj, level);

		    			if (obj.children) {
		    				for(var i in obj.children) {
		    					visit(obj.children[i], callback, level + 1);
		    				}
		    			}
	    			}

	    			var disabler = function(minLevel) {
	    				return function(obj, level) {
		    				if (level >= minLevel) {
		    					obj.enabled = scope.fields.indexOf(obj.id) > -1;
		    				}
		    			};
	    			}

	    			// Enable/disable subjects in config object to reflect subjects attribute.
	    			visit(config[0], function(obj, level) {
	    				if (level == 0) {
	    					obj.enabled = scope.subjects.indexOf(obj.id) > -1;
	    				}
	    			})
	    			visit(config[1], function(obj, level) {
	    				if (level == 0) {
	    					obj.enabled = scope.subjects.indexOf(obj.id) > -1;
	    				}
	    			})

			    	if (scope.subjects.length > 1) {

			    		// We have selected multiple subjects. Disable all fields and topics.
			    		var disableTopics = disabler(1);

		    			visit(config[0], disableTopics)
		    			visit(config[1], disableTopics)

			    	} else {

			    		// Enable/disable fields in config object to reflect fields attribute
		    			visit(config[0], function(obj, level) {
		    				if (level == 1) {
		    					obj.enabled = scope.fields.indexOf(obj.id) > -1;
		    				}
		    			})
		    			visit(config[1], function(obj, level) {
		    				if (level == 1) {
		    					obj.enabled = scope.fields.indexOf(obj.id) > -1;
		    				}
		    			})

			    		if (scope.fields.length > 1) {

			    			// We have selected more than one field. Disable all topics.

			    			var disableFields = disabler(2);
			    			visit(config[0], disableFields);
			    			visit(config[1], disableFields);

			    		} else {

			    			// Enable/disable topics in config object to reflect topics attribute
			    			visit(config[0], function(obj, level) {
			    				if (level == 2) {
			    					obj.enabled = scope.topics.indexOf(obj.id) > -1;
			    				}
			    			})
			    			visit(config[1], function(obj, level) {
			    				if (level == 2) {
			    					obj.enabled = scope.topics.indexOf(obj.id) > -1;
			    				}
			    			})

			    		}

			    	}

			    	hexFilterResize();

			    }

			    scope.$watchCollection("subjects", configChanged);
			    scope.$watchCollection("fields", configChanged);
			    scope.$watchCollection("topics", configChanged);

			    configChanged();
			}
		};
	}]

});