'use strict';

var gulp = require('gulp');

var $ = require('gulp-load-plugins')({
  pattern: ['gulp-*', 'main-bower-files', 'uglify-save-license', 'del']
});

gulp.task('styles', ['wiredep', 'injector:css:preprocessor'], function () {
  return gulp.src(['src/app/index.scss', 'src/app/vendor.scss'])
    .pipe($.sass({style: 'expanded'}))
    .on('error', function handleError(err) {
      console.error(err.toString());
      this.emit('end');
    })
    .pipe($.autoprefixer())
    //This regex replaces all relative paths following a url in css with only one level of relative path ../../../ -> ../
    .pipe($.replace(/(: url)\((..\/)+([^\)]+)\)/g, '$1(../$3)'))
    .pipe(gulp.dest('.tmp/app/'));
});

gulp.task('injector:css:preprocessor', function () {
  return gulp.src('src/app/index.scss')
    .pipe($.inject(gulp.src([
        'src/{app,components}/**/*.scss',
        '!src/app/index.scss',
        '!src/app/vendor.scss' 
      ], {read: false}), {
      transform: function(filePath) {
        filePath = filePath.replace('src/app/', '');
        filePath = filePath.replace('src/components/', '../components/');
        return '@import \'' + filePath + '\';';
      },
      starttag: '// injector',
      endtag: '// endinjector',
      addRootSlash: false
    }))
    .pipe(gulp.dest('src/app/'));
});

gulp.task('injector:css', ['styles'], function () {
  return gulp.src('src/index.html')
    .pipe($.inject(gulp.src([
        '.tmp/{app,components}/**/*.css',
        '!.tmp/app/vendor.css'
      ], {read: false}), {
      ignorePath: '.tmp',
      addRootSlash: false
    }))
    .pipe(gulp.dest('src/'));
});

gulp.task('scripts', function () {
  return gulp.src('src/{app,components}/**/*.js')
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'));
});

gulp.task('injector:js', ['scripts', 'injector:css'], function () {
  return gulp.src(['src/index.html', '.tmp/index.html'])
    .pipe($.inject(gulp.src([
      'src/{app,components}/**/*.js',
      '!src/{app,components}/**/*.spec.js',
      '!src/{app,components}/**/*.mock.js'
    ]).pipe($.angularFilesort()), {
      ignorePath: 'src',
      addRootSlash: false
    }))
    .pipe(gulp.dest('src/'));
});

gulp.task('partials', function () {
  return gulp.src(['src/{app,components}/**/*.html', '.tmp/{app,components}/**/*.html'])
    .pipe($.minifyHtml({
      empty: true,
      spare: true,
      quotes: true
    }))
    .pipe($.angularTemplatecache('templateCacheHtml.js', {
      module: 'teacherdashboard'
    }))
    .pipe(gulp.dest('.tmp/inject/'));
});

gulp.task('html', ['wiredep', 'injector:css', 'injector:js', 'partials'], function () {
  var htmlFilter = $.filter('*.html');
  var jsFilter = $.filter('**/*.js');
  var cssFilter = $.filter('**/*.css');
  var assets;

  return gulp.src(['src/*.html', '.tmp/*.html'])
    .pipe($.inject(gulp.src('.tmp/inject/templateCacheHtml.js', {read: false}), {
      starttag: '<!-- inject:partials -->',
      ignorePath: '.tmp',
      addRootSlash: false
    }))
    .pipe(assets = $.useref.assets())
    .pipe($.rev())
    .pipe(jsFilter)
    .pipe($.ngAnnotate())
    .pipe($.uglify({preserveComments: $.uglifySaveLicense}))
    .pipe(jsFilter.restore())
    .pipe(cssFilter)
    .pipe($.replace('../../bower_components/bootstrap-sass-official/assets/fonts/bootstrap','../fonts'))
    .pipe($.csso())
    .pipe(cssFilter.restore())
    .pipe(assets.restore())
    .pipe($.useref())
    .pipe($.revReplace())
    .pipe(htmlFilter)
    .pipe($.minifyHtml({
      empty: true,
      spare: true,
      quotes: true
    }))
    .pipe(htmlFilter.restore())
    .pipe(gulp.dest('dist/'))
    .pipe($.size({ title: 'dist/', showFiles: true }));
});

gulp.task('images', function () {
  return gulp.src('src/assets/images/**/*')
    .pipe($.imagemin({
      optimizationLevel: 3,
      progressive: true,
      interlaced: true
    }))
    .pipe(gulp.dest('dist/assets/images/'));
});

gulp.task('fonts', function () {
  return gulp.src($.mainBowerFiles())
    .pipe($.filter('**/*.{eot,svg,ttf,woff}'))
    .pipe($.flatten())
    .pipe(gulp.dest('dist/fonts/'));
});

gulp.task('misc', function () {
  return gulp.src('src/**/*.ico')
    .pipe(gulp.dest('dist/'));
});

gulp.task('clean', function (done) {
  $.del(['dist/', '.tmp/'], done);
});

gulp.task('build', ['html', 'images', 'fonts', 'misc']);
