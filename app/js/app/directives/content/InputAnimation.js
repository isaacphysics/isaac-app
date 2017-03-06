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
define([], function() {
    /**
     * Animated Radio Buttons
     * Recommened by Honest, from: http://tympanus.net/codrops/2013/10/15/animated-checkboxes-and-radio-buttons-with-svg/
     */
    var pathDefs = {
        fill: ['M15.833,24.334c2.179-0.443,4.766-3.995,6.545-5.359 c1.76-1.35,4.144-3.732,6.256-4.339c-3.983,3.844-6.504,9.556-10.047,13.827c-2.325,2.802-5.387,6.153-6.068,9.866 c2.081-0.474,4.484-2.502,6.425-3.488c5.708-2.897,11.316-6.804,16.608-10.418c4.812-3.287,11.13-7.53,13.935-12.905 c-0.759,3.059-3.364,6.421-4.943,9.203c-2.728,4.806-6.064,8.417-9.781,12.446c-6.895,7.477-15.107,14.109-20.779,22.608 c3.515-0.784,7.103-2.996,10.263-4.628c6.455-3.335,12.235-8.381,17.684-13.15c5.495-4.81,10.848-9.68,15.866-14.988 c1.905-2.016,4.178-4.42,5.556-6.838c0.051,1.256-0.604,2.542-1.03,3.672c-1.424,3.767-3.011,7.432-4.723,11.076 c-2.772,5.904-6.312,11.342-9.921,16.763c-3.167,4.757-7.082,8.94-10.854,13.205c-2.456,2.777-4.876,5.977-7.627,8.448 c9.341-7.52,18.965-14.629,27.924-22.656c4.995-4.474,9.557-9.075,13.586-14.446c1.443-1.924,2.427-4.939,3.74-6.56 c-0.446,3.322-2.183,6.878-3.312,10.032c-2.261,6.309-5.352,12.53-8.418,18.482c-3.46,6.719-8.134,12.698-11.954,19.203 c-0.725,1.234-1.833,2.451-2.265,3.77c2.347-0.48,4.812-3.199,7.028-4.286c4.144-2.033,7.787-4.938,11.184-8.072 c3.142-2.9,5.344-6.758,7.925-10.141c1.483-1.944,3.306-4.056,4.341-6.283c0.041,1.102-0.507,2.345-0.876,3.388 c-1.456,4.114-3.369,8.184-5.059,12.212c-1.503,3.583-3.421,7.001-5.277,10.411c-0.967,1.775-2.471,3.528-3.287,5.298 c2.49-1.163,5.229-3.906,7.212-5.828c2.094-2.028,5.027-4.716,6.33-7.335c-0.256,1.47-2.07,3.577-3.02,4.809'],
        checkmark: ['M16.667,62.167c3.109,5.55,7.217,10.591,10.926,15.75 c2.614,3.636,5.149,7.519,8.161,10.853c-0.046-0.051,1.959,2.414,2.692,2.343c0.895-0.088,6.958-8.511,6.014-7.3 c5.997-7.695,11.68-15.463,16.931-23.696c6.393-10.025,12.235-20.373,18.104-30.707C82.004,24.988,84.802,20.601,87,16'],
    };
    var animDefs = {
        fill: {speed: .8, easing: 'ease-in-out'},
        checkmark : { speed : .2, easing : 'ease-in-out' },
    };

    function initRadioButton(el) {

        function createSVGEl(def) {
            var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            if (def) {
                svg.setAttributeNS(null, 'viewBox', def.viewBox);
                svg.setAttributeNS(null, 'preserveAspectRatio', def.preserveAspectRatio);
            }
            else {
                svg.setAttributeNS(null, 'viewBox', '0 0 100 100');
            }
            svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            return svg;
        }

        var svg = createSVGEl();
        el.parentNode.appendChild(svg);
    }

    function draw(el, type) {
        var paths = [], pathDef, animDef, svg = el.parentNode.querySelector('svg');

        switch (type) {
            case 'fill':
                pathDef = pathDefs.fill;
                animDef = animDefs.fill;
                break;
            case 'checkmark':
                pathDef = pathDefs.checkmark;
                animDef = animDefs.checkmark;
                break;
        };

        paths.push(document.createElementNS('http://www.w3.org/2000/svg', 'path'));

        if (type === 'cross' || type === 'list') {
            paths.push(document.createElementNS('http://www.w3.org/2000/svg', 'path'));
        }

        for (var i = 0, len = paths.length; i < len; ++i) {
            var path = paths[i];
            svg.appendChild(path);

            path.setAttributeNS(null, 'd', pathDef[i]);

            var length = path.getTotalLength();
            // Set up the starting positions
            path.style.strokeDasharray = length + ' ' + length;
            if (i === 0) {
                path.style.strokeDashoffset = Math.floor(length) - 1;
            }
            else
                path.style.strokeDashoffset = length;
            // Trigger a layout so styles are calculated & the browser
            // picks up the starting position before animating
            path.getBoundingClientRect();
            // Define our transition
            path.style.transition = path.style.WebkitTransition = path.style.MozTransition = 'stroke-dashoffset ' + animDef.speed + 's ' + animDef.easing + ' ' + i * animDef.speed + 's';
            // Go!
            path.style.strokeDashoffset = '0';
        }
    }

    function reset(el) {
        Array.prototype.slice.call(el.parentNode.querySelectorAll('svg > path')).forEach(function(el) {
            el.parentNode.removeChild(el);
        });
    }

    return [function() {

        return {
            restrict: 'A',

            link: function(scope, element, attrs) {
                initRadioButton(element[0]);

                if (attrs.ngModel != null && attrs.ngModel.length > 0) {
                    var dotPos = attrs.ngModel.indexOf('.');
                    var watchCollection;
                    if (dotPos > -1) {
                        watchCollection = attrs.ngModel.substr(0, dotPos);
                    } else {
                        watchCollection = attrs.ngModel;
                    }
                    scope.$watchCollection(watchCollection, function() {
                        var animate, animation;
                        var elementType = element[0].type;
                        var selectedVal = scope.$eval(attrs.ngModel);

                        if (elementType === "checkbox") {
                            animate = selectedVal === true;
                            animation = 'checkmark';
                        } else if (elementType === "radio") {
                            // Use == to compare values as they may be different types
                            // Can't necessarily use 'attrs.value' - due to a race condition it might not be defined;
                            // in which case use 'attrs.ngValue' which should be.
                            var buttonValue = attrs.value ? attrs.value : scope.$eval(attrs.ngValue);
                            animate = selectedVal != null && selectedVal == buttonValue;
                            animation = 'fill';
                        } else {
                            throw 'Error: input-animation directive is not yet implemented for inputs of type: "' + elementType + '"';
                        }

                        if (animate) {
                            draw(element[0], animation);
                        } else {
                            reset(element[0]);
                        }
                    });
                }
            }
        };
    }];
});
