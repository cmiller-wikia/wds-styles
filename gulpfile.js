var gulp = require('gulp');

// THESE ARE THE TASKS YOU MIGHT WANT TO RUN

gulp.task('build', ['scss', 'svg'])

gulp.task('clean', ['clean:all'])

gulp.task('svg', ['svg:sprite', 'svg:individual'])

gulp.task('scss', ['scss:build'])

// IMPLEMENTATION

var
    autoprefixer = require('gulp-autoprefixer'),
    debug        = require('gulp-debug'),
    del          = require('del'),
    fs           = require('fs'),
    path         = require('path'),
    rename       = require('gulp-rename'),
    scss         = require('gulp-sass'),
    svgmin       = require('gulp-svgmin'),
    svgo         = require('gulp-svgo'),
  	svgstore     = require('gulp-svgstore');

var buildDir = 'build/'

var tempfiles = [
        buildDir,
        "wds-all.css",
        "svg"
    ]

gulp.task('clean:all', function() {
    return del(tempfiles);
});

gulp.task('scss:build', function () {
        return gulp.src('scss/index.scss')
                .pipe(scss({outputStyle: 'compressed'}))
                .pipe(autoprefixer({
                        browsers: ['last 3 versions'],
                        cascade: false
                }))
               .pipe(rename('wds-all.css'))
                .pipe(gulp.dest('.'));
});

// ** SVG **

function renameSvgFiles(folder) {
	return rename(function (filePath) {
		// Use `id="wds-company-logo-wikia"` for company/logo-wikia.svg
		filePath.basename = 'wds-' + folder + '-' + filePath.basename;
	});
}

function renameSvgSprites() {
	return rename(function (filePath) {
		// Add `sprite-` prefix to the filename
		filePath.basename = 'sprite-' + filePath.basename;
	});
}

function deduplicateIds(folder) {
	return function (file) {
		// Minify and make sure that we don't have duplicated ids in reusable elements
		// Id of <symbol> element is set by svgstore based on the filename, not here
		var prefix = folder + '-' + path.basename(file.relative, path.extname(file.relative));

		return {
			plugins: [{
				cleanupIDs: {
					prefix: prefix + '-',
					minify: true
				}
			}]
		}
	}
}

function getDirectories(dir) {
	return fs.readdirSync(dir)
		.filter(function (file) {
			return fs.statSync(path.join(dir, file)).isDirectory();
		});
}

/**
 * For now we don't need to care about order of tasks so we don't return anything here
 */
gulp.task('svg-sprite', function () {
	var sourceRoot = './assets',
		dest = './dist/svg';

	getDirectories(sourceRoot).forEach(function (directory) {
		gulp
			.src(path.join(sourceRoot, directory, '/*.svg'))
			.pipe(renameSvgFiles(directory))
			.pipe(svgmin(deduplicateIds(directory)))
			.pipe(svgstore({
				inlineSvg: true
			}))
			.pipe(renameSvgSprites())
			.pipe(gulp.dest(dest));
	});
});

/**
 * For now we don't need to care about order of tasks so we don't return anything here
 */
gulp.task('svg-individual', function () {
	var sourceRoot = './assets',
		dest = './dist/svg';

	getDirectories(sourceRoot).forEach(function (directory) {
		gulp
			.src(path.join(sourceRoot, directory, '/*.svg'))
			.pipe(renameSvgFiles(directory))
			.pipe(svgmin(deduplicateIds(directory)))
			.pipe(gulp.dest(dest));
	});
});


gulp.task('svg:clean', function() {
  return del([buildDir + 'svg'/*, 'svg'*/]);
});

gulp.task('svg:optimize', ['svg:clean'], function() {
    return gulp.src('src/svg/**')
        .pipe(svgo())
        .pipe(gulp.dest(buildDir + 'svg'));
});

gulp.task('svg:sprite', ['svg:optimize'], function () {
	var sourceRoot = buildDir + 'svg',
		dest = './svg';

	getDirectories(sourceRoot).forEach(function (directory) {
		gulp
			.src(path.join(sourceRoot, directory, '/*.svg'))
			.pipe(renameSvgFiles(directory))
			.pipe(svgmin(deduplicateIds(directory)))
			.pipe(svgstore({
				inlineSvg: true
			}))
			.pipe(renameSvgSprites())
			.pipe(gulp.dest(dest));
	});
});

gulp.task('svg:individual', ['svg:optimize'], function () {
	var sourceRoot = buildDir + 'svg'
		dest = './svg';

	getDirectories(sourceRoot).forEach(function (directory) {
		gulp
			.src(path.join(sourceRoot, directory, '/*.svg'))
			.pipe(renameSvgFiles(directory))
			.pipe(svgmin(deduplicateIds(directory)))
			.pipe(gulp.dest(dest));
	});
});
