define(["video"],
    /** 
    * A simple module for making videojs videos responsive.
    * video elements can support a data-aspect element to override the default aspect
    * ratio 16:9. e.g. data-aspect='21:9'
    * @param videojs
    * @exports responsive_video
    * @version 1.0
    */
    function(videojs) 
    {
        return {
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
                        var width = document.getElementById(myPlayer.id()).parentElement.offsetWidth;
                        // Set width to fill parent element, Set height
                        myPlayer.width(width).height( width * aspectRatio );
                    }

                    setTimeout(resizeVideoJS, 0); // Initialize the function
                    us._addEvent(window, 'resize', resizeVideoJS); // Call the function on resize
                });
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

