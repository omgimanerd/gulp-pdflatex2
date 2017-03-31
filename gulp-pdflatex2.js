/**
 * @author alvin@omgimanerd.tech
 */

const child_process = require('child_process');
const gutil = require('gulp-util');
const path = require('path');
const through = require('through2');
const tmp = require('tmp');

const PluginError = gutil.PluginError;

var getError = function(data) {
  if (!(data instanceof Error)) {
    data = new Error(data);
  }
  data.message = 'gulp-pdflatex2: ' + data.message;
  return new gutil.PluginError('gulp-pdflatex2', data);
}

var pdflatex2 = function(options = {}) {
  var stream = through.obj(function(file, encoding, callback) {
    var filePath = path.parse(file.path);
    var texInputs = (options.texInputs || []).concat([file.base]).map(dir => {
      return path.resolve(process.cwd(), dir);
    }).join(':');
    process.env.TEXINPUTS = texInputs;
    if (file.isNull()) {
      return callback(getError(`Null file ${filePath.base} received!`), file);
    }
    tmp.dir({ unsafeCleanup: true }, function(error, dir, cleanupCallback) {
      if (error) {
        return callback(getError(error), file);
      }
      pdflatex = child_process.spawn('/usr/bin/pdflatex', [
        '-shell-escape',
        '-file-line-error',
        '-halt-on-error',
        `-output-directory=${dir}`,
        file.path
      ], {
        cwd: dir,
        env: process.env.TEXINPUTS,
        shell: true
      });
      pdflatex.stdout.on('data', function(data) {
        console.log('stdout: ' + data);
      });
      pdflatex.on('close', function(code) {
        console.log(code);
        cleanupCallback();
        callback(null, file);
      });
    });
  }).on('error', function(error) {
    console.log(error);
  });
  return stream;
}

// Exporting the plugin main function
module.exports = pdflatex2;
