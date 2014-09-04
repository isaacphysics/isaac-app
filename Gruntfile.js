module.exports = function(grunt) {

  var distOutputDir = "dist";
  var distOutputFile = "app.tar.gz";

  var requestLogger = function(req) {
    console.log('[%s] %s', (new Date).toUTCString(), req.url.cyan);
  }

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    sass: {
      options: {
        includePaths: ["app/bower_components/foundation/scss"],
          sourceMap: true
      },
      dist: {
        options: {
          outputStyle: 'compressed',
          sourceMap: true
        },
        files: {
          'app/css/app.css': 'scss/app.scss'
        }        
      }
    },

    watch: {
      options: {
        atBegin: true,
      },

      sass: {
        files: 'scss/**/*.scss',
        tasks: ['sass', 'bell']
      }
    },

    ngtemplates:  {
      options: {
        url: function(u) { return u.replace("app/partials", "/partials"); },
        bootstrap: function(module, script) {
          return 'define([], function() { angular.module("isaac.templates",[]).run(["$templateCache", function($templateCache) {' + script + '}])});';
        },
        htmlmin: {
          collapseBooleanAttributes:      true,
          collapseWhitespace:             false, // This removes spaces before tags, which we often rely on. Maybe we shouldn't.
          removeAttributeQuotes:          true,
          removeEmptyAttributes:          true,
          removeComments:                 true,
          removeRedundantAttributes:      false, // This removes type="text" on inputs, which prevents CSS being applied properly.
          removeScriptTypeAttributes:     true,
          removeStyleLinkTypeAttributes:  true
        },
      },
      local: {
        src: 'app/partials/**/*.html',
        dest: 'app/js/templates.js',
      },
      dist: {
        src: 'app/partials/**/*.html',
        dest: distOutputDir + '/app/js/templates.js',
      }
    },

    requirejs: {
      options: {
//        logLevel: 0, // Enable this line to see all debug output from requirejs optimiser
        baseUrl: 'app/js/',
        mainConfigFile: 'app/js/isaac.js',

        name: "app/app",
        findNestedDependencies: true,

        insertRequire: ["app/app"],

      },
      local: {
        options: {
          out: "app/js/isaac.js",
          optimize: "none",
        },
      },
      dist: {
        options: {
          out: distOutputDir + "/app/js/isaac.js",
          optimize: "uglify",
          paths: {
            "templates": "../../" + distOutputDir + "/app/js/templates",
          }
        },
      },
    },

    clean: {
      dist: [distOutputDir + "/**", distOutputFile],
      distPartials: [distOutputDir + "/app/partials/**"],
    },

    copy: {
      dist: {
        files: [{
          expand: true,
          cwd: 'app/',
          src: ['**'],
          dest: distOutputDir + '/app/',
          filter: 'isFile',
          dot: true,
        }]
      }
    },

    compress: {
      dist: {
        options: {
          archive: distOutputFile,
        },
        files: [{
          expand: true,
          cwd: distOutputDir + "/",
          src: ['app/**'],
          dot: true,
          filter: 'isFile',
        }]
      }
    },

    'http-server': {
      dev: {
        root: "app/",
        port: 8000,
        runInBackground: false,
        logFn: requestLogger,
      }
    }
    
  });

  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-bell');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-angular-templates');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-scp');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-http-server');

  grunt.registerTask('build', ['sass']);
  grunt.registerTask('server', ['http-server']);
  grunt.registerTask('dist', ['clean:dist', 'copy:dist', 'ngtemplates:dist', 'clean:distPartials', 'requirejs:dist', 'compress:dist']);
}