/**
 * Test gulpfile
 * @type {[type]}
 */

var gulp = require('gulp');
var print = require('gulp-print');
var pdflatex = require('../gulp-pdflatex2');

gulp.task('default', ['test']);

gulp.task('test', function() {
  return gulp.src('./*.tex')
    .pipe(print())
    .pipe(pdflatex({
      // texInputs: ['./latex/cls']
    }))
    .pipe(gulp.dest('./output'));
});
