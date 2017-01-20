/**
 * Copyright 2014 Ian Davies
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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

                if (d.type == "isaacWildcard") {
                    // yes I found urls with spaces in the front of them... I will sanitize both here in the api.
                    var trimmedUrl = d.url.trim();

                    $(this).attr("href", trimmedUrl);
                    $(this).attr("target", "_self");

                    // if this looks like an external link then open in a new tab
                    if (trimmedUrl.indexOf("http://") === 0 || trimmedUrl.indexOf("https://") === 0) {
                        $(this).attr("target", "_blank");
                        $(this).attr("rel", "nofollow");
                    }

                } else {
                    $(this).attr("href", $state.href("question", {id: d.id, board: boardId}));
                    if ($state.current.name == 'gameEditor') {
                        $(this).attr("target", "_blank");
                    }
                }

            });
            
            plotdiv.append('div').each(function(d){
                //$(this).addClass('hex-background');
                if(d.type === 'isaacWildcard')
                {
                    $(this).addClass('ru-hex-home-content-wild');
                }
                else if(d.state == 'PASSED' || d.state == 'PERFECT')
                {
                    $(this).addClass('ru-hex-home-content-correct');
                }

            })
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
                    $(this).addClass('ru-hex-home-field');
                    $(this).addClass('ru-hex-home-field-physics');
                }
                else
                {
                    $(this).addClass('ru-hex-home-field');
                    if(!d.tags) {
                        // check that this hexagon actually has some tags if not just return rather than explode.
                        return; 
                    }

                    if (d.tags.indexOf("mechanics") > -1) {
                        $(this).addClass('ru-hex-home-field-mechanics');
                    } else if (d.tags.indexOf("waves") > -1) {
                        $(this).addClass('ru-hex-home-field-waves');
                    } else if (d.tags.indexOf("fields") > -1) {
                        $(this).addClass('ru-hex-home-field-fields');
                    } else if (d.tags.indexOf("circuits") > -1) {
                        $(this).addClass('ru-hex-home-field-circuits');
                    } else if (d.tags.indexOf("geometry") > -1) {
                        $(this).addClass('ru-hex-home-field-geometry');
                    } else if (d.tags.indexOf("calculus") > -1) {
                        $(this).addClass('ru-hex-home-field-calculus');
                    } else if (d.tags.indexOf("algebra") > -1) {
                        $(this).addClass('ru-hex-home-field-algebra');
                    } else if (d.tags.indexOf("functions") > -1) {
                        $(this).addClass('ru-hex-home-field-functions');
                    } else if (d.tags.indexOf("probability") > -1) {
                        $(this).addClass('ru-hex-home-field-probability');
                    } else if (d.tags.indexOf("chemphysics") > -1) {
                        $(this).addClass('ru-hex-home-field-chemphysics');
                    }
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
                if(d.state === 'PERFECT')
                {
                    $(this).text('Perfect!').addClass('ru-hex-home-msg');
                } else if (d.state === 'PASSED') {
                    $(this).text('Master!').addClass('ru-hex-home-msg');
                }
                else if (d.state === 'FAILED')
                {
                    $(this).text('Try Again!').addClass('ru-hex-home-msg');
                }
                else if (d.state === 'IN_PROGRESS') 
                {
                    $(this).text('In Progress').addClass('ru-hex-home-msg');   
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
                    else if(d.state === 'PASSED' || d.state === 'PERFECT')
                    {
                        c = 'hex-grey';
                    }
                    d.colour = c;
                }
 
                $(this).attr('class',c);


            }); 
            return hexPath;
        },
        function(svg)
        {
            // No specific SVG functions
            return svg;
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

                    // Make background line up with hexagons on desktop.
                    var hexs = $(".hexagon_wrap").find("a");

                    $(".bg-wrap").css("background-position", "");                        
                    if (hexs.size() > 0 && $("footer.hide-for-small-only").is(":visible")) {
                        var maxTop = 0;
                        var minLeft = 9999;
                        hexs.each(function() {
                            maxTop = Math.max(maxTop, $(this).offset().top);
                            minLeft = Math.min(minLeft, $(this).offset().left);
                        })

                        var footerTop = $("footer:visible").offset().top;

                        minLeft = minLeft % 235;

                        var fromFooterTop = (footerTop - maxTop);

                        var offsety = (fromFooterTop % 193);

                        offsety -= 193;

                        var s = "left top, left " + (minLeft - 123) + "px bottom " + Math.round($("footer:visible").outerHeight() + offsety) + "px";

                        $(".bg-wrap").css("background-position", s);
                    }

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
			            augmentedQuestions = null;
                        update();
                    }     	
	            })
			}
		};
	}]
})