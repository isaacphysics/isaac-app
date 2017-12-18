module.exports = function(grunt) {

  var distOutputDir = "dist";

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    sass: {
      options: {
        includePaths: ["app/bower_components/foundation/scss"],
      },
      dist: {
        options: {
          outputStyle: 'compressed',
          sourceMap: true,
        },
        files: {
          'app/css/app.css': 'scss/app.scss'
        }        
      }
    },


    // In order to compile clojurescript, you will need "lein" on your path:
    // http://leiningen.org/#install
    exec: {
      watchcljs: {
        cmd: "lein cljsbuild auto",
        cwd: "equation_parser",
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

    clean: {
      dist: [distOutputDir + "/**"],
      distPartials: [distOutputDir + "/app/partials/**"],
      localBackup: ["app/**/*.localbackup"],
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
      },

      backupLocal: {
        files: {
          "app/js/templates.js.localbackup": "app/js/templates.js"
        }
      },
      restoreLocal: {
        files: {
          "app/js/templates.js": "app/js/templates.js.localbackup"
        }
      }

    },
    
  });

  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-bell');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-angular-templates');
  grunt.loadNpmTasks('grunt-scp');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('compile', function() {
    var path = require("path");
    var Builder = require('systemjs-builder');

    // Bundle just our app into a single file, isaac.js.
    var src = './dist/app/js/app/app.js';
    var dest = './dist/app/js/isaac.js';
    var opts = {
      minify: true,
      sourceMaps: true
    };

    // optional constructor options
    // sets the baseURL and loads the configuration file
    var builder = new Builder('dist/app', 'dist/app/js/system.config.js');

    var done = this.async();

    builder
    .bundle(src, dest, opts)
    .then(function() {
      console.log('Build complete');
      done();
    })
    .catch(function(err) {
      console.log('Build error');
      console.error(err);
      done(false);
    });

  });

  grunt.registerTask('build', ['sass']);
  grunt.registerTask('dist', ['clean:dist', 'copy:restoreLocal', 'clean:localBackup', 'copy:dist', 'ngtemplates:dist', 'clean:distPartials', 'compile']);
  grunt.registerTask('watchcljs', ['exec:watchcljs']);

  grunt.registerTask('segue-version', 'Get the version of the segue api that this package depends on.', function() {
    grunt.log.write("segueVersion:" + grunt.file.readJSON('package.json').segueVersion);
  });
}
