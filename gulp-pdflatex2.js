/**
 * @author alvin@omgimanerd.tech
 */

const child_process = require('child_process');
const fs = require('fs');
const gutil = require('gulp-util');
const path = require('path');
const through = require('through2');
const tmp = require('tmp');

const PluginError = gutil.PluginError;

/**
 * Given an Error or a message, this function returns a gutil.PluginError
 * for throwing.
 * @param {Error|string} data The Error object or string to format
 * @return {gutil.PluginError}
 */
var getError = function(data) {
  if (!(data instanceof Error)) {
    data = new Error(data);
  }
  data.message = 'gulp-pdflatex2: ' + data.message;
  return new gutil.PluginError('gulp-pdflatex2', data);
};

var pdflatex2 = function(options = {}) {
  var contextError = null;
  var stream = through.obj(function(file, encoding, callback) {
    var filePath = path.parse(file.path);
    var texInputs = (options.texInputs || []).concat([file.base]).map((dir) => {
      return path.resolve(process.cwd(), dir);
    }).join(':');
    if (process.env.TEXINPUTS) {
      process.env.TEXINPUTS += `:${texInputs}`;
    } else {
      process.env.TEXINPUTS = texInputs;
    };
    if (file.isNull()) {
      return callback(`Null file ${filePath.base} received!`, file);
    }
    tmp.dir({ unsafeCleanup: true }, function(error, tmpDir, cleanup) {
      if (error) {
        return callback(error, file);
      }
      pdflatex = child_process.spawn('/usr/bin/pdflatex', [
        '-shell-escape',
        '-file-line-error',
        '-halt-on-error',
        `-output-directory=${tmpDir}`,
        file.path
      ], {
        env: process.env.TEXINPUTS
      });
      var output = [];
      pdflatex.stdout.on('data', function(data) {
        output.push(data);
      });
      pdflatex.on('close', function(code) {
        var outputPath = path.join(tmpDir, filePath.name + '.pdf');
        filePath.base = null;
        filePath.ext = '.pdf';
        file.path = path.format(filePath);
        if (file.isStream()) {
          try {
            file.contents = fs.createReadStream(outputPath);
          } catch (readStreamError) {
            return callback(readStreamError, file);
          }
        } else if (file.isBuffer()) {
          try {
            file.contents = fs.readFileSync(outputPath);
          } catch (readFileError) {
            return callback(readFileError, file);
          }
        } else {
          cleanup();
          callback(getError(`Error compiling ${filePath.base}!`), file);
        }
        cleanup();
        callback(null, file);
      });
    });
  }).on('error', function(error) {
    contextError = error;
  });
  if (contextError) {
    throw getError(contextError);
  }
  return stream;
};

module.exports = pdflatex2;
