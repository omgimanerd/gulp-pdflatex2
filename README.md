# gulp-pdflatex2
[![npm](https://img.shields.io/npm/v/gulp-pdflatex2.svg)](https://www.npmjs.com/package/gulp-pdflatex2)
[![npm](https://img.shields.io/npm/l/gulp-pdflatex2.svg)](https://spdx.org/licenses/MIT)
[![npm](https://img.shields.io/npm/dt/gulp-pdflatex2.svg)]([![npm](https://img.shields.io/npm/v/npm.svg)](https://www.npmjs.com/package/gulp-pdflatex2))
[![GitHub pull requests](https://img.shields.io/github/issues-pr/omgimanerd/gulp-pdflatex2.svg)](https://github.com/omgimanerd/gulp-pdflatex2/pulls)
[![GitHub issues](https://img.shields.io/github/issues/omgimanerd/gulp-pdflatex2.svg)](https://github.com/omgimanerd/gulp-pdflatex2/issues)

[![GitHub watchers](https://img.shields.io/github/watchers/omgimanerd/gulp-pdflatex2.svg?style=social&label=Watch)](https://github.com/omgimanerd/gulp-pdflatex2/watchers)
[![GitHub forks](https://img.shields.io/github/forks/omgimanerd/gulp-pdflatex2.svg?style=social&label=Fork)](https://github.com/omgimanerd/gulp-pdflatex2/fork)

gulp-pdflatex2 is a wrapper around `pdflatex` for compiling .tex files into
.pdf files. It is an improved version of
[gulp-pdflatex](https://www.npmjs.com/package/gulp-pdflatex) that displays
LaTeX compilation errors instead of suppressing them.

## Installation
```
npm install --save gulp-pdflatex2
```

## Usage
```javascript
// gulp-rename is not required, but very helpful for redirecting your
// .tex files to a specific output directory.
var gulp = require('gulp');
var rename = require('gulp-rename');
var pdflatex2 = require('gulp-pdflatex2');

gulp.task('latex', () => {
  return gulp.src('./*.tex')
    .pipe(pdflatex2({
      cliOptions: ['-shell-escape'],
      keepIntermediateFiles: './tmp',
      texInputs: ['./path/to/cls']
    }))
    .pipe(rename(function(path) {
      path.dirname += '/output';
    }))
    // the compiled pdf file is given to the pipeline
    // specify the keepIntermediateFiles option to store intermediate files
    .pipe(gulp.dest('./'));
});
```

## Options
- `cliOptions`: optional, pass an additional array of command line options to
  the `pdflatex` invocation. Be aware that this package by default specifies
  `-file-line-error`, `-halt-on-error`, `-interaction=nonstopmode`
  and `-output-directory`. Overwriting these manually will result in unexpected
  behavior.
- `keepIntermediateFiles`: optional, pass a directory, relative to the path of
  the gulpfile for the intermediate `.aux`, `.log`, `.toc`, and other
  miscellaneous files to be stored in.
- `texInputs`: optional, pass an array of directories for pdflatex to look
  in for files, useful if you have external class files. This will be used
  to populate the TEXINPUTS environment variable. If one is already defined,
  then whatever is specified in this option will be appended to the existing
  TEXINPUTS environment variable. This is populated by default with the path of
  the file being piped to gulp.

## Author
[![Libraries.io for GitHub](https://img.shields.io/badge/Alvin%20Lin-omgimanerd-blue.svg)](http://omgimanerd.tech)
[![Twitter Follow](https://img.shields.io/twitter/follow/omgimanerd.svg?style=social&label=Follow)](https://twitter.com/omgimanerd)
[![GitHub followers](https://img.shields.io/github/followers/omgimanerd.svg?style=social&label=Follow)](https://github.com/omgimanerd)
