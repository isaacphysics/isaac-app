define(["app/honest/hexagon"],function(hexagon) {

	// TODO: This entire file is a horrible mess. But at least it's an isolated horrible mess.

    // Generic draw function for initial and update
    var draw = function(hex, questions, $state, boardId)
    {
        // Plot
        hexagon.drawHexagons($(".hexagon_wrap"), hex, questions, "ru-hex-home-content", function(plotdiv)
        {
            // Tick / Arrow
            plotdiv.each(function(d) 
            {
                if(d.type === 'isaacWildcard')
                {
                    $(this).addClass('ru-hex-home-content-wild');
                }
                else if(d.state == 'COMPLETED')
                {
                    $(this).addClass('ru-hex-home-content-correct');
                }
            });
            
            // Level indicator
            plotdiv.append('div').each(function(d)
            {
                if(d.type !== 'isaacWildcard')
                {
                    $(this).addClass('ru-hex-level-'+d.level); 
                }
            });
            
            // Symbol
            plotdiv.append('div').each(function(d)
            {
                if(d.type === 'isaacWildcard')
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
                if(d.state === 'COMPLETED')
                {
                    $(this).text('Well Done!').addClass('ru-hex-home-msg-correct');
                }
                else if (d.state === 'TRY_AGAIN')
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

                    if(d.type === 'isaacWildcard')
                    {
                        c = 'hex-orange';   
                    }
                    else if(d.state === 'COMPLETED')
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

	                if (d.type === 'isaacWildcard') {
		                window.location.href = d.url;
	                } else {
		                $state.go("question", {id: d.id, board: boardId});
	                }

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

	return ["$state", "tags", function($state, tags) {

		return {

			scope: {
				questions: "=hexagons",
				wildCard: "=",
				wildCardPosition: "=",
                loading: "=",
                boardId: "=",
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
	            var _aspect = 1.2;
	            // Always false for home hexagons - true used for testing
	            var equalRows = false;

                var update = function() {
                    // Calculate Hexagon info
	                var _width = hexWidth(); // This should be recalculated every time the window is resized
                    var hex = hexagon.calculateAndPositionHexagons($('.hexagon_wrap'), _pad, _width, _aspect, augmentedQuestions || [], equalRows);

                    draw(hex, augmentedQuestions || [], $state, scope.boardId);        

                }

                $(window).on("resize", update);
                scope.$on("$destroy", function() {
                    $(window).off("resize", update);
                })

                var augmentedQuestions = null;

	            scope.$watch("questions", function() {
	            	if (scope.questions) {
                        augmentedQuestions = JSON.parse(JSON.stringify(scope.questions.slice(0)));
	            		$.each(augmentedQuestions, function(i, q) {
				            var subjectTag = tags.getSubjectTag(q.tags);
                            if (!subjectTag) {
                                q.subject = "";
                            } else {
	            				q.subject = subjectTag.id;
	            			}
	            			q.description = q.title;

				            var deepestTag = tags.getDeepestTag(q.tags);

	            			if (!deepestTag) {
                                q.title = "";
                            } else {
	            				q.title = deepestTag.title;
	            			}
	            		});

                        var augmentedWildcard = JSON.parse(JSON.stringify(scope.wildCard));
	            		augmentedQuestions.splice(scope.wildCardPosition, 0, augmentedWildcard);

                        update();
		    		} else {
                        update();
                    }     	
	            })
			}
		};
	}]
})