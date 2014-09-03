({

    baseUrl: 'app/js/',
    mainConfigFile: 'app/js/isaac.js',

    name: "app/app",
    out: "app/js/isaac.js",
    findNestedDependencies: true,
    //optimize: "none",
    optimize: "uglify",

    insertRequire: ["app/app"],
})