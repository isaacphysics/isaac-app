/**
 * Copyright 2014 Ian Davies
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
define(["../honest/hex_filter", "/partials/hex_filter.html"], function(HexFilter, templateUrl) {


    return ["$state", "tags", function($state, tags) {

        return {

            scope: {
                subjects: "=",
                fields: "=",
                topics: "=",
                warnings: "=",
            },

            restrict: "A",

            templateUrl: templateUrl,

            link: function(scope, element, _attrs) {

                // We have a flat list of tags, but the HexFilter requires a hierarchical structure. Build it here.
                let buildHexFilterState = function(fromFilterTags) {
                    let filterTags = _.cloneDeep(fromFilterTags); // deep copy tags so as not to alter the original array

                    // TODO: Be sure to check whether Array.prototype.filter polyfill is necessary.

                    // For some reason the filter predicate sometimes gets called with a null argument. Weird. Hence the "t && ..."
                    // FIXME - temporary hack to remove chemistry from the filter!
                    let subjects = filterTags.filter(function(t) { return t && !t.parent && t.id != "chemistry"; });

                    for (let i in subjects) {
                        let s = subjects[i];

                        s.enabled = !s.comingSoon && s.enabled !== false;
                        s.selected = false;
                        s.subject = s.id;

                        s.children = filterTags.filter(function(t) { return t && t.parent == s.id; });

                        for (let j in s.children) {
                            let f = s.children[j];

                            f.enabled = !f.comingSoon && f.enabled !== false;
                            f.selected = false;
                            f.subject = s.id;

                            f.children = filterTags.filter(function(t) { return t && t.parent == f.id; });

                            for (let k in f.children) {
                                let t = f.children[k];

                                t.enabled = !t.comingSoon && t.enabled !== false;
                                t.selected = false;
                                t.subject = s.id;
                            }
                        }
                    }

                    return subjects;

                }

                let config = buildHexFilterState(tags.tagArray);

                let hexFilter = new HexFilter(element, {
                    // Replace with real function to get state
                    get: function(callback) {
                        callback(config);
                    },

                    // Does nothing - replace as required
                    change: function() { }
                });

                // Set this after the hexFilter is constructed so that it doesn't try to change the attributes on initialisation.
                hexFilter.change = function(_items) {
                    let selectedItems = [[],[],[]];

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
                        for(let i in arr) {
                            walk(0, arr[i]);
                        }
                    }
                    walkAll(config);

                    console.debug("Selected Items", selectedItems);

                    let subjects = selectedItems[0];
                    let fields = selectedItems[1];
                    let topics = selectedItems[2];

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

                let hexFilterResize = function()
                {
                    hexFilter.EnableVertical(element.find('#hexfilter-large').css('display') === 'none');
                    hexFilter.ReDraw(true);
                    element.height(element.find('#hexfilter-large').css('display') === 'none' ? 740 : 460);
                };

                hexFilterResize(element);

                // Resize handling for Hex Filter
                $(window).bind("resize", hexFilterResize);

                // Deal with external changes to the selected subjects, fields and topics.
                let configChanged = function() {

                    let visit = function(obj, callback, level) {
                        if (!level)
                            level = 0;

                        callback(obj, level);

                        if (obj.children) {
                            for(let i in obj.children) {
                                visit(obj.children[i], callback, level + 1);
                            }
                        }
                    }

                    let visitAll = function(arr, callback) {
                        for (let i in arr) {
                            visit(arr[i], callback);
                        }
                    }

                    let deselector = function(minLevel) {
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
                        let deselectTopics = deselector(1);

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

                            let deselectFields = deselector(2);
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

                    // Add warnings where necessary
                    let warnings = {};
                    for (let i in scope.warnings) {
                        warnings[scope.warnings[i][0]] = scope.warnings[i][1];
                    }

                    visitAll(config, function(obj) {
                        obj.warning = warnings[obj.id];
                    })

                    hexFilterResize();

                }

                scope.$watchCollection("subjects", configChanged);
                scope.$watchCollection("fields", configChanged);
                scope.$watchCollection("topics", configChanged);
                scope.$watchCollection("warnings", configChanged);

                configChanged();
            }
        };
    }]

});
