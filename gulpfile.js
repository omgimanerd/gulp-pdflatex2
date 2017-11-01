/**
 * Gulpfile for testing the plugin.
 */

const gulp = require('gulp')
const rename = require('gulp-rename')
const pdflatex = require('./gulp-pdflatex2')

gulp.task('default', ['test'])

gulp.task('test', () => {
  return gulp.src('./tests/*.tex')
    .pipe(pdflatex({
      cliOptions: ['-shell-escape'],
      keepIntermediateFiles: './tmp',
      texInputs: ['./tests/cls']
    }))
    .pipe(rename(path => {
      path.dirname += '/output'
    }))
    .pipe(gulp.dest('./tests'))
})
