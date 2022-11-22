/**
 * Gulpfile for testing the plugin.
 */

const gulp = require('gulp')
const rename = require('gulp-rename')

const pdflatex = require('./gulp-pdflatex2.js')

console.log(pdflatex)

const test = () => {
  return gulp.src('./tests/*.tex')
    .pipe(pdflatex({
      cliOptions: ['-shell-escape'],
      keepIntermediateFiles: './tmp',
      texInputs: ['./tests/cls'],
      separator: process.platform === 'win32' ? ';' : ':'
    }))
    .pipe(rename(path => {
      path.dirname += '/output'
    }))
    .pipe(gulp.dest('./tests'));
};

exports.default = test