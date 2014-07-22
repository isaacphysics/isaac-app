define(["app/honest/hexagon"],function(hexagon) {

	// TODO: This entire file is a horrible mess. But at least it's an isolated horrible mess.

    // Generic draw function for initial and update
    var draw = function(hex, questions, $state)
    {
        // Plot
        hexagon.drawHexagons($(".hexagon_wrap"), hex, questions, "ru-hex-home-content", function(plotdiv)
        {
            // Tick / Arrow
            plotdiv.each(function(d) 
            {
                if(d.type === 'wildcard' && d.state !== 'correct')
                {
                    $(this).addClass('ru-hex-home-content-wild');
                }
                else if(d.state === 'correct')
                {
                    $(this).addClass('ru-hex-home-content-correct');
                }
            });
            
            // Level indicator
            plotdiv.append('div').each(function(d)
            {
                if(d.type !== 'wildcard')
                {
                    $(this).addClass('ru-hex-level-'+d.level); 
                }
            });
            
            // Symbol
            plotdiv.append('div').each(function(d)
            {
                if(d.type === 'wildcard')
                {
                    $(this).addClass('ru-hex-home-chat');
                }
                else
                {
                    $(this).addClass('ru-hex-home-bolt');
                }
            });
            
            // Title
            plotdiv.append('div').text(function(d) { return d.title; }).classed({"ru-hex-home-title" : true});
            
            // Description
            plotdiv.append('div').text(function(d) { return d.description; }).classed({"ru-hex-home-desc" : true});
            
            // Message
            plotdiv.append('div')
                    .classed({"ru-hex-home-msg" : true})
                    .each(function(d)
            {
                if(d.state === 'correct')
                {
                    $(this).text('Well Done!').addClass('ru-hex-home-msg-correct');
                }
                else if (d.state === 'incorrect')
                {
                    $(this).text('Try Again!').addClass('ru-hex-home-msg-incorrect');
                }
            });
            
            return plotdiv;
        },
        function(hexPath)
        {
            // Fill in appropriately by means of CSS class for :hover
            hexPath.each(function(d)
            {
                // Determine colour, and fix for this view (no change of colour on resize)
                var c = '';
                if(d.colour)
                {
                    c = d.colour;
                }
                else
                {
                    var rand = Math.floor((Math.random() * 5) + 1);
                    var c = 'hex-'+d.subject+rand;

                    if(d.type === 'wildcard' && d.state !== 'correct')
                    {
                        c = 'hex-orange';   
                    }
                    else if(d.state === 'correct')
                    {
                        c = 'hex-grey';
                    }
                    d.colour = c;
                }
 
                $(this).attr('class',c);
                $(this).parent().parent().attr('tabindex', 0);
                // Click handler to navigate
                $(this).click(function(e)
                {
                    e.preventDefault();
                    //window.location.href = d.uri;
                    $state.go("question", {id: d.id});

                });
                // Handle tab enter
                $(this).parent().parent().keydown(function(e)
                {
                    if(e.which === 13)
                    {
                        e.preventDefault();
                        //window.location.href = d.uri;
                    }
                });
            }); 
            return hexPath;
        },
        function(svg)
        {
            // No specific SVG functions
            return svg;
        });
        
        // Apply styles
        $.each(['physics','maths'], function(i, name)
        {
            for(var i = 1; i <= 5; i++)
            {
                $('.hex-'+name+i).css('filter','url(#filter'+i+')');
            }
        });
    };

    var wildCard = {
        "title": "Wild Card",
        "uri": "",
        "description": "Q. This is a wild card question",
        "level": 3,
        "type": "wildcard",
        "state": "incorrect",
        "subject": "physics"
    }

	return ["$state", function($state) {

		return {

			scope: {
				questions: "=hexagons",
                wildCardPosition: "="
			},

			restrict: "A",

			templateUrl: "/partials/hexagons.html",

			link: function(scope, element, attrs) {

	            // Get a Hexagon width (differs for mobile)
	            var hexWidth = function()
	            {
	                return $(".ru-mobile-header").css('display') !== 'none' ?  190 : 230;
	            };
            
	            // Constants
	            var _pad = 5;
	            var _width = hexWidth();
	            var _aspect = 1.2;
	            // Always false for home hexagons - true used for testing
	            var equalRows = false;

                var update = function() {
                    // Calculate Hexagon info
                    var hex = hexagon.calculateAndPositionHexagons($('.hexagon_wrap'), _pad, _width, _aspect, scope.questions || [], equalRows);

                    draw(hex, scope.questions || [], $state);        

                }

                $(window).on("resize", update);

	            scope.$watch("questions", function() {
	            	if (scope.questions) {

                        // TODO: Implement this based on the tags service.
	            		$.each(scope.questions, function(i, q) {
                            if (!q.tags) {
                                q.subject = "";
                            } else if (q.tags.indexOf("physics") > -1) {
	            				q.subject = "physics";
	            			} else if (q.tags.indexOf("maths") > -1) {
	            				q.subject= "maths";
	            			}
	            			q.description = q.title;

	            			if (!q.tags) {
                                q.title = "";
                            } else if (q.tags.indexOf("angular_motion") > -1) {
	            				q.title = "Angular Motion";
	            			} else if (q.tags.indexOf("circular_motion") > -1) {
	            				q.title = "Circular Motion";
	            			} else if (q.tags.indexOf("dynamics") > -1) {
	            				q.title = "Dynamics";
	            			} else if (q.tags.indexOf("statics") > -1) {
	            				q.title = "Statics";
	            			} else if (q.tags.indexOf("kinematics") > -1) {
	            				q.title = "Kinematics";
	            			} else if (q.tags.indexOf("shm") > -1) {
	            				q.title = "SHM";
	            			} 
	            		})

	            		scope.questions.splice(scope.wildCardPosition,0,wildCard);
                        update();
		    		} else {
                        update();
                    }     	
	            })
			}
		};
	}]
})