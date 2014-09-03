module.exports = function(grunt) {
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
      grunt: { files: ['Gruntfile.js'] },

      sass: {
        files: 'scss/**/*.scss',
        tasks: ['sass', 'bell']
      }
    },

    ngtemplates:  {
      "isaac.templates":        {
        src:      'app/partials/**/*.html',
        dest:     'app/js/templates.js',
        options: {
          url: function(u) { return u.replace("app/partials", "/partials"); },
          bootstrap: function(module, script) {
            return 'define([], function() { angular.module("isaac.templates",[]).run(["$templateCache", function($templateCache) {' + script + '}])});';
          },
          htmlmin: {
            collapseBooleanAttributes:      true,
            collapseWhitespace:             true,
            removeAttributeQuotes:          true,
            removeComments:                 true,
            removeRedundantAttributes:      true,
            removeScriptTypeAttributes:     true,
            removeStyleLinkTypeAttributes:  true
          },
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-bell');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-angular-templates');

  grunt.registerTask('build', ['sass']);
  grunt.registerTask('default', ['build','watch']);
}