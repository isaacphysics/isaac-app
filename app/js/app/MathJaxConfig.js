define(["mathjax"], function() {

	// Allow labels and numbers to be reset:
	// https://groups.google.com/forum/#!msg/mathjax-users/kzOOFw1qtxw/YdAEPJfCEXUJ

	MathJax.resetLabels = function() {
		//var AMS = MathJax.Extension["TeX/AMSmath"];
		//AMS.startNumber = 0;
		//AMS.labels = {};
	}

	// Allow inline maths with single $s

	MathJax.Hub.Config({
		tex2jax: {
		inlineMath: [ ['$','$'], ["\\(","\\)"] ],
		displayMath: [ ['$$','$$'], ["\\[","\\]"] ],
		processEscapes: true,
		},
		TeX: {
			Macros: {
				// See http://docs.mathjax.org/en/latest/tex.html#defining-tex-macros
				"quantity": ["{#1}\\,{\\sf{#2}}",2],
				"valuedef": ["{#1}={\\quantity{#2}{#3}}",3],
				"vtr": ["{\\underline{\\boldsymbol{#1}}}",1],
				"d": "\\operatorname{d}",
				"vari": ["#1",1],
				"s": ["_{\\sf{#1}}", 1],
				"half": ["\\frac{1}{2}",0],
				"third": ["\\frac{1}{3}",0],
				"quarter": ["\\frac{1}{4}",0],
				"eighth": ["\\frac{1}{8}",0],
				"e": ["\\textrm{e}",0],
			}
		},
	});

	// Fix font issues in Chrome 32
	// https://groups.google.com/forum/#!msg/mathjax-users/S5x-RQDPJrI/p4nmRXJvoskJ

	MathJax.Hub.Config({
		extensions: ["MatchWebFonts.js"]
	});

	if (MathJax.Hub.Browser.isChrome && MathJax.Hub.Browser.version.substr(0,3) === "32.") {
		MathJax.Hub.Register.StartupHook(
			"HTML-CSS Jax Config",
			function () {MathJax.OutputJax["HTML-CSS"].FontFaceBug = true}
		);
	}

});

// Here is a very useful page:

// http://meta.math.stackexchange.com/questions/5020/mathjax-basic-tutorial-and-quick-reference