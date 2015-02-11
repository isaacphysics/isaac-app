/*global angular, Tipped*/
/*jshint indent:2*/

(function () {
  'use strict';

  var tipped = angular.module('decipher.tipped', []);

  var defaults = {
    showOn: 'mouseenter',
    showDelay: 1000,
    hideOn: 'mouseleave',
    hideDelay: 500,
    target: 'self'
  };

  var title_defaults = {
    showDelay: 600,
    hideDelay: 0,
    hideOthers: false,
    showOn: 'mouseenter',
    hideOn: [
      { element: 'tooltip', event: 'mouseleave' },
      { element: 'self', event: 'click' },
      { element: 'self', event: 'mouseleave' }
    ],
    target: 'self',
    skin: 'light'
  };

  tipped.constant('tippedOptions', {});

  /**
   * There are two ways to use this directive:
   *
   * An inline template, with interpolation available:
   *
   *  <div data-tipped title="your {{mom}}"></div>
   *
   * Or a templateUrl, which will fetch the template via AJAX and be fancy.
   *
   *  <div data-tipped data-template-url="'something.html'"></div>
   *
   * (the template URL is an AngularJS expression)
   *
   * Including both title and data-template-url in a single element creates:
   *
   *   - the title as a hover tooltip bound to the mouseenter event
   *
   *   - the template URL using the data-tipped options
   *
   * To override any defaults, pass an options object to the tipped directive:
   *
   *  <div data-tipped="{skin: 'grey'}" title="Derp"></div>
   *
   */
  tipped.directive('tipped', ['$window', '$http', '$interpolate', '$compile', '$templateCache', '$timeout', 'tippedOptions',
    function ($window, $http, $interpolate, $compile, $templateCache, $timeout,
      tippedOptions) {
      return {
        restrict: 'A',
        link: function link(scope, element, attrs) {
          var tipped = attrs.tipped || '{}', skin,
            tippedDefaults = angular.copy(defaults),
            moduleDefaults = angular.copy(tippedOptions),
            titleDefaults = angular.copy(title_defaults),
            ttDefaults = scope.$eval(tipped), tt, ht,
            hoverElement,
            options = {};

          function make() {
            return $http.get(scope.$eval(attrs.templateUrl),
              {cache: $templateCache})
              .then(function receiveTemplate(res) {

                var compiledTemplate; // compiled template

                options.afterUpdate = function afterUpdate(content) {
                  var c = angular.element(content);
                  c.html(compiledTemplate);
                };

                // compilation does not require interpolation
                return $timeout(function () {
                  scope.$apply(function () {
                    compiledTemplate =
                    $compile('<div>' + res.data + '</div>')(scope);
                  });
                  tt = $window.Tipped.create(element[0], compiledTemplate.html(), options);
                  return tt;
                }, 0, false);
              });
          }

          if (attrs.templateUrl) {
            options = angular.extend(options, tippedDefaults);
            options = angular.extend(options, moduleDefaults);

            // explicitly get options from skin since we have to do stuff manually.
            if (options.skin &&
                (skin = $window.Tipped.Skins[ttDefaults.skin || options.skin])) {
              options = angular.extend(options, skin);
            }

            options = angular.extend(options, ttDefaults);

            scope.$on('Tipped.refresh', function () {
              $window.Tipped.refresh(element[0]);
            });

            if (options.showOn) {
              element.bind(options.showOn, function () {
                make().then(function (tt) {
                  tt.show();
                });
              });
              scope.$on('$destroy', function () {
                element.unbind(options.showOn);
              });
            }
          }
          else {
            // title gets the overridden defaults if no template-url
            titleDefaults = angular.extend(titleDefaults, ttDefaults);
          }

          if (angular.isDefined(attrs.title)) {
            if (attrs.templateUrl) {
              // we may be trying to add more than one tip to the element
              // wrap the current element with a span that this tooltip will bind to
              hoverElement = element.wrap("<span class='title_tip'></span>").parent();
            } else {
              hoverElement = element;
            }

            attrs.$observe('title', function (value) {
              if (value) {
                if (attrs.templateUrl || titleDefaults.createNow) {
                  // certain tooltips need to be created right away to prevent display issues
                  ht = $window.Tipped.create(hoverElement[0], $interpolate(value)(scope), titleDefaults);

                  // since we're not adding the tooltip to the original element
                  // we need to remove the title from it
                  element.removeAttr("title");
                } else {
                  hoverElement.bind('mouseenter', function () {
                    if (!angular.isObject(ht)) {
                      ht = $window.Tipped.create(hoverElement[0], $interpolate(value)(scope), titleDefaults);

                      $timeout(function () {
                        ht.show();
                      }, titleDefaults.showDelay);
                    }
                  }).bind('mouseleave', function () {
                      // prevent the ht tooltip from getting stuck when the mouse
                      // leaves before it is created and displayed
                      // needs to happen after the show event, hence the timeout
                      $timeout(function () {
                        if (angular.isObject(ht) && Tipped.visible(hoverElement)) {
                          ht.hide();
                        }
                      }, titleDefaults.showDelay);
                    });
                }

                scope.$on('$destroy', function () {
                  hoverElement.unbind('mouseenter');
                  hoverElement.unbind('mouseleave');
                });
              }
            });
          }

          // watch the 'show' option.
          scope.$watch(function () {
            return scope.$eval(tipped).show;
          }, function (newVal) {
            if (tt) {
              if (newVal) {
                tt.show();
              } else {
                tt.hide();
              }
            } else if (newVal) {
              make().then(function (tt) {
                  tt.show();
                });
            }
          });
        }
      };
    }]);
})();
