/**
 * Copyright 2014 Ian Davies
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at
 * 		http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
define([], function() {

	// Allow labels and numbers to be reset:
	// https://groups.google.com/forum/#!msg/mathjax-users/kzOOFw1qtxw/YdAEPJfCEXUJ

	MathJax.resetLabels = function() {
		//var AMS = MathJax.Extension["TeX/AMSmath"];
		//AMS.startNumber = 0;
		//AMS.labels = {};
	}

	// Specify where to find the official Accessibility extension:
	// MathJax.Ajax.config.path["a11y"] = "https://cdn.isaacphysics.org/vendor/mathjax/mathjax-a11y-v1.1.0";

	// Allow inline maths with single $s, define Isaac macros:
	MathJax.Hub.Config({

		config: ["TeX-AMS_HTML.js"],

		tex2jax: {
			inlineMath: [ ['$','$'], ["\\(","\\)"] ],
			displayMath: [ ['$$','$$'], ["\\[","\\]"] ],
			processEscapes: true,
			preview: ["---"],
		},
		TeX: {
			Macros: {
				// See http://docs.mathjax.org/en/latest/tex.html#defining-tex-macros
				"quantity": ["{#1}\\,{\\rm{#2}}",2],
				"valuedef": ["{#1}={\\quantity{#2}{#3}}",3],
				"vtr": ["{\\underline{\\boldsymbol{#1}}}",1],
				"d": "\\mathrm{d}",
				"vari": ["#1",1],
				"s": ["_{\\sf{#1}}", 1],
				"half": ["\\frac{1}{2}",0],
				"third": ["\\frac{1}{3}",0],
				"quarter": ["\\frac{1}{4}",0],
				"eighth": ["\\frac{1}{8}",0],
				"e": ["\\textrm{e}",0],
				"units": ["\\rm{#1}",1],
				"standardstate": ["\\mathbin{\u29B5}",0],
			},
			extensions: ["mhchem.js"],//, "[a11y]/accessibility-menu.js"],
		},
	  "HTML-CSS": {
	    availableFonts: [], 
	    preferredFont: null, // force Web fonts
	    webFont: "STIX-Web"
	  },

	// Fix font issues in Chrome 32
	// https://groups.google.com/forum/#!msg/mathjax-users/S5x-RQDPJrI/p4nmRXJvoskJ
	  extensions: ["MatchWebFonts.js"]
	});


	if (MathJax.Hub.Browser.isChrome) {
		MathJax.Hub.Register.StartupHook(
			"HTML-CSS Jax Config",
			function () {MathJax.OutputJax["HTML-CSS"].FontFaceBug = true}
		);
	}

	// Signal that we're done configuring MathJax.
	MathJax.Hub.Configured();

});

// Here is a very useful page:

// http://meta.math.stackexchange.com/questions/5020/mathjax-basic-tutorial-and-quick-reference