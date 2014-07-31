define(["app/honest/hex_filter"], function(HexFilter) {


	return ["$state", "tags", function($state, tags) {

		return {

			scope: {
				subjects: "=",
				fields: "=",
				topics: "=",
			},

			restrict: "A",

			templateUrl: "/partials/hex_filter.html",

			link: function(scope, element, attrs) {

				// We have a flat list of tags, but the HexFilter requires a hierarchical structure. Build it here.
				var buildHexFilterState = function(tags) {
					tags = JSON.parse(JSON.stringify(tags));

					// TODO: Be sure to check whether Array.prototype.filter polyfill is necessary.

					// For some reason the filter predicate sometimes gets called with a null argument. Weird. Hence the "t && ..."

					var subjects = tags.filter(function(t) { return t && !t.parent; });

					for (var i in subjects) {
						var s = subjects[i];

						s.enabled = !s.comingSoon && s.enabled !== false;
						s.selected = false;
						s.subject = s.id;

						s.children = tags.filter(function(t) { return t && t.parent == s.id; });

						for (var j in s.children) {
							var f = s.children[j];

							f.enabled = !f.comingSoon && f.enabled !== false;
							f.selected = false;
							f.subject = s.id;

							f.children = tags.filter(function(t) { return t && t.parent == f.id; });

							for (var k in f.children) {
								var t = f.children[k];

								t.enabled = !t.comingSoon && t.enabled !== false;
								t.selected = false;
								t.subject = s.id;
							}
						}
					}

					return subjects;

				}

				var config = buildHexFilterState(tags);

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
		        		if (obj.selected) {
		        			selectedItems[depth].push(obj.id);
		        		}

		        		if (obj.children) {
			        		$.each(obj.children, function(i, child) {
			        			walk(depth + 1, child);
			        		});
			        	}
		        	}

		        	function walkAll(arr) {
		        		for(var i in arr) {
		        			walk(0, arr[i]);
		        		}
		        	}
		        	walkAll(config);

		        	console.debug("Selected Items", selectedItems);
		        	
		        	var subjects = selectedItems[0];
		        	var fields = selectedItems[1];
		        	var topics = selectedItems[2];

		        	scope.subjects.length = 0;
		        	scope.fields.length = 0;
		        	scope.topics.length = 0;

		        	Array.prototype.push.apply(scope.subjects,subjects);
		        	if (subjects.length == 1)
		        		Array.prototype.push.apply(scope.fields,fields);
		        	if (subjects.length == 1 && fields.length == 1)
		        		Array.prototype.push.apply(scope.topics,topics);

			  		scope.$apply();
		        }

			    var hexFilterResize = function()
			    {
			        hexFilter.EnableVertical(element.find('#hexfilter-large').css('display') === 'none');
			        hexFilter.ReDraw(true);
			        element.height(element.find('#hexfilter-large').css('display') === 'none' ? 740 : 450);
			    };

				hexFilterResize(element);

			    // Resize handling for Hex Filter
			    $(window).bind("resize", hexFilterResize);

			    // Deal with external changes to the selected subjects, fields and topics.
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

	    			var visitAll = function(arr, callback) {
	    				for (var i in arr) {
	    					visit(arr[i], callback);
	    				}
	    			}

	    			var deselector = function(minLevel) {
	    				return function(obj, level) {
		    				if (level >= minLevel) {
		    					obj.selected = false;
		    				}
		    			};
	    			}

	    			// Select/deselect subjects in config object to reflect subjects attribute.
	    			visitAll(config, function(obj, level) {
	    				if (level == 0) {
	    					obj.selected = scope.subjects.indexOf(obj.id) > -1;
	    				}
	    			})

			    	if (scope.subjects.length > 1) {

			    		// We have selected multiple subjects. Deselect all fields and topics.
			    		var deselectTopics = deselector(1);

		    			visitAll(config, deselectTopics)

			    	} else {

			    		// Select/deselect fields in config object to reflect fields attribute
		    			visitAll(config, function(obj, level) {
		    				if (level == 1) {
		    					obj.selected = scope.fields.indexOf(obj.id) > -1;
		    				}
		    			})

			    		if (scope.fields.length > 1) {

			    			// We have selected more than one field. Deselect all topics.

			    			var deselectFields = deselector(2);
			    			visitAll(config, deselectFields);

			    		} else {

			    			// Select/deselect topics in config object to reflect topics attribute
			    			visitAll(config, function(obj, level) {
			    				if (level == 2) {
			    					obj.selected = scope.topics.indexOf(obj.id) > -1;
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