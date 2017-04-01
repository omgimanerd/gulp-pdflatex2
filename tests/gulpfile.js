/**
 * Test gulpfile
 * @type {[type]}
 */

var gulp = require('gulp');
var rename = require('gulp-rename');
var print = require('gulp-print');
var pdflatex = require('../gulp-pdflatex2');

gulp.task('default', ['test']);

gulp.task('test', function() {
  return gulp.src('./*.tex')
    .pipe(print())
    .pipe(pdflatex({
      // texInputs: ['./latex/cls']
    }))
    .pipe(rename((path) => {
      path.basename = 'what';
    }))
    .pipe(gulp.dest('./output'));
});
