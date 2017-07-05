"use strict";

var gulp = require('gulp'),
		pug = require('gulp-pug'),
		sass = require('gulp-sass'),
		concat = require('gulp-concat'),
		plumber = require('gulp-plumber'),
		autoprefixer = require('gulp-autoprefixer'),
		imagemin = require('gulp-imagemin'),
		svgmin = require('gulp-svgmin'),
		browserSync = require('browser-sync').create();

var useref = require('gulp-useref'),
		gulpif = require('gulp-if'),
		cssmin = require('gulp-clean-css'),
		rename = require('gulp-rename'),
		uglify = require('gulp-uglify'),
		del = require('del'),
		notify = require('gulp-notify'),
		tinypng = require('gulp-tinypng'),
		ftp = require('vinyl-ftp');

var paths = {
			devDir: 'dev/',
			appDir: 'app/',
			buildDir: 'build/'
		};


/*********************************
		Developer tasks
*********************************/

//pug compile
gulp.task('pug', function() {
	return gulp.src([paths.devDir + '*.pug', '!' + paths.devDir + 'template.pug' ])
		.pipe(plumber())
		.pipe(pug({pretty: true}))
		.pipe(gulp.dest(paths.appDir))
		.pipe(browserSync.stream())
});

//sass compile
gulp.task('sass', function() {
	return gulp.src(paths.devDir + '*.sass')
		.pipe(plumber())
		.pipe(sass().on('error', sass.logError))
		.pipe(autoprefixer({
			browsers: ['last 10 versions'],
			cascade: true
		}))
		.pipe(gulp.dest(paths.appDir + 'css/'))
		.pipe(browserSync.stream());
});

//js compile
gulp.task('scripts', function() {
	return gulp.src([
			paths.devDir + '**/*.js',
			'!' + paths.devDir + '_assets/**/*.js'
		])
		.pipe(concat('main.js'))
		.pipe(gulp.dest(paths.appDir + 'js/'))
		.pipe(browserSync.stream());
});

//watch
gulp.task('watch', function() {
	gulp.watch(paths.devDir + '**/*.pug', ['pug']);
	gulp.watch(paths.devDir + '**/*.sass', ['sass']);
	gulp.watch(paths.devDir + '**/*.js', ['scripts']);
});

//server
gulp.task('browser-sync', function() {
	browserSync.init({
		port: 3000,
		server: {
			baseDir: paths.appDir
		},
		notify: false,
	});
});


/*********************************
		Production tasks
*********************************/

//clean
gulp.task('clean', function() { 
	return del.sync(paths.buildDir); 
});

//css + js
gulp.task('build', ['clean'], function () {
	return gulp.src(paths.appDir + '*.html')
		.pipe( useref() )
		.pipe( gulpif('*.js', uglify()) )
		.pipe( gulpif('*.css', cssmin()) )
		.pipe( gulp.dest(paths.buildDir) );
});

//copy images to outputDir
gulp.task('imgBuild', ['clean'], function() {
	return gulp.src([paths.appDir + 'img/**/*.*', '!' + paths.appDir + 'img/svg/**/*.*'])
		.pipe(imagemin())
		.pipe(tinypng('ibn_p-h11JOObrw57_dUAVrpYuv2PB6n'))
		.pipe(gulp.dest(paths.buildDir + 'img/'));
});

//copy svg to outputDir
gulp.task('svgBuild', ['clean'], function() {
	return gulp.src(paths.appDir + 'img/svg/**/*.*')
		.pipe(svgmin({js2svg:{pretty: true}}))
		.pipe(gulp.dest(paths.buildDir + 'img/svg/'));
});

//copy fonts to outputDir
gulp.task('fontsBuild', ['clean'], function() {
	return gulp.src(paths.appDir + '/fonts/**/*.*')
		.pipe(gulp.dest(paths.buildDir + 'fonts/'));
});

//ftp
gulp.task('send', function() {
	var conn = ftp.create({
		host:     '',
		user:     '',
		password: '',
		parallel: 5
	});

	/* list all files you wish to ftp in the glob variable */
	var globs = [
		'build/**/*',
		'!node_modules/**' // if you wish to exclude directories, start the item with an !
	];

	return gulp.src( globs, { base: '.', buffer: false } )
		.pipe( conn.newer( '/' ) ) // only upload newer files
		.pipe( conn.dest( '/' ) )
		.pipe(notify("Dev site updated!"));

});


//default
gulp.task('default', ['browser-sync', 'watch', 'pug', 'sass', 'scripts']);

//production
gulp.task('prod', ['build', 'imgBuild', 'svgBuild', 'fontsBuild']);
