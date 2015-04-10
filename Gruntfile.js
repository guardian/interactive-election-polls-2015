'use strict';
var pkg = require('./package.json');
var currentTime = +new Date();
var versionedAssetPath = 'assets-' + currentTime;
var CDN = 'http://interactive.guim.co.uk/';
var deployAssetPath = CDN + pkg.config.s3_folder + versionedAssetPath;
var localAssetPath = 'http://localhost:' + pkg.config.port + '/assets';

module.exports = function(grunt) {
  var isDev = !(grunt.cli.tasks && grunt.cli.tasks[0] === 'deploy');
  grunt.initConfig({

    connect: {
      server: {
        options: {
          port: pkg.config.port,
          hostname: '*',
          base: './build/',
          middleware: function (connect, options, middlewares) {
            // inject a custom middleware http://stackoverflow.com/a/24508523 
            middlewares.unshift(function (req, res, next) {
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Methods', '*');
                return next();
            });
            return middlewares;
          }
        }
      }
    },

    bowerRequirejs: {
        all: {
            rjsConfig: './src/js/require.js',
            options: {
                baseUrl: './src/js/'
            }
        }
    },

    sass: {
        options: {
            style: 'compressed',
            sourcemap: 'none'
        },
        build: {
            files: { 
              'build/assets/css/main.css': 'src/css/main.scss',
              //'build/assets/css/widgets.css': 'src/widgets/css/widgets.scss',
            }
        }
    },

    autoprefixer: {
        options: {
            map: (isDev) ? true : false 
        },
        css: { src: 'build/assets/css/*.css' }
    },

    clean: ['build/'],

    jshint: {
      options: {
          jshintrc: true,
          force: true 
      },
        files: [
            'Gruntfile.js',
            'src/**/*.js',
            '!src/js/require.js'
        ]
    },

    requirejs: {
      compile: {
        options: {
          baseUrl: './src/js/',
          mainConfigFile: './src/js/require.js',
          optimize: (isDev) ? 'none' : 'uglify2',
          //optimize: (isDev) ? 'none' : 'none',
          inlineText: true,
          name: 'almond',
          out: 'build/assets/js/main.js',
          generateSourceMaps: (isDev) ? true : false,
          preserveLicenseComments: true,
          useSourceUrl: (isDev) ? true : false,
          include: ['main'],
          wrap: {
            start: 'define(["require"],function(require){var req=(function(){',
            end: 'return require; }()); return req; });'
          }

        }
      }
    },

    watch: {
      scripts: {
        files: [
          'src/**/*.js',
          'src/boot.js',
          'src/**/*.json',
          'src/js/templates/*.html'
        ],
        tasks: ['jshint', 'requirejs'],
        options: {
          spawn: false,
          livereload: true
        },
      },
      html: {
        files: ['src/*.html', 'src/**/*.html'],
        tasks: ['copy', 'replace:local'],
        options: {
          spawn: false,
          livereload: true
        },
      },
      css: {
        files: ['src/css/**/*.*','src/widgets/css/**/*.*'],
        tasks: ['sass', 'autoprefixer', 'replace:local'],
        options: {
          spawn: false,
          livereload: true
        },
      }
    },

    copy: {
      build: {
        files: [
          {
              src: 'src/index.html',
              dest: 'build/index.html'
          },
          {
              src: 'bower_components/curl/dist/curl/curl.js',
              dest: 'build/assets/js/curl.js'
          },
          {
              src: 'src/boot.js',
              dest: 'build/boot.js'
          },
          {
              cwd: 'src/',
              src: 'imgs/**',
              dest: 'build/assets/',
              expand: true
          },
          {
              cwd: 'src/widgets/',
              src: '*.*',
              dest: 'build/embed/',
              expand: true
          }
        ]
      }
    },

    replace: {
        prod: {
            options: {
                patterns: [{
                  match: /@@assetPath@@/g,
                  replacement: deployAssetPath 
                }]
            },
            files: [{
                src: ['build/**/*.html', 'build/**/*.js', 'build/**/*.css'],
                dest: './'
            }]
        },
        local: {
            options: {
                patterns: [{
                  match: /@@assetPath@@/g,
                  replacement: localAssetPath
                },
                {
                  match: /\/\/pasteup\.guim\.co\.uk\/fonts\/0\.1\.0/g,
                  replacement: '/bower_components/guss-webfonts/webfonts'
                }
                ]
            },
            files: [{
                src: ['build/**/*.html', 'build/**/*.js', 'build/**/*.css'],
                dest: './'
            }]
        }

    },

    s3: {
        options: {
            access: 'public-read',
            bucket: 'gdn-cdn',
            maxOperations: 20,
            dryRun: (grunt.option('test')) ? true : false,
            headers: {
                CacheControl: 180,
            },
            gzip: true,
            gzipExclude: ['.jpg', '.gif', '.jpeg', '.png']
        },
        base: {
            files: [{
                cwd: 'build',
                src: '*.*',
                dest: pkg.config.s3_folder
            },
            {
                cwd: 'build/embed',
                src: '*.*',
                dest: pkg.config.s3_folder+"embed/"
            }]
        },
        assets: {
            options: {
                headers: {
                    CacheControl: 3600,
                }
            },
            files: [{
                cwd: 'build',
                src: versionedAssetPath + '/**/*.*',
                dest: pkg.config.s3_folder
            }]
        }
    },

    rename: {
        main: {
            files: [
                {
                    src: 'build/assets',
                    dest: 'build/' + versionedAssetPath
                }
            ]
        }
    },

  });

  // Task pluginsk
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-aws');
  grunt.loadNpmTasks('grunt-autoprefixer');
  grunt.loadNpmTasks('grunt-replace');
  grunt.loadNpmTasks('grunt-contrib-rename');
  grunt.loadNpmTasks('grunt-bower-requirejs');

  // Tasks
  grunt.registerTask('build', [
    'jshint',
    'clean',
    'sass',
    'autoprefixer',
    'bowerRequirejs',
    'requirejs',
    'copy'
  ]);
  
  grunt.registerTask('default', [
      'build',
      'replace:local',
      'connect',
      'watch'
  ]);
  
  grunt.registerTask('deploy', [
      'build',
      'rename',
      'replace:prod',
      's3'
  ]);
};

