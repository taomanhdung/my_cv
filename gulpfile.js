var gulp = require('gulp');
var less = require('gulp-less');
var browserSync = require('browser-sync').create();
var header = require('gulp-header');
var cleanCSS = require('gulp-clean-css');
var rename = require("gulp-rename");
var uglify = require('gulp-uglify');
var pkg = require('./package.json');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var jpegtran = require('imagemin-jpegtran');
var gifsicle = require('imagemin-gifsicle');
var minifyHTML = require('gulp-minify-html');
var fs = require('fs');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var cache = require('gulp-cache');
var parallel = require("concurrent-transform");


// Set the banner content
var banner = ['/*!\n',
    ' * Start Bootstrap - <%= pkg.title %> v<%= pkg.version %> (<%= pkg.homepage %>)\n',
    ' * Copyright 2013-' + (new Date()).getFullYear(), ' <%= pkg.author %>\n',
    ' * Licensed under <%= pkg.license.type %> (<%= pkg.license.url %>)\n',
    ' */\n',
    ''
].join('');

// Compile LESS files from /less into /css
gulp.task('less', function() {
    return gulp.src('less/grayscale.less')
        .pipe(less())
        .pipe(header(banner, { pkg: pkg }))
        .pipe(gulp.dest('css'))
        .pipe(browserSync.reload({
            stream: true
        }))
});

// Minify compiled CSS
gulp.task('minify-css', ['less'], function() {
    return gulp.src('css/grayscale.css')
        .pipe(cleanCSS({ compatibility: 'ie8' }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('css'))
        .pipe(browserSync.reload({
            stream: true
        }))
});


/**
 * Compile files from sass into _includes then we can use Jekyll includes inline css
 */
// gulp.task('styles', function() {
//     return gulp.src('css/main.scss')
//         .pipe(sass({ outputStyle: 'compressed' }))
//         .pipe(autoprefixer({ browsers: ['last 2 versions', 'Firefox ESR', 'safari 5', 'ie 9', 'opera 12.1'] }))
//         // .pipe(gulp.dest('assets/css'))
//         // .pipe(rename({suffix: '.min'}))
//         .pipe(cleanCSS())
//         .pipe(gulp.dest('_includes'));
// });


// Minify JS
gulp.task('minify-js', function() {
    return gulp.src('js/grayscale.js')
        .pipe(uglify())
        .pipe(header(banner, { pkg: pkg }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('js'))
        .pipe(browserSync.reload({
            stream: true
        }))
});


gulp.task('optimize-images', function () {
    return gulp.src(['img/**/*.jpg', 'img/**/*.jpeg', 'img/**/*.gif', 'img/**/*.png',
                    'img/*.jpg', 'img/*.jpeg', 'img/*.gif', 'img/*.png'])
        .pipe(parallel(imagemin({
            progressive: true,
            svgoPlugins: [{ removeViewBox: false }],
            use: [pngquant()]
        })))
        // .pipe(imagemin({
        //     optimizationLevel: 5,
        //     progressive: true,
        //     interlaced: true,
        //     svgoPlugins: [{removeViewBox: false}],
        //     use: [pngquant(), jpegtran(), gifsicle()]
        // }))
        //.pipe(cache(imagemin({ optimizationLevel: 5, progressive: true, interlaced: true })))
        .pipe(gulp.dest('img/'));
});

gulp.task('optimize-html', function() {
    return gulp.src('_site/**/*.html')
        .pipe(minifyHTML({
            quotes: true
        }))
        .pipe(replace(/<link href=\"\/css\/main.css\"[^>]*>/, function(s) {
            var style = fs.readFileSync('_site/css/main.css', 'utf8');
            return '<style>\n' + style + '\n</style>';
        }))
        .pipe(gulp.dest('_site/'));
});


// Copy vendor libraries from /node_modules into /vendor
gulp.task('copy', function() {
    gulp.src(['node_modules/bootstrap/dist/**/*', '!**/npm.js', '!**/bootstrap-theme.*', '!**/*.map'])
        .pipe(gulp.dest('vendor/bootstrap'))

    gulp.src(['node_modules/jquery/dist/jquery.js', 'node_modules/jquery/dist/jquery.min.js'])
        .pipe(gulp.dest('vendor/jquery'))

    gulp.src([
            'node_modules/font-awesome/**',
            '!node_modules/font-awesome/**/*.map',
            '!node_modules/font-awesome/.npmignore',
            '!node_modules/font-awesome/*.txt',
            '!node_modules/font-awesome/*.md',
            '!node_modules/font-awesome/*.json'
        ])
        .pipe(gulp.dest('vendor/font-awesome'))
})

// Run everything
gulp.task('default', ['less', 'minify-css', 'minify-js', 'copy', 'optimize-images', 'optimize-html']);

// Configure the browserSync task
gulp.task('browserSync', function() {
    browserSync.init({
        server: {
            baseDir: ''
        },
    })
})

// Dev task with browserSync
gulp.task('dev', ['browserSync', 'less', 'minify-css', 'minify-js', 'optimize-images'], function() {
    gulp.watch('less/*.less', ['less']);
    gulp.watch('css/*.css', ['minify-css']);
    gulp.watch('js/*.js', ['minify-js']);
    gulp.watch('img/**', ['optimize-images']);
    // Reloads the browser whenever HTML or JS files change
    gulp.watch('*.html', browserSync.reload);
    //gulp.watch('_data/**', browserSync.reload);
    gulp.watch('js/**/*.js', browserSync.reload);
});
