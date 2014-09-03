angular.module('isaac.templates').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('app/partials/concept_filter.html',
    "<div class='pad'></div>\n" +
    "<div id=\"conceptfilter\">\n" +
    "\t<h3>Filter by Concept<!-- <a href=''><small>(What's this?)</small></a>--></h3>\n" +
    "\t<input type=\"text\" placeholder=\"Concept title\" ng-model=\"conceptInput\">\n" +
    "\t<div id=\"concept-search-data\">\n" +
    "\t\t<div ng-repeat=\"c in allConcepts.results | filter:removeSelected | filter:{title: conceptInput}:titleMatcher | limitTo:4\" class='concept-search-result physics' ng-click=\"selectConcept(c.id)\">\n" +
    "\t\t\t<div>{{ c.title }}</div>\n" +
    "\t\t</div>\n" +
    "\t</div>\n" +
    "\t<div id=\"concept-results\">\n" +
    "\t\t<div ng-repeat=\"id in selectedConceptIds\" class='concept-search-result'\n" +
    "\t\t     ng-class=\"conceptMap[id].subject || 'physics'\" ng-click=\"deselectConcept($index)\">\n" +
    "\t\t\t<div>{{conceptMap[id].title || id}}</div>\n" +
    "\t\t</div>\n" +
    "\t</div>\n" +
    "</div>"
  );


  $templateCache.put('app/partials/cookie-message.html',
    "<div class=\"row no-print\">\n" +
    "    <div class=\"large-16 columns\">\n" +
    "        <div data-alert class=\"ru-alert-box cookies-message\">\n" +
    "            <div class=\"row\">\n" +
    "                <div class=\"large-1 medium-1 small-16 columns\">\n" +
    "                    <span class=\"ru-info-icon hide-for-small-only\"></span>\n" +
    "                    <span class=\"cookies-title show-for-small-only\"><img src=\"/assets/information-icon.png\" alt=\"\" /> Cookies</span>\n" +
    "                </div>\n" +
    "                <div class=\"large-12 medium-12 small-16 columns\">\n" +
    "                    By continuing to use this site you consent to the use of cookies on your device as described in our <a ui-sref=\"cookies\">cookie policy</a> unless you have disabled them. You can change your <a target=\"_blank\" rel=\"nofollow\" href=\"http://www.aboutcookies.org/Default.aspx?page=1\">cookie settings</a> at any time but parts of our site will not function correctly without them.\n" +
    "                </div>\n" +
    "                <div class=\"large-3 medium-3 small-16 columns\">\n" +
    "                    <a class=\"ru-button close cookies-accepted\">Accept</a>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>"
  );


  $templateCache.put('app/partials/desktop_panel.html',
    "<!-- Desktop panel - e.g. About Us  MUST BE FIRST-->\n" +
    "<div class='row hide-for-small-only'>\n" +
    "    <div class='large-16 medium-16 columns'>\n" +
    "        <div class='ru-desktop-panel'>\n" +
    "            <div ng-if=\"globalFlags.isLoading\" ng-controller=\"LoadingMessageController\"><h1 ng-show=\"globalFlags.displayLoadingMessage\" class=\"loading-header\"><img src=\"/assets/loading.gif\"></h1></div>\n" +
    "            <div ng-if=\"!globalFlags.displayLoadingMessage\" ng-transclude></div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n"
  );


  $templateCache.put('app/partials/difficulty_filter.html',
    "<div class='pad'></div>\r" +
    "\n" +
    "<h3>Difficulty... <a ng-click=\"explanationVisible = true\" ng-hide=\"explanationVisible\"><small>(What's my level?)</small></a></h3>\r" +
    "\n" +
    "\r" +
    "\n" +
    "<div ng-show=\"explanationVisible\" class=\"row difficulty-explanation\">\r" +
    "\n" +
    "\t<div class=\"small-16 columns\">\r" +
    "\n" +
    "\t\t<div class=\"ru-difficulty-explanation-close\" >\r" +
    "\n" +
    "            <img src='/assets/Close-button.jpg' alt=\"Close Explanation\" ng-click=\"explanationVisible = false\">\r" +
    "\n" +
    "        </div>\r" +
    "\n" +
    "\t\t<img src=\"/assets/difficulty-guide.png\">\r" +
    "\n" +
    "\t\t<div class=\"text-center\">Rough guide to difficulty levels</div>\r" +
    "\n" +
    "\t</div>\r" +
    "\n" +
    "</div>\r" +
    "\n" +
    "\r" +
    "\n" +
    "<div id=\"difficulty-hexagons\">\r" +
    "\n" +
    "</div>\r" +
    "\n"
  );


  $templateCache.put('app/partials/filter.html',
    "FILTER"
  );


  $templateCache.put('app/partials/footer.html',
    "<!-- Footer for desktop -->\n" +
    "<footer class='hide-for-small-only no-print'>\n" +
    "    <div class='row'>\n" +
    "        <div class='large-2 medium-2 columns'>\n" +
    "            <a ui-sref='home'><img alt='Isaac. Physics. You work it out.' class='ru-desktop-banner'\n" +
    "                             data-interchange=\"[/assets/isaac-logo.png, (medium)], [/assets/isaac-logo@2x.png, (medium_retina)]\" src='/assets/isaac-logo.png'></a>\n" +
    "        </div>\n" +
    "        <!-- Link Collections -->\n" +
    "        <div class='large-2 medium-2 columns footer_links'>\n" +
    "            <a ui-sref='about'>About Us</a>\n" +
    "            <a ui-sref='events'>Events</a>\n" +
    "            <a ui-sref='contact'>Contact Us</a>\n" +
    "            <a ui-sref='privacy'>Privacy Policy</a>\n" +
    "        </div>\n" +
    "        <div class='large-4 medium-4 columns footer_links'>\n" +
    "            <a ui-sref='extraordinary_problems'>Extraordinary Problems</a>\n" +
    "            <a ui-sref='challenge_problems'>Challenge of the Month</a>\n" +
    "            <a ui-sref='why_physics'>Why Physics?</a>\n" +
    "            <a ui-sref='apply_uni'>Applying to Uni</a>\n" +
    "        </div>\n" +
    "        <div class='large-3 medium-3 columns footer_links'>\n" +
    "            <a ui-sref='solving_problems'>Solving Problems</a>\n" +
    "            <a ui-sref='bios'>Biographies of Real Physicists</a>\n" +
    "            <a ui-sref='glossary'>Glossary</a>\n" +
    "            <a api-environment=\"dev\" ui-sref='questionIndex'>Question List</a>\n" +
    "            <a api-environment=\"dev\" ui-sref='contentErrors'>Content Errors</a>\n" +
    "        </div>\n" +
    "        <div class='large-5 medium-5 columns footer_links'>\n" +
    "            <div class='right'>\n" +
    "                <span class='ru-social'>Get Social</span>\n" +
    "                <a class='ru ru-social-icon-google-48x48' href=\"https://plus.google.com/118214242928754076411\" rel=\"publisher\" target='_blank'></a>\n" +
    "                <a class='ru ru-social-icon-facebook-48x48' href=\"https://www.facebook.com/isaacphysicsUK\" target='_blank'></a>\n" +
    "                <a class='ru ru-social-icon-twitter-48x48' href=\"https://twitter.com/isaacphysics\" target='_blank'></a>\n" +
    "                <a class='ru ru-social-icon-youtube-48x48' href=\"https://www.youtube.com/user/isaacphysics/\" target='_blank'></a>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div class='clearfix'></div>\n" +
    "        <div class='row ru-footer-base '>\n" +
    "            <div class='large-16 medium-16 columns'>\n" +
    "                <span class='left'>Supported by: \n" +
    "                    <a class='footer_link' href='https://www.gov.uk/government/organisations/department-for-education' target='_blank'>\n" +
    "                        <strong>Department for Education</strong></a></span>\n" +
    "                <span class='right text-right'>All materials on this site are<br>\n" +
    "                    licensed under the <a class='footer_link' href='http://creativecommons.org/licenses/by/4.0/' target='_blank'>\n" +
    "                        <strong>Creative Commons license</strong></a></span>\n" +
    "            </div>            \n" +
    "        </div>\n" +
    "    </div>\n" +
    "</footer>\n" +
    "\n" +
    "<!-- Footer for mobile -->\n" +
    "<footer class='show-for-small-only no-print'>\n" +
    "    <div class='row'>\n" +
    "        <div class='small-4 columns'><a ui-sref='home'><img alt='Isaac. Physics. You work it out.' class='ru-mobile-logo' \n" +
    "                                                      data-interchange=\"[/assets/isaac-logo.png, (small)], [/assets/isaac-logo@2x.png, (small_retina)]\" src='/assets/isaac-logo.png'></a></div>\n" +
    "        <div class='small-12 columns'><span class='ru-mobile-doe ru-footer-base'>Supported by:<br>\n" +
    "                <a class='footer_link' href='https://www.gov.uk/government/organisations/department-for-education' target='_blank'>\n" +
    "                    <strong>Department for Education</strong></a></span></div>\n" +
    "        <div class='clearfix'></div>\n" +
    "        <div class='small-16 columns'>\n" +
    "            <div class='ru-mobile-social'>\n" +
    "                <div class='small-4 columns'>\n" +
    "                    <span>Get<br>Social:</span>\n" +
    "                </div>\n" +
    "                <div class='small-12 columns'>\n" +
    "                    <a class='ru ru-social-icon-google-40x40' href=\"https://plus.google.com/118214242928754076411\" target='_blank'></a>\n" +
    "                    <a class='ru ru-social-icon-facebook-40x40' href=\"https://www.facebook.com/isaacphysicsUK\" target='_blank'></a>\n" +
    "                    <a class='ru ru-social-icon-twitter-40x40' href=\"https://twitter.com/isaacphysics\" target='_blank'></a>\n" +
    "                    <a class='ru ru-social-icon-youtube-40x40' href=\"https://www.youtube.com/user/isaacphysics/\" target='_blank'></a>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <!-- Links -->\n" +
    "    <div class='ru-mobile-menu'>\n" +
    "        <hr>\n" +
    "        <div class='row'>\n" +
    "            <div class='small-16 columns'>\n" +
    "                <a ui-sref='about'><span>About Us</span><img src='/assets/icon-index-arrow.png'></a>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <hr>\n" +
    "        <div class='row'>\n" +
    "            <div class='small-16 columns'>\n" +
    "                <a ui-sref='contact'><span>Contact us</span><img src='/assets/icon-index-arrow.png'></a>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <hr>\n" +
    "        <div class='row'>\n" +
    "            <div class='small-16 columns'>\n" +
    "                <a ui-sref='events'><span>Events</span><img src='/assets/icon-index-arrow.png'></a>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <hr>\n" +
    "        <div class='row'>\n" +
    "            <div class='small-16 columns'>\n" +
    "                <a ui-sref='privacy'><span>Privacy Policy</span><img src='/assets/icon-index-arrow.png'></a>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <hr>\n" +
    "        <div class='row'>\n" +
    "            <div class='small-16 columns'>\n" +
    "                <a ui-sref='extraordinary_problems'><span>Extraordinary Problems</span><img src='/assets/icon-index-arrow.png'></a>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <hr>\n" +
    "        <div class='row'>\n" +
    "            <div class='small-16 columns'>\n" +
    "                <a ui-sref='challenge_problems'><span>Challenge of the Month</span><img src='/assets/icon-index-arrow.png'></a>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <hr>\n" +
    "        <div class='row'>\n" +
    "            <div class='small-16 columns'>\n" +
    "                <a ui-sref='why_physics'><span>Why Physics?</span><img src='/assets/icon-index-arrow.png'></a>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <hr>\n" +
    "        <div class='row'>\n" +
    "            <div class='small-16 columns'>\n" +
    "                <a ui-sref='apply_uni'><span>Applying to Uni</span><img src='/assets/icon-index-arrow.png'></a>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <hr>\n" +
    "        <div class='row'>\n" +
    "            <div class='small-16 columns'>\n" +
    "                <a ui-sref='bios'><span>Biographies of Real Physicists</span><img src='/assets/icon-index-arrow.png'></a>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <hr>\n" +
    "        <div class='row'>\n" +
    "            <div class='small-16 columns'>\n" +
    "                <a ui-sref='glossary'><span>Glossary</span><img src='/assets/icon-index-arrow.png'></a>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <hr>\n" +
    "    </div>\n" +
    "    <div class='row'>\n" +
    "        <div class='small-16 columns'>\n" +
    "            <span class='ru-footer-base'>All materials on this site are<br>\n" +
    "                licensed under the <a class='footer_link' href='http://creativecommons.org/licenses/by/4.0/' target='_blank'>\n" +
    "                    <strong>Creative Commons license</strong></a></span>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</footer>\n"
  );


  $templateCache.put('app/partials/footer_pods.html',
    "\n" +
    "<!-- Additional Information Panel -->\n" +
    "<div class=\"row no-print\">\n" +
    "    <div class='ru-concept-inner'>\n" +
    "        <ul class=\"large-block-grid-3 medium-block-grid-1 small-block-grid-1 ru-pad ru_pods\">\n" +
    "            <li>\n" +
    "                <div class=\"panel ru_pod\">\n" +
    "                    <div class='ru_pod_title ru_pod_concepts'>\n" +
    "                        <h5>Related Concepts</h5>\n" +
    "                    </div>\n" +
    "                    <hr>\n" +
    "                    <ul class=\"pod-scroll-list\">\n" +
    "                    \t<li ng-repeat=\"c in relatedConcepts\">\n" +
    "                            <a ui-sref=\"concept({id: c.id})\">{{c.title}}</a>\n" +
    "                            <h6>{{c.summary}}</h6>\n" +
    "                    \t</li>\n" +
    "\t                    <li ng-hide=\"relatedConcepts.length\" class=\"text-center\">- No related concepts -</li>\n" +
    "                    </ul>\n" +
    "                </div>\n" +
    "            </li>\n" +
    "            <li>\n" +
    "                <div class=\"panel ru_pod\">\n" +
    "                    <div class='ru_pod_title ru_pod_questions'>\n" +
    "                        <h5>Related Questions</h5>\n" +
    "                    </div>\n" +
    "                    <hr>\n" +
    "                    <ul class=\"pod-scroll-list\">\n" +
    "                    \t<li ng-repeat=\"c in relatedQuestions\">\n" +
    "                            <a ui-sref=\"question({id: c.id})\">{{c.title}}</a>\n" +
    "                            <h6>{{c.summary}}</h6>\n" +
    "                    \t</li>\n" +
    "\t                    <li ng-hide=\"relatedQuestions.length\" class=\"text-center\">- No related questions -</li>\n" +
    "                    </ul>\n" +
    "                </div>\n" +
    "            </li>\n" +
    "            <li>\n" +
    "                <div class=\"panel ru_pod ru_pod_forum\">\n" +
    "                    <div class='ru_pod_title'>\n" +
    "                        <h5>Events</h5>\n" +
    "                    </div>\n" +
    "                    <hr>\n" +
    "                    <div class=\"pod-scroll-list\">\n" +
    "                        <h6>Upcoming events</h6>\n" +
    "                        See our <a ui-sref=\"events\">events page</a> to find an event near you.\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </li>\n" +
    "        </ul>\n" +
    "    </div>\n" +
    "</div>\n"
  );


  $templateCache.put('app/partials/header.html',
    "<header class=\"no-print\">\n" +
    "    <!-- Desktop Header -->\n" +
    "    <div class='ru-desktop-header' ng-controller=\"HeaderController\">\n" +
    "        <div class='ru-dekstop-nav'>\n" +
    "            <!-- Desktop Nav -->\n" +
    "            <nav class='row'>\n" +
    "                <div class='padded-left-float'>\n" +
    "                    <a ui-sref='home'>\n" +
    "                        <img alt='Isaac. Physics. You work it out.' class='ru-desktop-menu-img' src='' \n" +
    "                             data-interchange=\"[/assets/isaac-logo.png, (default)], [/assets/isaac-logo-strap.png, (medium_large)],\n" +
    "                             [/assets/isaac-logo@2x.png, (medium_retina)], [/assets/isaac-logo-strap@2x.png, (large_retina)]\"></a>\n" +
    "                </div>\n" +
    "                <div class='padded-right-float text-right'>\n" +
    "                    <a class='ru-desktop-nav-item' ui-sref='home'>\n" +
    "                        <div class='ru-desktop-nav-item-inner' ng-class=\"{active: $state.includes('home') || $state.includes('question')}\">\n" +
    "                            <span>Questions</span>\n" +
    "                        </div>\n" +
    "                    </a>\n" +
    "                    <a class='ru-desktop-nav-item' ui-sref='conceptIndex'>  \n" +
    "                        <div class='ru-desktop-nav-item-inner' ng-class=\"{active: $state.includes('conceptIndex') || $state.includes('concept')}\">\n" +
    "                            <span>Concepts</span>\n" +
    "                        </div>\n" +
    "                    </a>\n" +
    "                    <a class='ru-desktop-nav-item' ui-sref='boards'>  \n" +
    "                        <div class='ru-desktop-nav-item-inner' ng-class=\"{active: $state.includes('boards')}\">\n" +
    "                            <span>My Boards</span>\n" +
    "                        </div>\n" +
    "                    </a>\n" +
    "                    <a ng-if='!user._id' class='ru-desktop-nav-item' ui-sref='login'>  \n" +
    "                        <div class='ru-desktop-nav-item-inner' ng-class=\"{active: $state.includes('login')}\">\n" +
    "                            <span>Log in</span>\n" +
    "                        </div>\n" +
    "                    </a>\n" +
    "                    <a ng-if='user._id' class='ru-desktop-nav-item' ui-sref='accountSettings'>  \n" +
    "                        <div class='ru-desktop-nav-item-inner' ng-class=\"{active: $state.includes('accountSettings')}\">\n" +
    "                            <span>My Account</span>\n" +
    "                        </div>\n" +
    "                    </a>\n" +
    "                </div>\n" +
    "            </nav>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <!-- Mobile Header -->\n" +
    "    <div class='ru-mobile-header' ng-controller=\"HeaderController\">\n" +
    "        <!-- Mobile Fixed Header -->\n" +
    "        <div class='ru-fixed-header fixed'>\n" +
    "            <div class='row'>\n" +
    "                <div class='small-8 columns'>\n" +
    "                    <div ng-if='!user._id' id='mobile-login' class='pointer'>\n" +
    "                        <div class='ru-mobile-login'></div>\n" +
    "                        <span>\n" +
    "                            Log in\n" +
    "                        </span>\n" +
    "                        <div class='ru-mobile-down'></div>\n" +
    "                    </div>\n" +
    "                    <a ng-if='user._id' ui-sref='accountSettings'>\n" +
    "                        <div class='ru-mobile-login'></div>\n" +
    "                        <span>\n" +
    "                            My Account\n" +
    "                        </span>\n" +
    "                    </a>                    \n" +
    "                </div>\n" +
    "                <div class='small-8 columns'>\n" +
    "                    <div class='right pointer' id='mobile-search'>\n" +
    "                        <div class='ru-mobile-search'></div>\n" +
    "                        <span>\n" +
    "                            Search\n" +
    "                        </span>\n" +
    "                        <div class='ru-mobile-down'></div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <!-- Mobile Nav -->\n" +
    "        <div class='ru-mobile-nav'>\n" +
    "            <nav class='row'>\n" +
    "                <a ui-sref='home'><img alt='Isaac. Physics. You work it out.' class='ru-mobile-menu-img' \n" +
    "                                data-interchange=\"[/assets/isaac-logo.png, (small)], [/assets/isaac-logo@2x.png, (small_retina)]\" src='/assets/isaac-logo.png'></a>\n" +
    "\n" +
    "                <a class='ru-mobile-nav-item' ui-sref='boards'>\n" +
    "                    <div class='ru-mobile-nav-item-inner' ng-class=\"{active: $state.includes('boards')}\">\n" +
    "                        <span>My Boards</span>\n" +
    "                    </div>\n" +
    "                </a>\n" +
    "                <a class='ru-mobile-nav-item' ui-sref='conceptIndex'>\n" +
    "                    <div class='ru-mobile-nav-item-inner' ng-class=\"{active: $state.includes('conceptIndex') || $state.includes('concept')}\">\n" +
    "                        <span>Concepts</span>\n" +
    "                    </div>\n" +
    "                </a>\n" +
    "                <a class='ru-mobile-nav-item' ui-sref='home'>\n" +
    "                    <div ng-class=\"{'ru-mobile-nav-item-inner': true, active: $state.includes('home') || $state.includes('question')}\">\n" +
    "                        <span>Problems</span>\n" +
    "                    </div>\n" +
    "                </a>\n" +
    "            </nav>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <!-- Search button  MUST BE LAST-->\n" +
    "    <div class=\"row\" ng-controller=\"GlobalSearchController\" ng-hide=\"globalFlags.noSearch\">\n" +
    "        <div class=\"small-16 columns\">\n" +
    "\n" +
    "            <div class='row hide-for-small-only site-search-row'>\n" +
    "                <div class='large-16 medium-16 columns'>\n" +
    "                    <div class='ru-desktop-panel-search' ng-hide=\"globalFlags.siteSearchOpen\">\n" +
    "                        <a tabindex=\"0\" ng-click=\"globalFlags.siteSearchOpen = true\"><img src='/assets/desktop-search.png' alt=\"Search\"></a>\n" +
    "                    </div>\n" +
    "                    <div class=\"ru-desktop-panel-search-close\"  tabindex=\"0\" ng-show=\"globalFlags.siteSearchOpen\">\n" +
    "                        <img src='/assets/Close-button.jpg' alt=\"Close Search\" ng-click=\"globalFlags.siteSearchOpen = false\">\n" +
    "                    </div>\n" +
    "                    <div class=\"ru-search-bg hide-animate\" ng-show=\"globalFlags.siteSearchOpen\" ng-click=\"globalFlags.siteSearchOpen = false\"></div>\n" +
    "                    <div class=\"ru-desktop-panel search hide-animate\" ng-show=\"globalFlags.siteSearchOpen\">\n" +
    "                        <div class='ru-desktop-search'>\n" +
    "                            <form ng-submit=\"triggerSearch()\">\n" +
    "                            <div class=\"row\">\n" +
    "                                <div class=\"large-2 medium-2 columns\">\n" +
    "                                    <label for=\"ru-search-box\" class=\" text-center inline\">Search</label>\n" +
    "                                </div>\n" +
    "                                <div class=\"large-3 medium-13 columns\">\n" +
    "                                    <input id=\"ru-search-box\" ng-model=\"models.query\" type=\"text\"/>\n" +
    "                                </div>\n" +
    "                                <div class=\"clearfix show-for-medium-only\"></div>\n" +
    "                                <div class=\"large-4 medium-5 medium-offset-2 large-offset-0 columns\">\n" +
    "                                    <div class=\"ru-desktop-search-check\">\n" +
    "                                        <span class=\"ru-drop-check\">\n" +
    "                                            <input id=\"search-check1\" ng-model=\"models.includeQuestions\" name=\"checkbox2\" type=\"checkbox\">\n" +
    "                                            <label for='search-check1'></label>\n" +
    "                                        </span>\n" +
    "                                        <label for=\"search-check1\" class=''> Search problems</label>\n" +
    "                                    </div>\n" +
    "                                </div>\n" +
    "                                <div class=\"large-4 medium-5  columns\">\n" +
    "                                    <div class=\"ru-desktop-search-check\">\n" +
    "                                        <span class=\"ru-drop-check\">\n" +
    "                                            <input id=\"search-check2\" ng-model=\"models.includeConcepts\" name=\"checkbox2\" type=\"checkbox\">\n" +
    "                                            <label for='search-check2'></label>\n" +
    "                                        </span>\n" +
    "                                        <label for=\"search-check2\" class=''> Search concepts</label>\n" +
    "                                    </div>\n" +
    "                                </div>\n" +
    "                                <div class=\"large-2 medium-3 medium-offset-0 columns end\">\n" +
    "                                    <input class=\"button ru-search-button expand\" type=\"button\" value=\"Search\" id=\"desktop-search-now\" ng-click=\"triggerSearch()\">\n" +
    "                                </div>\n" +
    "                            </div>\n" +
    "                            </form>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "\n" +
    "\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</header>"
  );


  $templateCache.put('app/partials/hex_filter.html',
    "<div class='pad'></div>\r" +
    "\n" +
    "<div id=\"hexfilter-large\" class=\"show-for-large-up\"></div>\r" +
    "\n" +
    "<h3>Create your challenge...</h3>\r" +
    "\n" +
    "<div id=\"hexfilter-text\"></div>\r" +
    "\n" +
    "<svg id=\"hexfilter-svg\"></svg>\r" +
    "\n"
  );


  $templateCache.put('app/partials/hexagons.html',
    "<div class=\"row\" ng-show=\"!questions && !loading\">\n" +
    "    <div class='small-16 columns text-center'>\n" +
    "        <div class='ru-score'>\n" +
    "            <strong class=\"green\">No questions found in selected topics</strong>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "<div class='hexagon_wrap hide-animate' ng-class=\"{'loading': loading}\" math-jax ng-show=\"questions || loading\"></div>\n"
  );


  $templateCache.put('app/partials/login.html',
    "<form name=\"form\" class=\"login-wrap\" ng-submit=\"login()\" ng-controller=\"LoginController\" novalidate>\n" +
    "    <div class=\"row\">\n" +
    "        <div class='large-7 medium-7 columns small-only-text-center'>\n" +
    "            <div class=\"login-social\">\n" +
    "                <h2><span class=\"ru_green\">Log in</span> or <span class=\"ru_green\">sign up</span> with:</h2>\n" +
    "                <a ng-click=\"auth.loginRedirect('google', target)\" class=\"login-social-google\">Google+</a>\n" +
    "                <a ng-click=\"auth.loginRedirect('twitter', target)\" class=\"login-social-twitter\">Twitter</a>\n" +
    "                <a ng-click=\"auth.loginRedirect('facebook', target)\" class=\"login-social-facebook\">Facebook</a>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div class='large-2 medium-2 columns text-center login-separator'>\n" +
    "            <span class=\"ru_green\">or</span>\n" +
    "        </div>\n" +
    "        <div class='large-6 medium-6 columns login-form left'>\n" +
    "            <p ng-show=\"passwordRestFlag\"><strong>Your password request is being proccessed. <span class=\"ru_green\">Please check your email.</span>\n" +
    "            </strong></p>\n" +
    "            <p ng-show=\"errorMessage\">\n" +
    "                <strong class=\"ru_red\">{{errorMessage}}</strong>\n" +
    "            </p>\n" +
    "            <div class=\"row\">\n" +
    "                <div class='large-12 medium-14 columns'>\n" +
    "                    <label class=\"ru-error-message\" ng-show=\"form.email.$invalid && form.submitted || form.email.$invalid && forgottenPassword\">\n" +
    "                        Enter a valid email\n" +
    "                    </label>\n" +
    "                    <input name=\"email\" type=\"email\" placeholder=\"Email address\" ng-model=\"user.email\" required/>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <div class=\"row\">\n" +
    "                <div class='large-12 medium-14 columns'>\n" +
    "                    <label class=\"ru-error-message\" ng-show=\"form.password.$invalid && form.submitted\">\n" +
    "                        Enter your password\n" +
    "                    </label>\n" +
    "                    <input name=\"password\" type=\"password\" placeholder=\"Password\" ng-model=\"user.password\" required/>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <div class=\"row\">\n" +
    "                <div class='large-12 medium-14 columns'>\n" +
    "                    <ul class=\"large-block-grid-2 medium-block-grid-2 small-block-grid-1\">\n" +
    "                        <li><input class=\"ru-button expand\" type=\"submit\" value=\"Log in\" ng-click=\"form.submitted = true\" /></li>\n" +
    "                        <li><a class=\"ru-button expand secondary\" ui-sref=\"register\" ng-click=\"hideMobileForm()\">Sign up</a></li>\n" +
    "                    </ul>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <a class=\"login-forgot-password\" ng-click=\"resetPassword()\">Forgotten your password?</a>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</form>"
  );


  $templateCache.put('app/partials/mobile_panel.html',
    "<!-- Mobile panel MUST BE SECOND-->\n" +
    "<div class='ru-mobile-panel show-for-small-only ru-mobile-panel-with-crumb no-print'>\n" +
    "    <div ng-if=\"isLoading\" ng-controller=\"LoadingMessageController\"><h1 ng-show=\"globalFlags.displayLoadingMessage\" class=\"loading-header\"><img src=\"/assets/loading.gif\"></h1></div>\n" +
    "    <div ng-if=\"!isLoading\" ng-transclude></div>\n" +
    "</div>\n"
  );


  $templateCache.put('app/partials/mobile_pre_header.html',
    "<!-- Mobile login -->\n" +
    "<div class='ru-drop ru-drop-hide fixed no-print' id='mobile-login-form' ng-include=\"'/partials/login.html'\"></div>\n" +
    "<!-- Mobile search -->\n" +
    "<div class='ru-drop ru-drop-hide no-print' id='mobile-search-form' ng-controller=\"GlobalSearchController\">\n" +
    "    <div class='row'>\n" +
    "    <div class='small-16 columns ru-toppad-6'>\n" +
    "        <form ng-submit=\"hideMobileSearchForm(); triggerSearch()\">\n" +
    "            <label class='ru-drop-big-label'>Search\n" +
    "                <input type=\"text\" ng-model=\"models.query\" />\n" +
    "            </label>\n" +
    "            <div>\n" +
    "                <span class=\"ru-drop-check\">\n" +
    "                        <input id=\"checkbox2\" name=\"checkbox2\" ng-model=\"models.includeQuestions\" type=\"checkbox\">\n" +
    "                        <label for='checkbox2'></label>\n" +
    "                    </span>\n" +
    "                    <label class='ru-drop-big-label'> Problems only</label>\n" +
    "            </div>\n" +
    "            <div>\n" +
    "                <span class=\"ru-drop-check\">\n" +
    "                        <input id=\"checkbox3\" name=\"checkbox1\" ng-model=\"models.includeConcepts\" type=\"checkbox\">\n" +
    "                        <label for='checkbox3'></label>\n" +
    "                    </span>\n" +
    "                    <label class='ru-drop-big-label'> Concepts only</label>\n" +
    "            </div>\n" +
    "            <div class=\"ru-toppad-3\">\n" +
    "                <input class='button expand ru-drop-big-button' type='submit' value=\"Search\">\n" +
    "            </div>\n" +
    "        </form>\n" +
    "    </div>\n" +
    "    </div>\n" +
    "    <div class='ru-toppad-8'></div>\n" +
    "</div>\n"
  );


  $templateCache.put('app/partials/school_dropdown.html',
    "<div>\n" +
    "\t<input ng-hide=\"selection.school\" type=\"text\" ng-model=\"searchText\">\n" +
    "\t<div ng-show=\"selection.school\" class=\"account-school\">\n" +
    "\t\t<span>{{selection.school.name}}</span> <span>{{selection.school.postcode}}</span> <a href=\"javascript:void(0);\" class=\"account-school-remove\" ng-click=\"selection.school = null\">x</a>\n" +
    "\t</div>\n" +
    "\t<ul class=\"account-school-options\">\n" +
    "\t\t<li ng-repeat=\"school in searchResults\" ng-click=\"selection.school=school\">\n" +
    "\t\t\t<span>{{school.name}}</span>\n" +
    "\t\t\t<span>{{school.postcode}}</span>\n" +
    "\t\t</li>\n" +
    "\t</ul>\n" +
    "</div>"
  );

}]);
