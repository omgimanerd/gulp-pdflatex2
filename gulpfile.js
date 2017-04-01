/**
 * Gulpfile for testing the plugin.
 */

var gulp = require('gulp');
var rename = require('gulp-rename');
var pdflatex = require('../gulp-pdflatex2');

gulp.task('default', ['test']);

gulp.task('test', function() {
  return gulp.src('./tests/*.tex')
    .pipe(pdflatex({
      TEXINPUTS: ['./tests/cls']
    }))
    .pipe(rename(function(path) {
      path.dirname += '/output';
    }))
    .pipe(gulp.dest('./tests'));
});
