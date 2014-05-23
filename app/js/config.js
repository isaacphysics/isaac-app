require.config({

    baseUrl: 'js/lib',

    paths: {
        "app": '../app',
        "jquery": '../../bower_components/jquery/dist/jquery',
        "modernizr": '../../bower_components/modernizr/modernizr',
        "foundation": '../../bower_components/foundation/js/foundation',
        "angular": '../../bower_components/angular/angular',
        "angular-ui-router": '../../bower_components/angular-ui-router/release/angular-ui-router',
        "angular-resource": '../../bower_components/angular-resource/angular-resource',
        "react": '../../bower_components/react/react-with-addons',
        "JSXTransformer": '../../bower_components/react/JSXTransformer',
        "angulartics": '../../bower_components/angulartics/src/angulartics',
        "angulartics-ga": '../../bower_components/angulartics/src/angulartics-ga',
        "mathjax": 'http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML',
    },

    shim: {
        "foundation": ['jquery', 'modernizr'],
        "angular-resource": ['angular'],
        "angular-ui-router": ['angular'],
        "angular": ['jquery'],
        "angulartics-ga": ["angulartics"],
        "angulartics": ["angular"]
    }
});

var app = {}

require(["app/app"]);