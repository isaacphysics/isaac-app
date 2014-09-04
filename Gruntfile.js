module.exports = function(grunt) {

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
          collapseWhitespace:             true,
          removeAttributeQuotes:          true,
          removeEmptyAttributes:          true,
          removeComments:                 true,
          removeRedundantAttributes:      true,
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
        dest: 'dist-app/js/templates.js',
      }
    },

    requirejs: {
      options: {
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
          out: "dist-app/js/isaac.js",
          optimize: "uglify",
          paths: {
            "templates": "../../dist-app/js/templates",
          }
        },
      },
    },

    clean: {
      dist: ["dist-app/**", "dist-app.tar.gz"],
      distPartials: ["dist-app/partials/**"],
    },

    copy: {
      dist: {
        files: [{
          expand: true,
          cwd: 'app/',
          src: ['**'],
          dest: 'dist-app/',
          filter: 'isFile',
          dot: true,
        }]
      }
    },

    compress: {
      dist: {
        options: {
          archive: 'dist-app.tar.gz',
        },
        files: [{
          expand: true,
          cwd: 'dist-app/',
          src: ["**"],
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