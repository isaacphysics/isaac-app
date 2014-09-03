define(["jquery","lib/honest/video"],
    /** 
    * A simple module for making videojs videos responsive.
    * video elements can support a data-aspect element to override the default aspect
    * ratio 16:9. e.g. data-aspect='21:9'
    * @param videojs
    * @exports responsive_video
    * @version 1.0
    */
    function($, videojs) 
    {
        return {
            
            /**
             * List of video objects
             */
            _videos:[],
            /**
             * Cross platform add an event to a DOM object, e.g. window
             * @param {DOM object} obj
             * @param {String} type
             * @param {function} fn
             */
            _addEvent:function (obj, type, fn)
            {
              if (obj.addEventListener) {
                obj.addEventListener(type, fn, false);
              } else if (obj.attachEvent) {
                obj.attachEvent('on' + type, function () {
                  return fn.call(obj, window.event);
                });
            }},
            /**
             * Make the specified video responsive
             * @param {Selector or Element} video
             */
            update: function(video)
            {
                var us = this;
                videojs(video).ready(function()
                {   
                    var myPlayer = this;    // Store the video object
                    var aspectRatio = 9/16; // Make up an aspect ratio (defaults to widescreen)

                    // Try and read aspect ratio
                    var videoElement = document.getElementById(myPlayer.id()).getElementsByTagName('video')[0];
                    if(videoElement !== null && videoElement.hasAttribute('data-aspect'))
                    {
                        var aspectValues = videoElement.getAttribute('data-aspect').split(":");
                        if(aspectValues.length === 2)
                        {
                            aspectRatio = aspectValues[1] / aspectValues[0];
                        }
                    }

                    function resizeVideoJS()
                    {
                        // Get the parent element's actual width
                        var width = $(document.getElementById(myPlayer.id()).parentElement).width();
                        // Set width to fill parent element, Set height
                        myPlayer.width(width).height( width * aspectRatio );
                    }
                    setTimeout(resizeVideoJS, 0); // Initialize the function
                    us._addEvent(window, 'resize', resizeVideoJS); // Call the function on resize
                    us._videos.push({resizeVideoJS:resizeVideoJS, videojs:myPlayer}); // Store call back so we can force resize if needed
                });
            },
            /**
             * Pause all videos (optionally within a given scope)
             * @param {Query Obj} scope - limit pause to children of scope
             */
            pauseVideos: function(scope)
            {
                for(var i = 0; i < this._videos.length; i++)
                {   
                    // Pause if in scope OR if scope not specified
                    if((scope === null || scope === undefined) 
                            || $.contains($(scope).get(0), document.getElementById(this._videos[i].videojs.id())))
                    {
                        this._videos[i].videojs.pause();
                    }
                }
            },
            /**
             * Forces a resize of all videos we know of
             */
            forceResize: function()
            {
                // Just call the previously stored resize callbacks
                for(var i = 0; i < this._videos.length; i++)
                {
                    setTimeout(this._videos[i].resizeVideoJS, 0);
                }
            },
            /**
             * Make all videos (i.e. <video> tags) responsive
             */
            updateAll: function()
            {
                var videos = document.getElementsByTagName('video');
                for(var i = 0; i < videos.length; i++)
                {
                    this.update(videos[i]);
                }
            }
        };
    }
);

