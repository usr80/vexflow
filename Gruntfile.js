// Gruntfile for VexFlow.
// Mohit Muthanna Cheppudira <mohit@muthanna.com>

module.exports = function(grunt) {
  var path = require('path');
  var L = grunt.log.writeln;
  var BANNER = '/**\n' +
                ' * VexFlow <%= pkg.version %> built on <%= grunt.template.today("yyyy-mm-dd") %>.\n' +
                ' * Copyright (c) 2010 Mohit Muthanna Cheppudira <mohit@muthanna.com>\n' +
                ' *\n' +
                ' * http://www.vexflow.com  http://github.com/0xfe/vexflow\n' +
                ' */\n';
  var BASE_DIR = __dirname;
  var BUILD_DIR = path.join(BASE_DIR, 'build');
  var RELEASE_DIR = path.join(BASE_DIR, 'releases');
  var MODULE_ENTRY = path.join(BASE_DIR, 'src/index.js');
  var TARGET_RAW = path.join(BUILD_DIR, 'vexflow-debug.js');
  var TARGET_MIN = path.join(BUILD_DIR, 'vexflow-min.js');
  var TARGET_TESTS = path.join(BUILD_DIR, 'vexflow-tests.js');

  var SOURCES = ["src/*.js", "!src/header.js", "!src/container.js"];

  var TEST_SOURCES = [
    "tests/vexflow_test_helpers.js", "tests/mocks.js",
    "tests/*_tests.js", "tests/run.js"];

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        banner: BANNER,
        sourceMap: true
      },
      tests: {
        src: TEST_SOURCES,
        dest: TARGET_TESTS
      }
    },
    rollup: {
      options: {
        banner: BANNER,
        format: 'umd',
        moduleName: 'Vex',
        sourceMap: true,
        sourceMapFile: TARGET_RAW
      },
      files: {
        src: MODULE_ENTRY,
        dest: TARGET_RAW
      }
    },
    uglify: {
      options: {
        banner: BANNER,
        sourceMap: true
      },
      build: {
        src: TARGET_RAW,
        dest: TARGET_MIN
      }
    },
    jshint: {
      files: SOURCES,
      options: {
        esversion: 6,
        eqnull: true,   // allow == and ~= for nulls
        sub: true,      // don't enforce dot notation
        trailing: true, // no more trailing spaces
        globals: {
          "Vex": false,
          "Raphael": false
         }
      }
    },
    qunit: {
      files: ['tests/flow.html']
    },
    watch: {
      scripts: {
        files: ['src/*', 'Gruntfile.js'],
        tasks: ['concat:vexflow'],
        options: {
          interrupt: true
        }
      },
      tests: {
        files: ['tests/*'],
        tasks: ['concat:tests'],
        options: {
          interrupt: true
        }
      }
    },
    copy: {
      release: {
        files: [
          {
            expand: true,
            dest: RELEASE_DIR,
            cwd: BUILD_DIR,
            src    : ['*.js', 'docs/**', '*.map']
          }
        ]
      }
    },
    docco: {
      src: SOURCES,
      options: {
        layout: 'linear',
        output: 'build/docs'
      }
    },
    gitcommit: {
      releases: {
        options: {
          message: "Committing release binaries for new version: <%= pkg.version %>",
          verbose: true
        },
        files: [
          {
            src: [RELEASE_DIR + "/*.js", RELEASE_DIR + "/*.map"],
            expand: true
          }
        ]
      }
    },
    bump: {
      options: {
        files: ['package.json', 'component.json'],
        commitFiles: ['package.json', 'component.json'],
        updateConfigs: ['pkg'],
        createTag: false,
        push: false
      }
    },
    release: {
      options: {
        bump: false,
        commit: false
      }
    },
    clean: [BUILD_DIR],
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-rollup');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-docco');
  grunt.loadNpmTasks('grunt-release');
  grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-git');

  // Default task(s).
  grunt.registerTask('default', ['jshint', 'rollup', 'concat', 'uglify', 'docco']);
  grunt.registerTask('test', 'Run qunit tests.', ['rollup', 'concat', 'qunit']);

  // Release current build.
  grunt.registerTask('stage', 'Stage current binaries to releases/.', function() {
    grunt.task.run('default');
    grunt.task.run('copy:release');
  });

  // Increment package version and publish to NPM.
  grunt.registerTask('publish', 'Publish VexFlow NPM.', function() {
    grunt.task.run('bump');
    grunt.task.run('stage');
    grunt.task.run('test');
    grunt.task.run('gitcommit:releases');
    grunt.task.run('release');
  });
};
