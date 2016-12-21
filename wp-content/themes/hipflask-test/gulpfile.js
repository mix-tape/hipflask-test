// --------------------------------------------------------------------------
//
//  Gulp Config
//    Default build for development will watch and recompile, with debug
//    information on each change of local styleheets + javascript files.
//
// --------------------------------------------------------------------------


var gulp = require('gulp'),
    plugins = require('gulp-load-plugins')(),
    mainBowerFiles = require('main-bower-files'),
    browserSync = require('browser-sync'),
    reload = browserSync.reload,
    path = require('path'),
    fs = require("fs")


// --------------------------------------------------------------------------
//   Configuration
// --------------------------------------------------------------------------

var bowerrc = JSON.parse(fs.readFileSync('.bowerrc', 'utf8'))

var config = {
  styles: './assets/styles',
  scripts: './assets/scripts',
  images: './assets/images',
  icons: './assets/icons',
  vendor: bowerrc.directory
}


// --------------------------------------------------------------------------
//   Browser Sync
// --------------------------------------------------------------------------

gulp.task('browser-sync', () => {

  // Load development URL from secrets

  var secrets = JSON.parse(fs.readFileSync('../../../secrets.json', 'utf8'))
  config.url = secrets.development.url

  // Watch these files and trigger reload

  var files = [
        '**/*.php',
        '**/*.{png,jpg,gif}'
      ]

  browserSync.init({

    // Read here http://www.browsersync.io/docs/options/
    proxy: config.url,
    open: 'external',
    files: files,
    // host: "192.168.0.114",

    port: 3002,

    // Tunnel the Browsersync server through a random Public URL
    // tunnel: true,

    // Attempt to use the URL "http://my-private-site.localtunnel.me"
    // tunnel: "ppress",

    // Inject CSS changes
    injectChanges: true,

    // Fix cross origin resource issues
    middleware: (req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*')
      next()
    },

    // Place browsersync snippet at bottom to fix a conflict with the IE8 conditional body tag
    snippetOptions: {
      whitelist: ['/wp-admin/admin-ajax.php'],
      rule: {
        match: /<\/body>/i,
        fn: (snippet, match) => { return snippet + match }
      }
    }

  })
})


// --------------------------------------------------------------------------
//   Lint SCSS
// --------------------------------------------------------------------------

gulp.task('lint-styles', () => {

  return gulp.src( [ config.styles + '/**/*.scss', '!' + config.styles + '/**/_print.scss' ] )
    .pipe( plugins.sassLint({
      configFile: '.scss-lint-config.yml',
    }))
    .pipe( plugins.sassLint.format() )
    .pipe( plugins.sassLint.failOnError())
    .on("error", plugins.notify.onError('SASS Lint Error!'))
})


// --------------------------------------------------------------------------
//   Compile SCSS into CSS stylesheet
// --------------------------------------------------------------------------

gulp.task('styles', () => {

  return gulp.src( config.styles + '/main.scss' )
    .pipe( plugins.plumber() )
    .pipe( plugins.cssGlobbing({
      extensions: ['.css', '.scss']
    }))
    .pipe( plugins.sourcemaps.init() )
    .pipe( plugins.sass({
      style: 'expanded',
      quiet: true,
      includePaths: [ config.vendor ]
    })
    .on( 'error', plugins.sass.logError)
    .on( 'error', plugins.notify.onError('SCSS Error!') ) )
    .pipe( plugins.sourcemaps.init({ loadMaps: true }) )
    .pipe( plugins.groupCssMediaQueries() )
    .pipe( plugins.autoprefixer("last 3 version", "> 1%", "ie 8", "ie 7") )
    .pipe( plugins.rename('styles.css') )
    .pipe( plugins.sourcemaps.write('./') )
    .pipe( gulp.dest( config.styles ) )
    .pipe( browserSync.reload({stream:true}) )
})


// --------------------------------------------------------------------------
//   Minify CSS stylesheet
// --------------------------------------------------------------------------

gulp.task('compress-styles', ['styles'], () => {

  return gulp.src( config.styles + '/styles.css' )
    .pipe( plugins.plumber() )
    .pipe( plugins.cssnano() )
    .pipe( gulp.dest( config.styles ) )
    .pipe( plugins.parker() )
})

// --------------------------------------------------------------------------
//   Lint JS
// --------------------------------------------------------------------------

