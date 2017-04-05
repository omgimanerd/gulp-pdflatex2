/**
 * Gulp plugin for compiling .tex files into .pdf files.
 * @author alvin@omgimanerd.tech (Alvin Lin)
 */

const child_process = require('child_process');
const fs = require('fs');
const gutil = require('gulp-util');
const path = require('path');
const through = require('through2');
const tmp = require('tmp');

const PLUGIN_NAME = 'gulp-pdflatex2';

/**
 * This function creates a copy of process.env and adds/appends to the
 * TEXINPUTS environment variable for the pdflatex child environment.
 * @param {?Array.<string>=} texInputs The list of directories to append
 *                                     the TEXINPUTS environment variable.
 * @param {string} filePath The path of the original .tex file, which we
 *                          will automatically look in.
 * @return {Object}
 */
var getChildEnvironment = function(texInputs = [], filePath) {
  var env = {};
  for (var key in process.env) {
    env[key] = process.env[key];
  }
  texInputs = texInputs.concat([path.dirname(filePath)]).map(function(dir) {
    return path.resolve(process.cwd(), dir);
  }).concat(['']).join(':');
  env.TEXINPUTS = env.TEXINPUTS ? `${env.TEXINPUTS}:{texInputs}` : texInputs;
  return env;
};

/**
 * This function takes an Error object or error message and returns a
 * gutil.PluginError. If null was passed to this function, then null will
 * be returned by the function.
 * @param {?Error|string} data The Error object or error message
 * @return {?gutil.PluginError}
 */
var getError = function(data) {
  return data ? new gutil.PluginError(PLUGIN_NAME, data) : null;
};

var pdflatex2 = function(options = {}) {
  return through.obj(function(file, encoding, callback) {
    if (file.isNull()) {
      return callback(getError(`Null file ${file.path} received!`), file);
    }
    // We will store the stdout and stderr of the pdflatex child process in
    // case there is an error.
    var stdout = '', stderr = '';
    // We will store the compiled files from pdflatex in a temporary directory.
    tmp.dir({ unsafeCleanup: true }, function(error, tmpDir, cleanup) {
      if (error) {
        return callback(getError(error), file);
      }
      // We spawn a child process to run the pdflatex command and capture its
      // output.
      pdflatex = child_process.spawn('pdflatex', [
        '-file-line-error',
        '-halt-on-error',
        `-output-directory=${tmpDir}`,
        file.path
      ], {
        cwd: tmpDir,
        env: getChildEnvironment(options.TEXINPUTS, file.path)
      });
      // This is a hack to prevent pdflatex from hanging when it expects input.
      file.pipe(pdflatex.stdin);
      pdflatex.stdout.on('data', (data) => stdout += data);
      pdflatex.stderr.on('data', (data) => stderr += data);
      // Once the pdflatex process is done, we read the compiled files into
      // a stream or buffer.
      pdflatex.on('close', function(code) {
        // We need to get the path to the output PDF file in the temporary
        // directory from before.
        var pathObject = path.parse(file.path);
        var outputPath = path.join(tmpDir, pathObject.name + '.pdf');
        // If we are able to get a Stream or Buffer from the output PDF file,
        // then compilation was successful, and we set the file contents to
        // the contents of the output PDF file.
        if (file.isStream()) {
          try {
            file.contents = fs.createReadStream(outputPath);
          } catch (readStreamError) {
            error = readStreamError;
          }
        } else if (file.isBuffer()) {
          try {
            file.contents = fs.readFileSync(outputPath);
          } catch (readFileError) {
            error = readFileError;
          }
        } else {
          error = `Error compiling ${p}!`;
        }
        // If there was an error, we log it and then throw the error.
        if (error) {
          gutil.log(
              gutil.colors.red('Error compiling'),
              gutil.colors.cyan(file.path)
          );
          gutil.log(
              gutil.colors.red('pdflatex output:'),
              '\n' + stdout + stderr
          );
        } else {
          file.path = gutil.replaceExtension(file.path, '.pdf');
          gutil.log(
              gutil.colors.green('Compiled'),
              gutil.colors.cyan(file.path)
          );
        }
        // We need to set the new file.path with a .pdf extension.
        // Call the cleanup() callback to remove the temporary directory.
        cleanup();
        return callback(getError(error), file);
      });
    });
  });
};

module.exports = pdflatex2;
