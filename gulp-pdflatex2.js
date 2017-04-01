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
 * This function searches for lines matching file:line:error in the stdout
 * of the pdflatex process and returns them.
 * @param {string} stdout Output from the pdflatex subprocess
 * @return {string}
 */
var filterStdout = function(stdout) {
  stdout = stdout.split('\n');
  var include = '';
  var error = false;
  for (var line of stdout) {
    if (/[\w\d_\-\/.]+:[\d]+:.+/g.test(line)) {
      if (error) {
        include += line + '\n';
      }
      error = !error;
    }
    if (error) {
      include += line + '\n';
    }
  }
  return include;
};

/**
 * This function creates a copy of process.env and adds/appends to the
 * TEXINPUTS environment variable for the pdflatex child environment.
 * @param {string} texInputs The formatted value to set the environment
 *                           variable to.
 * @return {Object}
 */
var getChildEnvironment = function(texInputs) {
  var env = {};
  for (var key in process.env) {
    env[key] = process.env[key];
  }
  env.TEXINPUTS = env.TEXINPUTS ? `${env.TEXINPUTS}:{texInputs}` : texInputs;
  return env;
};

/**
 * This function takes an Error object or error message and returns a
 * gutil.PluginError.
 * @param {?Error|string} data The Error object or error message
 * @return {?gutil.PluginError}
 */
var getError = function(data) {
  return data ? new gutil.PluginError(PLUGIN_NAME, data) : null;
};

var pdflatex2 = function(options = {}) {
  return through.obj(function(file, encoding, callback) {
    var stdout = '', stderr = '';
    var filePath = file.path;
    var parentDir = path.dirname(file.path);
    var pathObject = path.parse(file.path);
    var texInputs = (options.TEXINPUTS || []).concat([parentDir]).map((dir) => {
      return path.resolve(process.cwd(), dir);
    }).join(':') + ':';
    if (file.isNull()) {
      return callback(getError(`Null file ${pathObject.base} received!`), file);
    }
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
        filePath
      ], {
        cwd: tmpDir,
        env: getChildEnvironment(texInputs)
      });
      // This is a hack to prevent pdflatex from hanging when it expects input.
      file.pipe(pdflatex.stdin);
      pdflatex.stdout.on('data', (data) => stdout += data);
      pdflatex.stderr.on('data', (data) => stderr += data);
      // Once the pdflatex process is done, we read the compiled files into
      // a stream or buffer.
      pdflatex.on('close', function(code) {
        var outputPath = path.join(tmpDir, pathObject.name + '.pdf');
        file.path = path.format({
          dir: pathObject.dir,
          name: pathObject.name,
          ext: '.pdf'
        });
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
        cleanup();
        // If there was an error, we log it and then throw the error.
        if (error) {
          gutil.log(
              gutil.colors.red('Error compiling'),
              gutil.colors.cyan(filePath)
          );
          stdout = options.verbose ? stdout : filterStdout(stdout);
          gutil.log(
              gutil.colors.red('pdflatex output:'),
              '\n' + stdout + stderr
          );
        } else {
          gutil.log(
              gutil.colors.green('Compiled'),
              gutil.colors.cyan(filePath)
          );
        }
        return callback(getError(error), file);
      });
    });
  });
};

module.exports = pdflatex2;
