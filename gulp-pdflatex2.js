/**
 * Gulp plugin for compiling .tex files into .pdf files.
 * @author alvin@omgimanerd.tech (Alvin Lin)
 */

const childProcess = require('child_process')
const fs = require('fs-extra')
const gutil = require('gulp-util')
const path = require('path')
const through = require('through2')
const tmp = require('tmp')

const PLUGIN_NAME = 'gulp-pdflatex2'

/**
 * This function creates a copy of process.env and adds/appends to the
 * TEXINPUTS environment variable for the pdflatex child environment.
 * @param {Array<string>} texInputs The list of directories to append to
 *                                  the TEXINPUTS environment variable.
 * @param {string} filePath The path of the original .tex file, which we
 *                          will automatically append to TEXINPUTS.
 * @param {string} separator The separator to use between paths, which
 *                           is ':' on Unix and ';' on Windows. Defaults
 *                           to ':'.
 * @return {Object}
 */
const getChildEnvironment = (texInputs, filePath, separator) => {
  const env = { ...process.env }
  separator = separator || ':'
  // The TEXINPUTS environment variable is extremely strange and cannot
  // seem to handle an empty path between the separator tokens. It also
  // MUST end with the separator token on Windows or it will not be
  // able to load the specified directory. Therefore, we will tokenize
  // the existing TEXINPUTS variables and reformat it ourselves.
  const existingPaths = env.TEXINPUTS.split(separator).filter(Boolean)
  // Add the additional TEXINPUTS paths to the existing paths, the current
  // path, and an empty string at the end to ensure the joined string
  // ends with the separator.
  const fullPaths = existingPaths.concat(texInputs.map(dir => {
    return path.resolve(process.cwd(), dir)
  })).concat([path.dirname(filePath), ''])
  env.TEXINPUTS = fullPaths.join(separator)
  return env
}

/**
 * This function takes an Error object or error message and returns a
 * gutil.PluginError. If null was passed to this function, then null will
 * be returned by the function.
 * @param {?Error|string} data The Error object or error message
 * @return {?gutil.PluginError}
 */
const getError = data => {
  return data ? new gutil.PluginError(PLUGIN_NAME, data) : null
}

/**
 * Returns the gulp stream processing object.
 * @param {Object} options Options for customizing the behavior of the
 *   pdflatex invocation.
 * @return {Object}
 */
const pdflatex2 = (options = {}) => {
  return through.obj((file, encoding, callback) => {
    if (file.isNull()) {
      return callback(getError(`Null file ${file.path} received!`), file)
    }

    let stdout = '', stderr = '', finalError = null
    const cliOptions = options.cliOptions || []
    const keepIntermediateFiles = options.keepIntermediateFiles || false
    const texInputs = options.texInputs || []
    const separator = options.separator || ':'

    // We will store the compiled files from pdflatex in a temporary directory.
    tmp.dir({ unsafeCleanup: true }, (error, tmpDir, cleanup) => {
      if (error) {
        return callback(getError(error), file)
      }

      // We spawn a child process to run the pdflatex command
      const pdflatex = childProcess.spawn('pdflatex', cliOptions.concat([
        '-file-line-error',
        '-halt-on-error',
        '-interaction=nonstopmode',
        `-output-directory=${tmpDir}`,
        file.path
      ]), {
        cwd: tmpDir,
        env: getChildEnvironment(texInputs, file.path, separator)
      })

      // Collect the output from stdout and stderr.
      pdflatex.stdout.on('data', data => { stdout += data })
      pdflatex.stderr.on('data', data => { stderr += data })

      /**
       * Once the pdflatex process is done, we read the compiled files into
       * a stream or buffer.
       */
      pdflatex.on('close', () => {
        /**
         * We need to get the path to the output PDF file in the temporary
         * directory from before.
         */
        const pathObject = path.parse(file.path)
        const outputPath = path.join(tmpDir, `${pathObject.name}.pdf`)

        /**
         * If we are able to get a Stream or Buffer from the output PDF file,
         * then compilation was successful, and we set the file contents to
         * the contents of the output PDF file.
         */
        if (file.isStream()) {
          try {
            file.contents = fs.createReadStream(outputPath)
          } catch (readStreamError) {
            finalError = readStreamError
          }
        } else if (file.isBuffer()) {
          try {
            // eslint-disable-next-line no-sync
            file.contents = fs.readFileSync(outputPath)
          } catch (readFileError) {
            finalError = readFileError
          }
        } else {
          finalError = `Error compiling ${file.path}!`
        }

        /*
         * If we want to keep the intermediate generated files, then we copy
         * them before cleanup.
         */
        if (keepIntermediateFiles) {
          const outputDir = path.join(process.cwd(), keepIntermediateFiles)
          try {
            // eslint-disable-next-line no-sync
            fs.copySync(tmpDir, outputDir)
          } catch (copyError) {
            finalError = copyError
          }
        }

        /**
         * If there was an error, then we log it along with the stdout and
         * stderr from the pdflatex invocation.
         */
        if (finalError) {
          gutil.log(
            gutil.colors.red('Error compiling'),
            gutil.colors.cyan(file.path)
          )
          gutil.log(
            gutil.colors.red('pdflatex output:'),
            `\n${stdout}${stderr}`
          )
        } else {
          // We need to set the new file.path with a .pdf extension.
          file.path = gutil.replaceExtension(file.path, '.pdf')
          gutil.log(
            gutil.colors.green('Compiled'),
            gutil.colors.cyan(file.path)
          )
        }

        /**
         * Call the cleanup() callback to remove the temporary directory
         * and invoke the through2 callback with the final propagated error
         * and the resulting file.
         */
        cleanup()
        callback(getError(finalError), file)
      })
    })
  })
}

module.exports = exports = pdflatex2
