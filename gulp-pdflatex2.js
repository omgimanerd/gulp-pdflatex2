/**
 * Gulp plugin for compiling LaTeX files into PDF files.
 * @author alvin@omgimanerd.tech
 */

const child_process = require('child_process');
const fs = require('fs');
const gutil = require('gulp-util');
const path = require('path');
const through = require('through2');
const tmp = require('tmp');

const PluginError = gutil.PluginError;

const PLUGIN_NAME = 'gulp-pdflatex2';

var pdflatex2 = function(options = {}) {
  var stdout = '';
  var stderr = '';
  var originalFilePath = null;
  var stream = through.obj(function(file, encoding, callback) {
    originalFilePath = file.path;
    var filePath = path.parse(file.path);
    var texInputs = (options.texInputs || []).map((dir) => {
      return path.resolve(process.cwd(), dir);
    }).join(':');
    if (process.env.TEXINPUTS) {
      process.env.TEXINPUTS += `:${texInputs}`;
    } else {
      process.env.TEXINPUTS = texInputs;
    };
    if (file.isNull()) {
      return callback(new Error(`Null file ${filePath.base} received!`), file);
    }
    tmp.dir({ unsafeCleanup: true }, function(error, tmpDir, cleanup) {
      if (error) {
        return callback(error, file);
      }
      pdflatex = child_process.spawn('pdflatex', [
        '-file-line-error',
        '-halt-on-error',
        `-output-directory=${tmpDir}`,
        file.path
      ], {
        cwd: tmpDir,
        env: process.env
      });
      pdflatex.stdout.on('data', function(data) { stdout += data; });
      pdflatex.stderr.on('data', function(data) { stderr += data; });
      pdflatex.on('close', function(code) {
        var outputPath = path.join(tmpDir, filePath.name + '.pdf');
        file.path = path.format({
          dir: filePath.dir,
          name: filePath.name,
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
        callback(error, file);
        if (!error) {
          gutil.log(
            gutil.colors.green('Successfully compiled'),
            gutil.colors.cyan(originalFilePath)
          );
        }
      });
    });
  }).on('error', function(error) {
    gutil.log(
      gutil.colors.red('Error compiling'),
      gutil.colors.cyan(originalFilePath)
    );
    if (error.code === 'ENOENT') {
      gutil.log(gutil.colors.red('pdflatex output:'), '\n' + stdout);
    }
    throw new gutil.PluginError(PLUGIN_NAME, error);
  });
  return stream;
};

module.exports = pdflatex2;
