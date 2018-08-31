var webpackConfig = require('../webpack.config.js')('development');

module.exports = function(config){
  config.set({

    basePath : '../',

    frameworks: ['jasmine'],
    browsers : ['Chrome'],

    webpack: webpackConfig,
    files : [
      // 'app/node_modules/angular-ui-router/angular-route.js',
      'app/node_modules/angular/angular.js',
      'app/node_modules/angular-mocks/angular-mocks.js',
      './isaac.js',
      'test/unit/**/*.js'
    ],

    preprocessors: {
      'app/node_modules/angular/angular.js': [webpack],
      'app/node_modules/angular-mocks/angular-mocks.js': [webpack],
      './isaac.js': ['webpack'],
      './test/unit/**/*.js': ['webpack']
    },

    // plugins : [
    //   'karma-chrome-launcher',
    //   'karma-firefox-launcher',
    //   'karma-jasmine',
    //   'karma-junit-reporter',
    //   'karma-webpack'
    // ],

    // junitReporter : {
    //   outputFile: 'test_out/unit.xml',
    //   suite: 'unit'
    // }

  });
};