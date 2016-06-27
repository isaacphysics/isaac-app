// Configure the SystemJS framework.
// Note that this config is used for on-the-fly compilation in the browser
// and also for building production bundles with build.js

System.config({
    
    // This section configures the TypeScript compiler.
    transpiler: 'typescript',

    typescriptOptions: {
        "sourceMap": true,
        "emitDecoratorMetadata": true,
        "experimentalDecorators": true,
        "removeComments": false,
        "noImplicitAny": false
    },

    // Configure default extensions so we can use old-style imports.
    packages: {
        "app": {
            defaultExtension: 'js'
        },
        "lib": {
            defaultExtension: 'js'
        },
        "bower_components/jquery-ui": {
            defaultExtension: 'min.js'
        }
    },

    // Allow us to refer to some packages with short aliases.
    map: {
        "app": "js/app",
        "lib": "js/lib",
        "jquery": 'bower_components/jquery/dist/jquery.min.js',
        "angular": 'bower_components/angular/angular.js',
        "angular-ui-router": 'bower_components/angular-ui-router/release/angular-ui-router.js',
        "angular-resource": 'bower_components/angular-resource/angular-resource.js',
        "angular-recursion": 'bower_components/angular-recursion/angular-recursion.js',
        "angular-cookies": 'bower_components/angular-cookies/angular-cookies.js',
        "angular-ui-date" : 'bower_components/angular-ui-date/src/date.js',
        "angular-google-maps": 'bower_components/angular-google-maps/dist/angular-google-maps.min.js',
        "foundation": 'bower_components/foundation/js/foundation.js',
        "d3" : 'bower_components/d3/d3.js',
        "owl-carousel2" : "bower_components/owl.carousel/dist/owl.carousel.js",
        "angulartics": 'bower_components/angulartics/src/angulartics.js',
        "angulartics-ga": 'bower_components/angulartics/src/angulartics-ga.js',
        "jquery-ui-datepicker" : 'bower_components/jquery-ui/ui/minified/datepicker.min.js',
        "modernizr": 'bower_components/modernizr/modernizr.js',
        "lodash": 'bower_components/lodash/dist/lodash.min.js',  
        "typescript": 'js/lib/typescript.js',
        "reflect": 'bower_components/reflect-metadata/Reflect.js',
        "inequality": 'ts/inequality/Inequality.ts',
        "p5": "js/lib/p5.min.js",
    },

    // Define any dependencies of legacy libraries, and make sure some are imported globally.
    meta: {
        'app/*': { deps: ['jquery', 'p5'], format: 'amd' },
        'lib/*': { format: 'global' },

        "inequality": { deps: ['p5'] },

        'typescript': { deps: ['reflect'] },
        'reflect': { format: 'global' },
        "foundation": { deps: ['jquery', 'modernizr'], format: 'global'},
        "owl-carousel2" : { deps: ['jquery', 'angular', 'foundation'], format: 'global'},
        "angular-resource": { deps: ['angular'], format: 'global'},
        "angular-ui-router": { deps: ['angular'], format: 'global'},
        "angular": { deps: ['jquery'], format: 'global'},
        "angular-ui-date": { deps: ['angular', 'jquery-ui-datepicker'], format: 'global'},
        "angulartics-ga": { deps: ["angulartics"], format: 'global'},
        "angulartics": { deps: ["angular"], format: 'global'},
        "angular-recursion": { deps: ["angular"], format: 'global'},
        "angular-cookies": { deps: ["angular"], format: 'global'},
        "angular-google-maps": { deps: ["angular", "lodash"], format: 'global'},
        "lib/showdown/extensions/table": { deps: ["lib/showdown/showdown"], format: 'global'},
        "templates": { deps: ['angular'], format: 'global'},
        "lib/opentip-jquery": { deps: ['angular'], format: 'global'},
        "p5": { format: 'global' },
    }
});