gulp.task('lint-scripts', function() {

  return gulp.src([config.scripts + '/**/*.js', '!' + config.scripts + '/global.js'])
    .pipe(plugins.eslint('.eslintrc.yml'))
    .pipe(plugins.eslint.format())
    .pipe(plugins.eslint.failAfterError())
    .on("error", plugins.notify.onError('ESLint Error!'))
})

// --------------------------------------------------------------------------
//   Concat all user script files required into `global.js`
// --------------------------------------------------------------------------

gulp.task('scripts', () => {

  var scripts = mainBowerFiles( { filter: /.*\.js$/i } )

  scripts.push( config.scripts + '/utilities/*.js', config.scripts + '/modules/*.js' )

  return gulp.src( scripts )
    .pipe( plugins.plumber() )
    .pipe( plugins.sourcemaps.init() )
    .pipe( plugins.babel({
      presets: ['latest']
    }))
    .pipe( plugins.order( ['*jquery.js*', '*angular.js*', 'init.js'] ) )
    .pipe( plugins.concat('global.js') )
    .pipe( plugins.sourcemaps.write( '.' ) )
    .pipe( gulp.dest( config.scripts ) )
})

gulp.task('scripts-reload', ['scripts'], () => {
  browserSync.reload()
})


// --------------------------------------------------------------------------
//   Minify `global.js`
// --------------------------------------------------------------------------

gulp.task('compress-scripts', ['scripts'], () => {

  return gulp.src( config.scripts + '/global.js' )
    .pipe( plugins.plumber() )
    .pipe( plugins.uglify({
      mangle: true,
      compress: true,
      preserveComments: false
    }))
    .pipe( gulp.dest( config.scripts ) )
})


// --------------------------------------------------------------------------
//   Optimise all images
// --------------------------------------------------------------------------

gulp.task('images', () => {

  return gulp.src([
      config.images + "/*",
      config.images + "/**/*"] )
    .pipe( plugins.plumber() )
    .pipe( plugins.imagemin({
      optimizationLevel: 5,
      progressive: true
    }))
    .pipe( gulp.dest(config.images) )
})


// --------------------------------------------------------------------------
//   Compile Fonts
// --------------------------------------------------------------------------

gulp.task('icons', () => {

  gulp.src( [ config.icons + '/svg/*.svg'] )
    .pipe( plugins.iconfont({
      fontName: 'icons',
      fontHeight: 150,
      normalize: true,
      descent: 0
    }))
    .on('glyphs', (glyphs, options) => {

      var options = {
            glyphs: glyphs,
            fontName: 'icons',
            fontPath: '../icons/font/',
            className: 'icon'
          }

      gulp.src( config.icons + '/templates/icons.scss' )
        .pipe( plugins.consolidate('lodash', options) )
        .pipe( plugins.rename('_icons.scss') )
        .pipe( gulp.dest( config.styles + '/base/') )

      gulp.src( config.icons + '/templates/icons.css' )
        .pipe( plugins.consolidate('lodash', options) )
        .pipe( plugins.rename('icons.css') )
        .pipe( gulp.dest( config.icons + '/css/') )

      gulp.src( config.icons + '/templates/icons.html' )
        .pipe( plugins.consolidate('lodash', options) )
        .pipe( gulp.dest( config.icons + '/demo/') )

    })
    .pipe( gulp.dest( config.icons + '/font/') )
})


// --------------------------------------------------------------------------
//   Watch
// --------------------------------------------------------------------------

gulp.task('watch-styles', () => {

  return plugins.watch( config.styles + '/**/*.scss', () => {
    gulp.start('styles')
  })

})

gulp.task('watch-scripts', () => {

  return plugins.watch( ['./bower.json', config.scripts + '/**/*.js', '!' + config.scripts + '/global.js'], () => {
    gulp.start('scripts-reload')
  })

})


// --------------------------------------------------------------------------
//   Run development level tasks, and watch for changes
// --------------------------------------------------------------------------

gulp.task('default', [ 'styles', 'scripts', 'browser-sync', 'watch-styles', 'watch-scripts' ])


// --------------------------------------------------------------------------
//   Run production tasks including minfication, and without watch
// --------------------------------------------------------------------------

gulp.task('build', [ 'compress-styles', 'compress-scripts' ])
