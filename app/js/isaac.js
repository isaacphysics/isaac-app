require.config({

    baseUrl: '/js',

    /* TODO: Fix issue with route path and jquery ui core, then remove core.js from the /js directory */
    paths: {
        "jquery": '../bower_components/jquery/dist/jquery',
        "jquery-ui-datepicker" : '../bower_components/jquery-ui/ui/minified/datepicker.min',
        "modernizr": '../bower_components/modernizr/modernizr',
        "foundation": '../bower_components/foundation/js/foundation',
        "angular": '../bower_components/angular/angular',
        "angular-ui-router": '../bower_components/angular-ui-router/release/angular-ui-router',
        "angular-resource": '../bower_components/angular-resource/angular-resource',
        "angular-recursion": '../bower_components/angular-recursion/angular-recursion',
        "angular-animate": '../bower_components/angular-animate/angular-animate',
        "angular-cookies": '../bower_components/angular-cookies/angular-cookies',
        "angular-ui-date" : '../bower_components/angular-ui-date/src/date',
        "JSXTransformer": '../bower_components/react/JSXTransformer',
        "angulartics": '../bower_components/angulartics/src/angulartics',
        "angulartics-ga": '../bower_components/angulartics/src/angulartics-ga',
        "fastclick" : '../bower_components/fastclick/lib/fastclick',
    },

    shim: {
        "foundation": ['jquery', 'modernizr'],
        "angular-resource": ['angular'],
        "angular-ui-router": ['angular'],
        "angular": ['jquery'],
        "angular-ui-date": ['angular', 'jquery-ui-datepicker'],
        "angulartics-ga": ["angulartics"],
        "angulartics": ["angular"],
        "angular-recursion": ["angular"],
        "angular-animate": ["angular"],
        "angular-cookies": ["angular"],
        "lib/showdown/extensions/table": ["lib/showdown/showdown"],
        "templates": ['angular'],
    }
});

var app = {}

require(["app/app"]);